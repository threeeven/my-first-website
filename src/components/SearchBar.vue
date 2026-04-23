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

// 暴露给父组件的方法
/**
 * 设置日期筛选范围（支持本地日期自动转换为 UTC 时间戳范围）
 * @param startDate - 本地日期字符串 "YYYY-MM-DD" 或完整的 ISO 字符串
 * @param endDate - 同上，如果只传一个日期，则 startDate 和 endDate 会取同一日范围
 */
function setDateRange(startDate: string, endDate?: string) {
  // 如果只传了一个参数，则默认查询该日全天（本地时区）
  if (!endDate) {
    // 解析本地日期字符串
    const [year, month, day] = startDate.split('-').map(Number);
    // 构造本地时区的当天开始时间（00:00:00）和结束时间（23:59:59.999）
    const localStart = new Date(year!, month! - 1, day, 0, 0, 0, 0);
    const localEnd = new Date(year!, month! - 1, day, 23, 59, 59, 999);
    // 转换为 UTC ISO 字符串（例如 "2025-04-23T16:00:00.000Z"）
    filters.startDate = localStart.toISOString();
    filters.endDate = localEnd.toISOString();
  } else {
    // 如果传了两个参数，也进行同样转换（支持直接传入 ISO 字符串）
    const parseDateToUTCRange = (dateStr: string) => {
      // 如果已经是 ISO 字符串则直接返回，否则按本地日期处理
      if (dateStr.includes('T') || dateStr.includes('Z')) return dateStr;
      const [y, m, d] = dateStr.split('-').map(Number);
      const localTime = new Date(y!, m! - 1, d, 0, 0, 0, 0);
      return localTime.toISOString();
    };
    filters.startDate = parseDateToUTCRange(startDate);
    filters.endDate = parseDateToUTCRange(endDate);
  }
}

function triggerSearch() {
  applyFilters();
}

defineExpose({ setDateRange, triggerSearch });
</script>