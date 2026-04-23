<template>
  <div class="container">
    <DiaryEditor ref="editorRef" @saved="refreshList" />
    <div class="list-panel">
      <DiaryList @edit="handleEditDiary" />
      <StatsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DiaryEditor from './components/DiaryEditor.vue';
import DiaryList from './components/DiaryList.vue';
import StatsPanel from './components/StatsPanel.vue';  // 导入统计组件
import type { Diary } from './types/diary';

const editorRef = ref<InstanceType<typeof DiaryEditor> | null>(null);

function handleEditDiary(diary: Diary) {
  editorRef.value?.setEditMode(diary);
}

function refreshList() {
  // 列表会自动刷新（因为 store 已更新），统计面板也会自动响应
}
</script>
