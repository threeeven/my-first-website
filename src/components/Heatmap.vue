<template>
  <div class="heatmap">
    <h4>🔥 写作热力图</h4>
    <div class="heatmap-container">
      <div class="months">
        <span v-for="month in months" :key="month">{{ month }}</span>
      </div>
      <div class="grid">
        <div
          v-for="day in days"
          :key="day.date"
          class="day-cell"
          :style="{ backgroundColor: getColor(day.count) }"
          :title="`${day.date}: ${day.count} 篇日记`"
        ></div>
      </div>
    </div>
    <div class="legend">
      <span>少</span>
      <span v-for="level in colorLevels" :key="level" :style="{ backgroundColor: level }" class="legend-color"></span>
      <span>多</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';

const store = useDiaryStore();

// 获取最近365天的日期范围（或可配置）
const startDate = new Date();
startDate.setDate(startDate.getDate() - 364); // 365天，包含今天
startDate.setHours(0, 0, 0, 0);

const today = new Date();
today.setHours(0, 0, 0, 0);

// 生成日期数组
const days = computed(() => {
  const result = [];
  const current = new Date(startDate);
  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0]!;
    const count = store.diaries.filter(d => d.created_at.startsWith(dateStr)).length;
    result.push({
      date: dateStr,
      count,
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
});

// 获取该年月份列表（用于显示月份标签）
const months = computed(() => {
  const monthsSet = new Set<string>();
  for (const day of days.value) {
    const date = new Date(day.date!);
    const monthStr = `${date.getFullYear()}年${date.getMonth()+1}月`;
    monthsSet.add(monthStr);
  }
  return Array.from(monthsSet);
});

// 热力图颜色等级（由浅到深）
const colorLevels = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
function getColor(count: number): string {
  if (count === 0) return colorLevels[0]!;
  if (count === 1) return colorLevels[1]!;
  if (count === 2) return colorLevels[2]!;
  if (count === 3) return colorLevels[3]!;
  return colorLevels[4]!;
}
</script>

<style scoped>
.heatmap {
  background: var(--bg-surface);
  border-radius: var(--radius);
  padding: 1rem;
  margin-top: 1rem;
}
.heatmap h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}
.heatmap-container {
  overflow-x: auto;
}
.months {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}
.months span {
  flex: 1;
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(53, 1fr);  /* 一年约53周 */
  gap: 3px;
}
.day-cell {
  aspect-ratio: 1;
  border-radius: 2px;
  transition: transform 0.1s;
  cursor: default;
}
.day-cell:hover {
  transform: scale(1.2);
  z-index: 1;
}
.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 0.5rem;
  font-size: 0.7rem;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>