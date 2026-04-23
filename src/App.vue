<template>
  <div class="container">
    <DiaryEditor ref="editorRef" @saved="refreshList" />
    <div class="list-panel">
      <DiaryList ref="diaryListRef" @edit="handleEditDiary" />
      <HeatMap :diaries="store.diaries" @dateSelected="handleDateSelected" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DiaryEditor from './components/DiaryEditor.vue';
import DiaryList from './components/DiaryList.vue';
import HeatMap from './components/HeatMap.vue';
import type { Diary } from './types/diary';
import { useDiaryStore } from './stores/diaryStore';

const store = useDiaryStore();
const editorRef = ref<InstanceType<typeof DiaryEditor> | null>(null);
const diaryListRef = ref<InstanceType<typeof DiaryList> | null>(null);


function handleEditDiary(diary: Diary) {
  editorRef.value?.setEditMode(diary);
}

// 处理热力图日期点击：加载当天的日记
async function handleDateSelected(dateStr: string) {
  // dateStr 格式 YYYY-MM-DD
  // 构造当天开始和结束时间（本地日期转换为 UTC）
  const startDate = new Date(dateStr);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(dateStr);
  endDate.setUTCHours(23, 59, 59, 999);
  
  await store.loadDiaries({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
}

function refreshList() {
  // 列表会自动刷新（因为 store 已更新），统计面板也会自动响应
}
</script>
