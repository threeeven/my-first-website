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
        >
          <div class="diary-title">
            {{ diary.title }}
            <span v-if="diary.pinned" class="pinned-badge">📌 置顶</span>
          </div>
          <div class="diary-meta">
            <span>🕒 {{ formatDate(diary.created_at) }}</span>
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

          <div style="margin-top: 16px;">
            <button @click="handleEdit(diary.id)">✏️ 编辑</button>
            <button class="delete-btn" @click="handleDelete(diary.id)">🗑️ 删除</button>
            <button class="pin-btn" @click="togglePin(diary.id, !diary.pinned)">
              {{ diary.pinned ? '取消置顶' : '置顶' }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="Object.keys(filteredGroupedDiaries).length === 0" class="empty-msg">
        📭 没有找到日记
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';
import SearchBar from './SearchBar.vue';
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';
import type { Diary } from '@/types/diary';
import { formatDate } from '@/utils/helpers';

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
  // 首次加载全量日记（不带任何筛选）
  await store.loadDiaries();
  await checkContentOverflow();
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
</style>