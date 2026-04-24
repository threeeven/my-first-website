<template>
  <div class="list-panel">
    <SearchBar ref="SearchBarRef" @filter-change="handleFilterChange" />
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-else>
      <div v-for="(group, yearMonth) in filteredGroupedDiaries" :key="yearMonth">
        <h3 style="margin: 24px 0 12px 0;">📅 {{ yearMonth }}</h3>
        <div
          v-for="diary in group"
          :key="diary.id"
          class="diary-card"
          :class="{ 'pinned-card': diary.pinned }"
          :data-id="diary.id"
          style="position: relative;"
        >
          <!-- 右上角下拉菜单 -->
          <div class="card-menu">
            <button class="menu-btn" @click.stop="toggleMenu(diary.id)">⋮</button>
            <div v-if="activeMenuId === diary.id" class="menu-dropdown">
              <button @click="handleEdit(diary.id)">✏️ 编辑</button>
              <button @click="togglePin(diary.id, !diary.pinned)">
                {{ diary.pinned ? '取消置顶' : '📌 置顶' }}
              </button>
              <button @click="handleDelete(diary.id)" class="delete-menu-item">🗑️ 删除</button>
              <button @click="showVersions(diary.id)">📜 编辑记录</button>
            </div>
          </div>
          
          <div class="diary-title">
            {{ diary.title }}
            <span v-if="diary.pinned" class="pinned-badge">📌 置顶</span>
          </div>
          <div class="diary-meta">
            <span>🕒 {{ formatDate(diary.created_at) }}</span>
            <span v-if="diary.updated_at !== diary.created_at">&nbsp;&nbsp;&nbsp;&nbsp;✏️ 最后编辑于 {{ formatDate(diary.updated_at) }}</span>
            <span :class="diary.is_public ? 'badge-public' : 'badge-private'">
              {{ diary.is_public ? '公开' : '私密' }}
            </span>
            <span>
              🏷️
              <span v-for="tag in diary.tags" :key="tag" class="tag">{{ tag }}</span>
            </span>
          </div>

          <!-- 可折叠内容区域 -->
          <div class="diary-content-wrapper" 
            :class="{ 
              'is-expanded': expandedIds.has(diary.id),
              'has-overflow': contentOverflowMap[diary.id]
            }">
            <MdPreview
              class="diary-content"
              :modelValue="diary.content"
              previewTheme="github"
              codeTheme="github"
            />
          </div>
          <button
            v-if="contentOverflowMap[diary.id]"
            class="toggle-read-more"
            @click="toggleExpand(diary.id)"
          >
            {{ expandedIds.has(diary.id) ? '收起 ▲' : '展开全文 ▼' }}
          </button>

        </div>
      </div>
      <div v-if="Object.keys(filteredGroupedDiaries).length === 0" class="empty-msg">
        📭 没有找到日记
      </div>
    </div>
  </div>

  <!-- 版本弹窗 -->
  <div v-if="versionsModal.visible" class="modal-overlay" @click="closeVersionsModal">
    <div class="modal-content" @click.stop>
      <h3>编辑记录</h3>
      <div v-if="versionsModal.loading">加载中...</div>
      <div v-else>
        <div v-for="ver in versionsModal.versions" :key="ver.id" class="version-item">
          <div class="version-time">{{ formatDate(ver.created_at) }}</div>
          <div class="version-title">{{ ver.title }}</div>
          <!-- 使用 MdPreview 渲染 Markdown 内容，限制高度并允许滚动 -->
          <div class="version-content">
            <MdPreview
              :modelValue="ver.content"
              previewTheme="github"
              codeTheme="github"
            />
          </div>
        </div>
        <div v-if="versionsModal.versions.length === 0">暂无编辑记录</div>
      </div>
      <button @click="closeVersionsModal">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch, reactive} from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';
import SearchBar from './SearchBar.vue';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';
import type { Diary } from '@/types/diary';
import { formatDate } from '@/utils/helpers';
import { fetchDiaryVersions } from '@/api/diary';

// 下拉菜单状态
const activeMenuId = ref<string | null>(null);

// 版本弹窗状态
const versionsModal = reactive({
  visible: false,
  loading: false,
  versions: [] as any[],
});

function toggleMenu(id: string) {
  activeMenuId.value = activeMenuId.value === id ? null : id;
}

// 判断是否有历史版本（可以根据日记的 updated_at 和 created_at 是否不同来初步判断，但更准确的是调用API）
// 我们可以在加载日记列表后，批量检查是否有版本，但为了简单，点击时动态获取，如果没有则提示。
// 为了显示菜单项，可以预先在 store.diaries 中增加一个 hasVersions 标志，但会增加复杂度。
// 简便方法：点击“查看编辑记录”时再获取，如果没有则提示“无编辑记录”。
async function showVersions(diaryId: string) {
  activeMenuId.value = null; // 关闭菜单
  versionsModal.visible = true;
  versionsModal.loading = true;
  try {
    const versions = await fetchDiaryVersions(diaryId);
    versionsModal.versions = versions;
  } catch (err) {
    console.error(err);
    versionsModal.versions = [];
  } finally {
    versionsModal.loading = false;
  }
}

function closeVersionsModal() {
  versionsModal.visible = false;
}

// 点击其他地方关闭菜单
function handleClickOutside(e: MouseEvent) {
  if (activeMenuId.value && !(e.target as HTMLElement).closest('.card-menu')) {
    activeMenuId.value = null;
  }
}

const store = useDiaryStore();
const emit = defineEmits<{ 
  (e: 'edit', diary: Diary): void;
  (e: 'resetDateSelection'): void;   // 新增：通知父组件清除热力图高亮
}>();

