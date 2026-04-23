<template>
  <div class="heatmap-container">
    <h3>📅 日记热力图（最近120天）</h3>
    <div class="heatmap-wrapper">
      <div class="weekday-labels">
        <div class="weekday-cell">日</div>
        <div class="weekday-cell">一</div>
        <div class="weekday-cell">二</div>
        <div class="weekday-cell">三</div>
        <div class="weekday-cell">四</div>
        <div class="weekday-cell">五</div>
        <div class="weekday-cell">六</div>
      </div>
      <div class="heatmap-grid">
        <div class="month-labels" :style="{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }">
          <div
            v-for="(month, idx) in monthLabels"
            :key="idx"
            class="month-label"
            :style="{ gridColumn: `span ${month.span}` }"
          >
            {{ month.name }}
          </div>
        </div>
        <div
          class="heatmap-cells"
          :style="{ gridTemplateRows: `repeat(7, 1fr)`, gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }"
        >
          <div
            v-for="(cell, idx) in cells"
            :key="idx"
            class="heatmap-cell"
            :data-date="cell.dateStr"
            :data-count="cell.count"
            :style="{ backgroundColor: getColor(cell.count) }"
            :title="`${cell.dateStr} 有 ${cell.count} 篇日记`"
            @click="goToDate(cell.dateStr)"
          >
            <span class="cell-day">{{ cell.day }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Diary } from '@/types/diary';

const props = defineProps<{
  diaries: Diary[];
}>();

const emit = defineEmits<{
  (e: 'dateSelected', dateStr: string): void;
}>();

// 辅助工具函数
function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 生成日期范围和周数
const today = new Date();
today.setHours(0, 0, 0, 0);

// 开始日期：今天往前推119天，然后调整到最近的周日
let start = new Date(today);
start.setDate(today.getDate() - 119);
while (start.getDay() !== 0) {
  start.setDate(start.getDate() - 1);
}
const startDate = start; // 固定起始日期

// 生成日期列表（长度 >= 120，并且是7的倍数，方便网格）
const dateList: Date[] = [];
const cursor = new Date(startDate);
while (dateList.length < 120) {
  dateList.push(new Date(cursor));
  cursor.setDate(cursor.getDate() + 1);
}
const totalWeeks = Math.ceil(dateList.length / 7); // 总列数

// 构建单元格
const cells = computed(() => {
  const cellsArray: Array<{
    dateStr: string;
    day: number;
    count: number;
  }> = [];

  // 统计日记数量按日期聚合
  const countMap = new Map<string, number>();
  for (const diary of props.diaries) {
    const localDate = new Date(diary.created_at);
    localDate.setHours(0, 0, 0, 0);
    const dateKey = formatDateStr(localDate);
    countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
  }

  for (const d of dateList) {
    const dateStr = formatDateStr(d);
    const count = countMap.get(dateStr) || 0;
    cellsArray.push({
      dateStr,
      day: d.getDate(),
      count,
    });
  }
  return cellsArray;
});

// 计算月份标签（基于每个星期的起始日期）
const monthLabels = computed(() => {
  const labels: { name: string; span: number }[] = [];
  let currentWeek = 0;
  while (currentWeek < totalWeeks) {
    // 当前周的第一天日期
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + currentWeek * 7);
    const month = weekStart.getMonth();
    const monthName = `${weekStart.getFullYear()}年${month + 1}月`;
    let span = 1;
    // 看后续几周属于同一个月
    for (let nextWeek = currentWeek + 1; nextWeek < totalWeeks; nextWeek++) {
      const nextWeekStart = new Date(startDate);
      nextWeekStart.setDate(startDate.getDate() + nextWeek * 7);
      if (nextWeekStart.getMonth() === month) {
        span++;
      } else {
        break;
      }
    }
    labels.push({ name: monthName, span });
    currentWeek += span;
  }
  return labels;
});

function getColor(count: number): string {
  if (count === 0) return '#ebedf0';
  if (count === 1) return '#c6e48b';
  if (count === 2) return '#7bc96f';
  if (count === 3) return '#239a3b';
  return '#196127';
}

function goToDate(dateStr: string) {
  emit('dateSelected', dateStr);
}
</script>

<style scoped>
.heatmap-container {
  background: var(--bg-surface);
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.heatmap-wrapper {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}
.weekday-labels {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 2rem;
}
.weekday-cell {
  height: 2rem;
  line-height: 2rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.heatmap-grid {
  flex: 1;
  min-width: 0;
}
.month-labels {
  display: grid;
  margin-bottom: 0.25rem;
}
.month-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
}
.heatmap-cells {
  display: grid;
  gap: 0.25rem;
}
.heatmap-cell {
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s;
}
.heatmap-cell:hover {
  transform: scale(1.05);
  filter: brightness(0.95);
}
.cell-day {
  font-size: 0.7rem;
  color: #1f2937;
  font-weight: 500;
  text-shadow: 0 0 1px white;
}
@media (prefers-color-scheme: dark) {
  .cell-day {
    color: #f1f5f9;
    text-shadow: none;
  }
}
</style>