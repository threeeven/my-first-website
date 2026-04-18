<template>
  <div class="search-bar">
    <input v-model="filters.search" placeholder="搜索标题或内容..." />
    <input v-model="filters.tag" placeholder="筛选标签" />
    <input type="date" v-model="filters.startDate" />
    <input type="date" v-model="filters.endDate" />
    <select v-model="filters.isPublic">
      <option value="">全部</option>
      <option value="true">公开</option>
      <option value="false">私密</option>
    </select>
    <button @click="applyFilters">🔍 搜索</button>
    <button @click="resetFilters">重置</button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';

const store = useDiaryStore();
const filters = reactive({
  search: '',
  tag: '',
  startDate: '',
  endDate: '',
  isPublic: '' as '' | 'true' | 'false',
});

function applyFilters() {
  store.loadDiaries({
    search: filters.search,
    tag: filters.tag,
    startDate: filters.startDate,
    endDate: filters.endDate,
    isPublic: filters.isPublic === 'true' ? true : (filters.isPublic === 'false' ? false : undefined),
  });
}

function resetFilters() {
  filters.search = '';
  filters.tag = '';
  filters.startDate = '';
  filters.endDate = '';
  filters.isPublic = '';
  store.resetFilters();
}
</script>