const expandedIds = ref<Set<string>>(new Set());
const contentOverflowMap = ref<Record<string, boolean>>({});
const SearchBarRef = ref<InstanceType<typeof SearchBar> | null>(null);

// 当前筛选条件（前端过滤用）
const currentFilters = ref<{
  search?: string;
  tag?: string;
  isPublic?: boolean;
  startDate?: Date;
  endDate?: Date;
}>({});

// 前端过滤后的日记列表（基于 store.diaries 全量数据）
const filteredDiaries = computed(() => {
  let result = store.diaries;

  if (currentFilters.value.search) {
    const kw = currentFilters.value.search.toLowerCase();
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(kw) ||
        d.content.toLowerCase().includes(kw)
    );
  }
  if (currentFilters.value.tag) {
    result = result.filter((d) => d.tags.includes(currentFilters.value.tag!));
  }
  if (currentFilters.value.isPublic !== undefined) {
    result = result.filter((d) => d.is_public === currentFilters.value.isPublic);
  }
  if (currentFilters.value.startDate) {
    const start = new Date(currentFilters.value.startDate);
    start.setHours(0, 0, 0, 0);
    result = result.filter((d) => new Date(d.created_at) >= start);
  }
  if (currentFilters.value.endDate) {
    const end = new Date(currentFilters.value.endDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter((d) => new Date(d.created_at) <= end);
  }

  return result;
});

// 分组显示（基于前端过滤后的日记）
const filteredGroupedDiaries = computed(() => {
  const groups: Record<string, Diary[]> = {};
  for (const d of filteredDiaries.value) {
    const date = new Date(d.created_at);
    const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!groups[yearMonth]) groups[yearMonth] = [];
    groups[yearMonth].push(d);
  }
  return groups;
});

// 处理 SearchBar 的筛选条件变更
function handleFilterChange(filters: any) {
  currentFilters.value = { ...filters };
}

// 根据日期筛选日记（暴露给父组件，用于热力图点击）
// 修改：支持 string | null 类型
function filterByDate(date: string | null) {
  if (SearchBarRef.value) {
    if (!date) {
      // 清除日期筛选（不影响其他条件）
      SearchBarRef.value.clearDateRangeOnly();
    } else {
      SearchBarRef.value.setDateRange(date, date);
    }
  }
}

// 暴露方法给父组件 App.vue
defineExpose({ filterByDate });

// 编辑、删除、置顶等操作（这些操作会修改 store.diaries，但 filteredDiaries 会响应更新）
function handleEdit(id: string) {
  const diary = store.diaries.find((d) => d.id === id);
  if (diary) emit('edit', diary);
}

async function handleDelete(id: string) {
  if (confirm('确定删除这篇日记吗？')) {
    await store.removeDiary(id);
  }
}

async function togglePin(id: string, pinned: boolean) {
  await store.togglePin(id, pinned);
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
  expandedIds.value = new Set(expandedIds.value);
}

// 检测内容是否溢出（用于“展开全文”按钮）
async function checkContentOverflow() {
  await nextTick();
  const cards = document.querySelectorAll('.diary-card');
  for (const card of cards) {
    const id = card.getAttribute('data-id');
    if (!id) continue;
    const contentWrapper = card.querySelector('.diary-content-wrapper');
    if (contentWrapper) {
      const isOverflow = contentWrapper.scrollHeight > 200;
      if (isOverflow !== contentOverflowMap.value[id]) {
        contentOverflowMap.value = {
          ...contentOverflowMap.value,
          [id]: isOverflow,
        };
      }
    }
  }
}

// 监听筛选条件变化：如果日期范围被清除了，则通知父组件清除热力图高亮
watch(
  () => currentFilters.value,
  (newFilters) => {
    if (!newFilters.startDate && !newFilters.endDate) {
      emit('resetDateSelection');
    }
  },
  { deep: true }
);

// 监听 store.diaries 变化（如增删改时重新检测溢出）
watch(
  () => store.diaries,
  async () => {
    await checkContentOverflow();
  },
  { deep: true }
);

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  // 首次加载全量日记（不带任何筛选）
  await store.loadDiaries();
  await checkContentOverflow();
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 默认收起状态（没有 is-expanded 类） */
.diary-content-wrapper:not(.is-expanded) {
  max-height: 200px;
  overflow: hidden;
  position: relative;
}

/* 只有 has-overflow 的卡片在收起状态下才显示渐变遮罩 */
.diary-content-wrapper.has-overflow:not(.is-expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, white);
  pointer-events: none;
}

/* 展开状态：移除 max-height 和渐变 */
.diary-content-wrapper.is-expanded {
  max-height: none;
  overflow: visible;
}

.diary-content-wrapper.is-expanded::after {
  display: none;
}

.card-menu {
  position: absolute;
  top: 12px;
  right: 12px;
}
.menu-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 4px;
}
.menu-dropdown {
  position: absolute;
  top: 28px;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  z-index: 10;
  min-width: 130px;
}
.menu-dropdown button {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-primary);
}
.menu-dropdown button:hover {
  background: var(--bg-primary);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: var(--bg-surface);
  border-radius: var(--radius);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
}
.version-item {
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
}
.version-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.version-title {
  font-weight: 600;
  margin: 4px 0;
}
.version-content {
  max-height: 200px;
  overflow-y: auto;
  /* background: var(--bg-primary); */
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.version-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}
.delete-menu-item {
  color: var(--danger) !important;
}
.delete-menu-item:hover {
  background: var(--danger) !important;
  color: white !important;
}
</style>