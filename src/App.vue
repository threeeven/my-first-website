<template>
  <div class="container">
    <DiaryEditor ref="editorRef" @saved="refreshList" />
    <DiaryList @edit="handleEditDiary" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DiaryEditor from './components/DiaryEditor.vue';
import DiaryList from './components/DiaryList.vue';
import type { Diary } from './types/diary';

const editorRef = ref<InstanceType<typeof DiaryEditor> | null>(null);

function handleEditDiary(diary: Diary) {
  editorRef.value?.setEditMode(diary);
}

function refreshList() {
  // 列表会自动通过 store 刷新，但需要触发 store.loadDiaries
  // 可以在 store.saveDiary 内部已经调用了 loadDiaries，所以这里不需要额外动作
}
</script>

<style>
/* 全局样式，或者导入外部 CSS */
.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 20px;
}
.editor-panel { flex: 1; min-width: 300px; }
.list-panel { flex: 2; }
/* 其他样式 ... */
</style>