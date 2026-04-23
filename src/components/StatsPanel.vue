<template>
  <div class="stats-panel">
    <h3>📊 日记统计</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ totalCount }}</div>
        <div class="stat-label">总日记数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalWords }}</div>
        <div class="stat-label">总字数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ continuousDays }}</div>
        <div class="stat-label">连续写作天数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgWordsPerDay }}</div>
        <div class="stat-label">日均字数</div>
      </div>
    </div>

    <div class="top-tags" v-if="topTags.length">
      <h4>🏷️ 常用标签 Top 5</h4>
      <div class="tag-list">
        <span v-for="tag in topTags" :key="tag.name" class="stat-tag">
          {{ tag.name }} ({{ tag.count }})
        </span>
      </div>
    </div>
    
    <HeatMap :diaries="store.diaries" @dateClick="emitDateClick" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';
import HeatMap from './Heatmap.vue';

const store = useDiaryStore();
const emit = defineEmits<{ (e: 'dateClick', date: string): void }>();

function emitDateClick(date: string) {
  emit('dateClick', date);
}

// 总日记数
const totalCount = computed(() => store.diaries.length);

// 总字数（所有日记 content 长度累加）
const totalWords = computed(() => {
  return store.diaries.reduce((sum, d) => sum + (d.content?.length || 0), 0);
});

// 日均字数（有日记的天数，按日期去重）
const avgWordsPerDay = computed(() => {
  if (store.diaries.length === 0) return 0;
  const uniqueDates = new Set(store.diaries.map(d => d.created_at.split('T')[0]));
  const days = uniqueDates.size;
  return Math.round(totalWords.value / days);
});

// 连续写作天数（按日期排序，检查连续日期）
const continuousDays = computed(() => {
  if (store.diaries.length === 0) return 0;
  const dates = store.diaries
    .map(d => d.created_at.split('T')[0])
    .sort()
    .reverse(); // 从最近开始
  let continuous = 1;
  let prevDate = new Date(dates[0]!);
  for (let i = 1; i < dates.length; i++) {
    const currDate = new Date(dates[i]!);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      continuous++;
      prevDate = currDate;
    } else {
      break;
    }
  }
  return continuous;
});

// 标签统计（Top 5）
const topTags = computed(() => {
  const tagCount: Record<string, number> = {};
  store.diaries.forEach(d => {
    (d.tags || []).forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});

</script>

