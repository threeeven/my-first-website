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
  // 可选：如果需要额外刷新逻辑可以添加
}
</script>

<!-- 样式已移至 main.css，此处不再需要 -->