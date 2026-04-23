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

    <div class="recent-activity" v-if="lastWeekActivity.length">
      <h4>📅 最近7天写作频率</h4>
      <div class="activity-bars">
        <div v-for="day in lastWeekActivity" :key="day.date" class="activity-bar-item">
          <div class="bar-label">{{ day.label }}</div>
          <div class="bar-container">
            <div class="bar" :style="{ width: day.percentage + '%' }"></div>
          </div>
          <div class="bar-count">{{ day.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiaryStore } from '@/stores/diaryStore';

const store = useDiaryStore();

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

// 最近7天写作频率
const lastWeekActivity = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const result = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]!;
    const count = store.diaries.filter(d => d.created_at.startsWith(dateStr)).length;
    const maxCount = Math.max(...store.diaries.map(d => 
      store.diaries.filter(dd => dd.created_at.split('T')[0] === d.created_at.split('T')[0]).length
    ), 1);
    const percentage = (count / maxCount) * 100;
    result.push({
      date: dateStr,
      label: `${date.getMonth()+1}/${date.getDate()} (${days[date.getDay()]})`,
      count,
      percentage,
    });
  }
  return result;
});
</script>

<style scoped>
.stats-panel {
  background: var(--bg-surface);
  border-radius: var(--radius);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-md);
}
.stats-panel h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  text-align: center;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}
.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent);
}
.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.top-tags h4, .recent-activity h4 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1rem;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.stat-tag {
  background: #eef2ff;
  color: var(--accent);
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.8rem;
}
.activity-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.activity-bar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.bar-label {
  width: 70px;
  flex-shrink: 0;
}
.bar-container {
  flex: 1;
  background: var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
}
.bar {
  background: var(--accent);
  height: 8px;
  border-radius: 1rem;
  transition: width 0.3s;
}
.bar-count {
  width: 30px;
  text-align: right;
}
</style>