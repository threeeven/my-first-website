<template>
  <div class="heatmap">
    <h4>📅 日记热力图（最近120天）</h4>
    <div class="heatmap-container">
      <!-- 月份标签行 -->
      <div class="month-row">
        <div class="weekday-placeholder"></div>
        <div
          v-for="(month, idx) in monthLabels"
          :key="idx"
          class="month-cell"
          :style="{ gridColumn: `span ${month.span}` }"
        >
          {{ month.name }}
        </div>
      </div>

      <!-- 星期标签 + 热力图网格 -->
      <div class="heatmap-grid">
        <!-- 星期标签列 -->
        <div class="weekday-labels">
          <div v-for="weekday in weekdays" :key="weekday" class="weekday-label">
            {{ weekday }}
          </div>
        </div>
        <!-- 网格主体 -->
        <div class="grid-cells" :style="{ gridTemplateColumns: `repeat(${weeksCount}, 1fr)` }">
          <div
            v-for="day in days"
            :key="day.date"
            class="cell"
            :class="{
              'has-diary': day.count > 0,
              'low': day.count > 0 && day.count <= 1,
              'medium': day.count > 1 && day.count <= 3,
              'high': day.count > 3,
            }"
            :title="`${day.date} (${day.count} 篇日记)`"
            @click="emit('dateClick', day.date!)"
          >
            <span class="day-number">{{ day.dayOfMonth }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Diary } from '@/types/diary';

const props = defineProps<{ diaries: Diary[] }>();
const emit = defineEmits<{ (e: 'dateClick', date: string): void }>();

// 星期顺序（从上到下：周日 -> 周六）
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 生成过去120天的日期数组（包括今天）
const days = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = [];
  for (let i = 119; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = props.diaries.filter(d => d.created_at.startsWith(dateStr!)).length;
    result.push({
      date: dateStr,
      dayOfMonth: date.getDate(),
      count,
    });
  }
  return result;
});

// 按周分组（每7天一组，从周日开始）
const weeks = computed(() => {
  const weeks: typeof days.value[] = [];
  for (let i = 0; i < days.value.length; i += 7) {
    weeks.push(days.value.slice(i, i + 7));
  }
  return weeks;
});

const weeksCount = computed(() => weeks.value.length);

// 生成月份标签（每个月份占据几列）
const monthLabels = computed(() => {
  const labels: { name: string; span: number }[] = [];
  let currentMonth = '';
  let span = 0;
  for (let i = 0; i < days.value.length; i++) {
    const day = days.value[i]!;
    const month = day.date!.slice(0, 7); // YYYY-MM
    if (month !== currentMonth) {
      if (currentMonth !== '') {
        labels.push({ name: currentMonth.slice(5) + '月', span });
      }
      currentMonth = month;
      span = 1;
    } else {
      span++;
    }
  }
  if (currentMonth !== '') {
    labels.push({ name: currentMonth.slice(5) + '月', span });
  }
  return labels;
});
</script>

<style scoped>
.heatmap {
  margin-top: 1rem;
  background: var(--bg-surface);
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.heatmap-container {
  min-width: 600px;
}
.month-row {
  display: flex;
  margin-left: 48px; /* 为星期标签留出空间 */
  margin-bottom: 4px;
}
.weekday-placeholder {
  width: 48px;
  flex-shrink: 0;
}
.month-cell {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
}
.heatmap-grid {
  display: flex;
}
.weekday-labels {
  width: 48px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
.weekday-label {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--text-secondary);
}
.grid-cells {
  flex: 1;
  display: grid;
  gap: 4px;
}
.cell {
  aspect-ratio: 1 / 1;
  background: var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s;
  position: relative;
}
.cell:hover {
  transform: scale(1.05);
  z-index: 1;
}
.day-number {
  font-size: 0.65rem;
  color: var(--text-primary);
  opacity: 0.8;
}
.has-diary {
  background: #c6e48b;
}
.low {
  background: #9ec867;
}
.medium {
  background: #6aa84f;
}
.high {
  background: #38761d;
}
.has-diary .day-number {
  color: white;
  font-weight: bold;
}
@media (prefers-color-scheme: dark) {
  .has-diary {
    background: #2c5a2c;
  }
  .low {
    background: #3c7a3c;
  }
  .medium {
    background: #4c9a4c;
  }
  .high {
    background: #6cba6c;
  }
}
</style>