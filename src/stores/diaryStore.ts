import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Diary } from '@/types/diary';
import { fetchDiaries, createDiary, updateDiary, deleteDiary, type FetchParams } from '@/api/diary';

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref<Diary[]>([]);
  const loading = ref(false);
  const currentFilters = ref<FetchParams>({});

  async function loadDiaries(filters?: FetchParams) {
    if (filters) currentFilters.value = { ...currentFilters.value, ...filters };
    loading.value = true;
    try {
      diaries.value = await fetchDiaries(currentFilters.value);
    } finally {
      loading.value = false;
    }
  }

  async function saveDiary(data: Omit<Diary, 'id' | 'created_at' | 'updated_at'>, id?: string) {
    if (id) {
      await updateDiary(id, data);
    } else {
      await createDiary(data as any);
    }
    await loadDiaries(); // 刷新列表
  }

  async function removeDiary(id: string) {
    await deleteDiary(id);
    await loadDiaries();
  }

  function resetFilters() {
    currentFilters.value = {};
    loadDiaries();
  }

  return { diaries, loading, currentFilters, loadDiaries, saveDiary, removeDiary, resetFilters };
});