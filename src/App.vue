<template>
  <div class="container">
    <DiaryEditor ref="editorRef" @saved="refreshList" />
    <div class="list-panel">
      <DiaryList 
        ref="diaryListRef" 
        @edit="handleEditDiary"
        @resetDateSelection="handleResetDateSelection"
      />
      <HeatMap ref="heatMapRef" :diaries="store.diaries" @dateSelected="handleDateSelected" />
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
const heatMapRef = ref<InstanceType<typeof HeatMap> | null>(null);

function handleEditDiary(diary: Diary) {
  editorRef.value?.setEditMode(diary);
}

// 热力图点击（或取消）日期
function handleDateSelected(dateStr: string | null) {
  if (diaryListRef.value) {
    diaryListRef.value.filterByDate(dateStr);
  }
}

// 当 DiaryList 检测到日期条件被清除时，同步清除热力图高亮
function handleResetDateSelection() {
  heatMapRef.value?.clearSelection();
}

function refreshList() {
  store.loadDiaries();
  if (diaryListRef.value) {
    diaryListRef.value.filterByDate(null); // 清空日期筛选
  }
}
</script>