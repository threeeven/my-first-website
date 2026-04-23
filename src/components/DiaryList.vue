<template>
  <div class="list-panel">
    <SearchBar />
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-else>
      <div v-for="(group, yearMonth) in groupedDiaries" :key="yearMonth">
        <h3 style="margin: 24px 0 12px 0;">📅 {{ yearMonth }}</h3>
        <div v-for="diary in group" :key="diary.id" class="diary-card" :data-id="diary.id">
          <div class="diary-title">{{ diary.title }}</div>
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
          
          <!-- 可折叠的内容区域 -->
          <div class="diary-content-wrapper" :class="{ 'is-expanded': expandedIds.has(diary.id) }">
            <MdPreview
              class="diary-content"
              :modelValue="diary.content"
              previewTheme="github"
              codeTheme="github"
            />
          </div>
          
          <!-- 展开/收起按钮（仅当内容高度超过阈值时显示） -->
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
          </div>
        </div>
      </div>
      <div v-if="Object.keys(groupedDiaries).length === 0" class="empty-msg">
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
const emit = defineEmits<{ (e: 'edit', diary: Diary): void }>();

// 存储展开状态的日记ID
const expandedIds = ref<Set<string>>(new Set());
// 存储哪些日记的内容高度超过了阈值
const contentOverflowMap = ref<Record<string, boolean>>({});

// 按年月分组
const groupedDiaries = computed(() => {
  const groups: Record<string, Diary[]> = {};
  for (const d of store.diaries) {
    const date = new Date(d.created_at);
    const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!groups[yearMonth]) groups[yearMonth] = [];
    groups[yearMonth].push(d);
  }
  return groups;
});

function handleEdit(id: string) {
  const diary = store.diaries.find(d => d.id === id);
  if (diary) emit('edit', diary);
}

async function handleDelete(id: string) {
  if (confirm('确定删除这篇日记吗？')) {
    await store.removeDiary(id);
  }
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
  // 触发响应式更新
  expandedIds.value = new Set(expandedIds.value);
}

// 检测每个日记的内容区域是否溢出（高度超过 300px）
async function checkContentOverflow() {
  // 等待 DOM 渲染完成
  await nextTick();
  const cards = document.querySelectorAll('.diary-card');
  for (const card of cards) {
    const id = card.getAttribute('data-id');
    if (!id) continue;
    const contentWrapper = card.querySelector('.diary-content-wrapper');
    if (contentWrapper) {
      const isOverflow = contentWrapper.scrollHeight > 300; // 阈值 300px
      if (isOverflow !== contentOverflowMap.value[id]) {
        contentOverflowMap.value = {
          ...contentOverflowMap.value,
          [id]: isOverflow,
        };
      }
    }
  }
}

// 监听日记列表变化，重新检测溢出
watch(() => store.diaries, async () => {
  await checkContentOverflow();
}, { deep: true });

onMounted(async () => {
  await store.loadDiaries();
  await checkContentOverflow();
});
</script>

<style scoped>
/* 内容包装器：默认最大高度 300px，溢出隐藏 */
.diary-content-wrapper {
  max-height: 300px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  position: relative;
}

/* 展开状态：移除最大高度限制 */
.diary-content-wrapper.is-expanded {
  max-height: none;
}

/* 可选：在折叠状态下添加渐隐效果（让用户感知有更多内容） */
.diary-content-wrapper:not(.is-expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, var(--bg-surface));
  pointer-events: none;
}

/* 展开/收起按钮样式 */
.toggle-read-more {
  background: none;
  color: var(--accent);
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 2rem;
}

.toggle-read-more:hover {
  background: var(--accent);
  color: white;
}

/* 确保卡片有 data-id 属性用于检测（我们需要在模板中添加） */
.diary-card {
  /* 已有样式保持不变 */
  position: relative;
}
</style>