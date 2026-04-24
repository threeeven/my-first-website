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

    <!-- 日期范围选择器 (使用两个独立 Datepicker) -->
    <div class="date-range-wrapper">
      <Datepicker
        v-model="startDate"
        :clearable="true"
        :inputFormat="dateFormatPattern"
        placeholder="开始日期"
        @cleared="handleStartCleared"
      />
      <span class="date-separator">至</span>
      <Datepicker
        v-model="endDate"
        :clearable="true"
        :inputFormat="dateFormatPattern"
        placeholder="结束日期"
        @cleared="handleEndCleared"
      />
    </div>

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
import Datepicker from 'vue3-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'; // 保留原有样式（若需要可移除，此处不影响）

// 筛选条件类型
interface FilterOptions {
  search?: string;
  tag?: string;
  isPublic?: boolean;
  startDate?: Date;
  endDate?: Date;
}

const emit = defineEmits<{
  (e: 'filter-change', filters: FilterOptions): void;
}>();

// 本地筛选条件（文本、下拉框）
const localFilters = reactive({
  search: '',
  tag: '',
  isPublic: '' as '' | 'true' | 'false',
});

// 日期范围：两个单独的 ref
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);

// 日期显示格式 (date-fns 模式)
const dateFormatPattern = 'yyyy-MM-dd';

// 应用筛选：组装条件并发射事件
const applyFilters = () => {
  const filters: FilterOptions = {};

  if (localFilters.search.trim()) filters.search = localFilters.search.trim();
  if (localFilters.tag.trim()) filters.tag = localFilters.tag.trim();
  if (localFilters.isPublic === 'true') filters.isPublic = true;
  if (localFilters.isPublic === 'false') filters.isPublic = false;
  if (startDate.value) filters.startDate = startDate.value;
  if (endDate.value) filters.endDate = endDate.value;

  emit('filter-change', filters);
};

// 新增：仅清除日期范围，保留其他筛选条件
function clearDateRangeOnly() {
  startDate.value = null;
  endDate.value = null;
  applyFilters();  // 触发筛选更新，此时 filter-change 事件中不包含日期字段
}


// 重置所有筛选
const resetFilters = () => {
  localFilters.search = '';
  localFilters.tag = '';
  localFilters.isPublic = '';
  startDate.value = null;
  endDate.value = null;
  emit('filter-change', {});
};

// 清除开始日期时的处理（若开始日期被清除，结束日期也应清除？可根据业务调整）
const handleStartCleared = () => {
  startDate.value = null;
  applyFilters();
};

// 清除结束日期
const handleEndCleared = () => {
  endDate.value = null;
  applyFilters();
};

// 监听开始或结束日期的变化，自动搜索
watch([startDate, endDate], () => {
  applyFilters();
});

// 暴露给父组件的方法（与之前保持一致）
function setDateRange(start: string, end: string) {
  startDate.value = new Date(start);
  endDate.value = new Date(end);
}
function triggerSearch() {
  applyFilters();
}

defineExpose({
  setDateRange,
  triggerSearch,
  clearDateRangeOnly
});
</script>

<style scoped>
/* 原有的样式保持不变，仅微调日期范围包装器 */
.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.date-range-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 0 auto;
  min-width: 240px;
}

.date-separator {
  color: #666;
  font-size: 0.9rem;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .date-range-wrapper {
    width: 100%;
  }
}
</style>