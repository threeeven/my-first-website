<template>
  <div class="heatmap-container">
    <h3>📅 日记热力图（最近120天）</h3>
    <div class="heatmap-wrapper">
      <!-- 星期标签列 -->
      <div class="weekday-labels" :style="{ gridTemplateRows: `repeat(7, 1fr)` }">
        <div class="weekday-cell">日</div>
        <div class="weekday-cell">一</div>
        <div class="weekday-cell">二</div>
        <div class="weekday-cell">三</div>
        <div class="weekday-cell">四</div>
        <div class="weekday-cell">五</div>
        <div class="weekday-cell">六</div>
      </div>

      <div class="heatmap-grid">
        <!-- 月份标签行 -->
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

        <!-- 热力网格 -->
        <div
          class="heatmap-cells"
          :style="{
            gridTemplateRows: `repeat(7, 1fr)`,
            gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`
          }"
        >
          <template v-for="row in 7" :key="row">
            <div
              v-for="col in totalWeeks"
              :key="`${row}-${col}`"
              class="heatmap-cell"
              :class="{ 
                'empty-cell': !gridData[row-1][col-1],
                'selected': gridData[row-1][col-1] && gridData[row-1][col-1].dateStr === selectedDateStr
              }"
              :style="gridData[row-1][col-1] ? { backgroundColor: getColor(gridData[row-1][col-1].count) } : {}"
              @click="gridData[row-1][col-1] && goToDate(gridData[row-1][col-1].dateStr)"
            >
              <span class="cell-day" v-if="gridData[row-1][col-1]">
                {{ gridData[row-1][col-1].day }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Diary } from '@/types/diary';
import { useDiaryStore } from '@/stores/diaryStore';

const store = useDiaryStore();

const emit = defineEmits<{
  (e: 'dateSelected', dateStr: string | null): void;
}>();

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const totalDays = 120;
const today = new Date();
today.setHours(0, 0, 0, 0);

let start = new Date(today);
start.setDate(today.getDate() - (totalDays - 1));
while (start.getDay() !== 0) {
  start.setDate(start.getDate() - 1);
}

const dateList: Date[] = [];
const cursor = new Date(start);
while (cursor <= today) {
  dateList.push(new Date(cursor));
  cursor.setDate(cursor.getDate() + 1);
}

const totalWeeks = Math.ceil(dateList.length / 7);

const countMap = computed(() => {
  const map = new Map<string, number>();
  for (const diary of store.diaries) {
    const localDate = new Date(diary.created_at);
    localDate.setHours(0, 0, 0, 0);
    const dateKey = formatDateStr(localDate);
    map.set(dateKey, (map.get(dateKey) || 0) + 1);
  }
  return map;
});

const gridData = computed(() => {
  const grid: Array<Array<{ dateStr: string; day: number; count: number } | null>> = Array(7)
    .fill(null)
    .map(() => Array(totalWeeks).fill(null));

  for (let i = 0; i < dateList.length; i++) {
    const d = dateList[i]!;
    const dateStr = formatDateStr(d);
    const day = d.getDate();
    const count = countMap.value.get(dateStr) || 0;

    const col = Math.floor(i / 7);
    const row = i % 7;
    if (col < totalWeeks) {
      grid[row][col] = { dateStr, day, count };
    }
  }
  return grid;
});

const monthLabels = computed(() => {
  const columnDates: Date[] = [];
  for (let col = 0; col < totalWeeks; col++) {
    const date = new Date(start);
    date.setDate(start.getDate() + col * 7);
    columnDates.push(date);
  }

  const labels: { name: string; span: number }[] = [];
  let i = 0;
  while (i < columnDates.length) {
    const currentDate = columnDates[i];
    const currentMonth = currentDate.getMonth();
    const monthName = `${currentMonth + 1}月`;
    let span = 1;
    for (let j = i + 1; j < columnDates.length; j++) {
      if (columnDates[j].getMonth() === currentMonth) {
        span++;
      } else {
        break;
      }
    }
    labels.push({ name: monthName, span });
    i += span;
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

const selectedDateStr = ref<string | null>(null);

function goToDate(dateStr: string) {
  if (selectedDateStr.value === dateStr) {
    // 再次点击同一日期：取消高亮，通知清除筛选
    selectedDateStr.value = null;
    emit('dateSelected', null);
  } else {
    selectedDateStr.value = dateStr;
    emit('dateSelected', dateStr);
  }
}

// 暴露清除高亮的方法，供父组件在重置筛选时调用
function clearSelection() {
  selectedDateStr.value = null;
}

defineExpose({ clearSelection });
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
  justify-content: space-around;
  width: 2.2rem;       /* 星期标签列固定宽度，不易过大 */
  flex-shrink: 0;
  gap: 0.2rem;
}
.weekday-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  height: auto;
  flex: 1;
  background: transparent;
}
.heatmap-grid {
  flex: 1;
  min-width: 0;
}
.month-labels {
  display: grid;
  margin-bottom: 0.25rem;
  gap: 0.2rem;
  grid-template-columns: repeat(v-bind(totalWeeks), minmax(0, 1fr));
}
.month-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.heatmap-cells {
  display: grid;
  gap: 0.2rem;
  grid-template-rows: repeat(7, minmax(0, 1fr));
  grid-template-columns: repeat(v-bind(totalWeeks), minmax(0, 1fr));
}
.heatmap-cell {
  aspect-ratio: 1 / 1;   /* 保持正方形 */
  width: 100%;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s, filter 0.1s;
  background-color: #ebedf0;
}
.heatmap-cell.empty-cell {
  background-color: transparent !important;
  cursor: default;
  pointer-events: none;
}
.heatmap-cell:not(.empty-cell):hover {
  transform: scale(1.05);
  filter: brightness(0.95);
}
.cell-day {
  font-size: 0.65rem;
  color: #1f2937;
  font-weight: 500;
  text-shadow: 0 0 1px white;
}
@media (prefers-color-scheme: dark) {
  .cell-day {
    color: #f1f5f9;
    text-shadow: none;
  }
  .heatmap-cell.empty-cell {
    background-color: transparent;
  }
}

.heatmap-cell.selected {
  outline: 2px solid #3b82f6;     /* 蓝色外轮廓 */
  outline-offset: 2px;            /* 略微外扩，不占用内部空间 */
  position: relative;
  z-index: 1;                     /* 确保轮廓在其他内容之上 */
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .heatmap-cell.selected {
    outline-color: #60a5fa;
  }
}.heatmap-cell.selected {
  outline: 2px solid #3b82f6;     /* 蓝色外轮廓 */
  outline-offset: 2px;            /* 略微外扩，不占用内部空间 */
  position: relative;
  z-index: 1;                     /* 确保轮廓在其他内容之上 */
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .heatmap-cell.selected {
    outline-color: #60a5fa;
  }
}
</style>