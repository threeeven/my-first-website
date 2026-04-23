<template>
  <div class="search-bar">
    <input
      type="text"
      v-model="localFilters.search"
      placeholder="搜索标题或内容..."
      @keyup.enter="applyFilters"
    />
    <input
      type="text"
      v-model="localFilters.tag"
      placeholder="筛选标签 (如: 生活)"
      @keyup.enter="applyFilters"
    />

    <!-- 日期范围选择器 -->
    <Datepicker
      v-model="dateRange"
      range
      :clearable="true"
      placeholder="选择日期范围"
      :format="dateFormat"
      class="date-range-picker"
      @cleared="clearDateRange"
    />

    <select v-model="localFilters.isPublic">
      <option value="">全部</option>
      <option value="true">公开</option>
      <option value="false">私密</option>
    </select>

    <button @click="applyFilters">🔍 搜索</button>
    <button @click="resetFilters">重置</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/style.css';

const store = useDiaryStore();

// 本地筛选条件
const localFilters = reactive({
  search: '',
  tag: '',
  isPublic: '' as '' | 'true' | 'false',
});

// 日期范围绑定的数组 [startDate, endDate]
const dateRange = ref<[Date | null, Date | null]>([null, null]);

// 日期格式化函数
const dateFormat = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const applyFilters = () => {
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (dateRange.value[0]) {
    // 开始日期：当天 00:00:00 UTC
    const start = new Date(dateRange.value[0]);
    start.setUTCHours(0, 0, 0, 0);
    startDate = start.toISOString();
  }
  if (dateRange.value[1]) {
    // 结束日期：当天 23:59:59 UTC
    const end = new Date(dateRange.value[1]);
    end.setUTCHours(23, 59, 59, 999);
    endDate = end.toISOString();
  }

  store.loadDiaries({
    search: localFilters.search || undefined,
    tag: localFilters.tag || undefined,
    startDate,
    endDate,
    isPublic: localFilters.isPublic === 'true' ? true : (localFilters.isPublic === 'false' ? false : undefined),
  });
};

const resetFilters = () => {
  localFilters.search = '';
  localFilters.tag = '';
  localFilters.isPublic = '';
  dateRange.value = [null, null];
  store.resetFilters();
};

// 当日期选择器的清空按钮被点击时触发
const clearDateRange = () => {
  dateRange.value = [null, null];
  applyFilters();
};

// 监听日期范围变化，自动搜索（可选，如果你希望选择后立即搜索）
watch(dateRange, () => {
  applyFilters();
});

// 监听回车事件已经在 input 上处理，无需额外

// 暴露给父组件的方法
function setDateRange(start: string, end: string) {
  // 将字符串日期转换为 Date 对象
  dateRange.value = [new Date(start), new Date(end)];
}

function triggerSearch() {
  applyFilters();
}

// 暴露方法
defineExpose({
  setDateRange,
  triggerSearch,
});

</script>

<style scoped>
/* 日期选择器宽度自适应 */
.date-range-picker {
  flex: 1 0 auto;
  min-width: 200px;
}

/* 确保输入框和选择器在移动端适配 */
@media (max-width: 640px) {
  .date-range-picker {
    width: 100%;
  }
}
</style>