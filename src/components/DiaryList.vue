<template>
  <div class="list-panel">
    <SearchBar />
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-else>
      <div v-for="(group, yearMonth) in groupedDiaries" :key="yearMonth">
        <h3 style="margin: 24px 0 12px 0;">📅 {{ yearMonth }}</h3>
        <div v-for="diary in group" :key="diary.id" class="diary-card">
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
          <!-- Markdown 预览 -->
          <MdPreview
            class="diary-content"
            :modelValue="diary.content"
            previewTheme="github"
            codeTheme="github"
          />
          <!-- 如果仍然需要展示单独的图片（保留兼容） -->
          <img v-if="diary.image_url" :src="diary.image_url" class="diary-image" />
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
import { computed, onMounted } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';
import SearchBar from './SearchBar.vue';
import { MdPreview } from 'md-editor-v3';
import type { Diary } from '@/types/diary';
import { formatDate } from '@/utils/helpers';
import 'md-editor-v3/lib/preview.css';

const store = useDiaryStore();
const emit = defineEmits<{ (e: 'edit', diary: Diary): void }>();

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

onMounted(() => {
  store.loadDiaries();
});
</script>

<style scoped>
/* 列表区域样式已在全局 CSS 中定义，此处无需重复 */
.list-panel {
  width: 100%;
}
</style>