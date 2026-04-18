<template>
  <div>
    <SearchBar />
    <div v-if="store.loading">加载中...</div>
    <div v-else>
      <div v-for="(group, yearMonth) in groupedDiaries" :key="yearMonth">
        <h3>📅 {{ yearMonth }}</h3>
        <DiaryCard
          v-for="diary in group"
          :key="diary.id"
          :diary="diary"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
      <div v-if="Object.keys(groupedDiaries).length === 0" class="empty-msg">📭 没有找到日记</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';
import DiaryCard from './DiaryCard.vue';
import SearchBar from './SearchBar.vue';
import type { Diary } from '@/types/diary';

const store = useDiaryStore();
const emit = defineEmits<{ (e: 'edit', diary: Diary): void }>();

const groupedDiaries = computed(() => {
  const groups: Record<string, Diary[]> = {};
  for (const d of store.diaries) {
    const date = new Date(d.created_at);
    const ym = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!groups[ym]) groups[ym] = [];
    groups[ym].push(d);
  }
  return groups;
});

function handleEdit(id: string) {
  const diary = store.diaries.find(d => d.id === id);
  if (diary) emit('edit', diary);
}

function handleDelete(id: string) {
  if (confirm('确定删除吗？')) store.removeDiary(id);
}
</script>