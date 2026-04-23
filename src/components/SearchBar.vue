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
  let startDateParam, endDateParam

  if (filters.startDate) {
      const localDate = new Date(filters.startDate) 
      if (!isNaN(localDate.getTime())) {
          // 构造一个代表本地零点时刻的 Date 对象，然后转换成 UTC 时间戳字符串
          const localStart = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
          startDateParam = localStart.toISOString()
      }
  }

  if (filters.endDate) {
      const localDate = new Date(filters.endDate)
      if (!isNaN(localDate.getTime())) {
          // 构造一个代表本地 23:59:59.999 时刻的 Date 对象，然后转换成 UTC 时间戳字符串
          const localEnd = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 24, 0, 0, 0)
          endDateParam = localEnd.toISOString()
      }
  }
  store.loadDiaries({
    search: filters.search,
    tag: filters.tag,
    startDate: startDateParam,
    endDate: endDateParam,
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

// 暴露给父组件的方法
function setDateRange(startDate: string, endDate: string) {
  filters.startDate = startDate;
  filters.endDate = endDate;
}

function triggerSearch() {
  applyFilters();
}

defineExpose({ setDateRange, triggerSearch });
</script>