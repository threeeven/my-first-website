<template>
  <div class="list-panel">
    <SearchBar />
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-else>
      <div v-for="(group, yearMonth) in groupedDiaries" :key="yearMonth">
        <h3 style="margin: 24px 0 12px 0;">📅 {{ yearMonth }}</h3>
        <div
          v-for="diary in group"
          :key="diary.id"
          class="diary-card"
          :class="{ 'pinned-card': diary.pinned }"
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
          <div class="diary-content-wrapper" :class="{ 'is-expanded': expandedIds.has(diary.id) }">
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

const expandedIds = ref<Set<string>>(new Set());
const contentOverflowMap = ref<Record<string, boolean>>({});

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

async function checkContentOverflow() {
  await nextTick();
  const cards = document.querySelectorAll('.diary-card');
  for (const card of cards) {
    const id = card.getAttribute('data-id');
    if (!id) continue;
    const contentWrapper = card.querySelector('.diary-content-wrapper');
    if (contentWrapper) {
      const isOverflow = contentWrapper.scrollHeight > 300;
      if (isOverflow !== contentOverflowMap.value[id]) {
        contentOverflowMap.value = {
          ...contentOverflowMap.value,
          [id]: isOverflow,
        };
      }
    }
  }
}

watch(() => store.diaries, async () => {
  await checkContentOverflow();
}, { deep: true });

onMounted(async () => {
  await store.loadDiaries();
  await checkContentOverflow();
});
</script>

<style scoped>
.diary-content-wrapper {
  max-height: 300px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  position: relative;
}
.diary-content-wrapper.is-expanded {
  max-height: none;
}
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
.pinned-card {
  border-left: 4px solid var(--accent);
  background: var(--bg-surface);
}
.pinned-badge {
  font-size: 0.7rem;
  background: var(--accent);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
  vertical-align: middle;
}
.pin-btn {
  background: none;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  margin-left: 0.5rem;
}
.pin-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
</style>