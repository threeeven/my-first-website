<template>
  <div class="editor-panel">
    <h2>{{ isEdit ? '✏️ 编辑日记' : '✍️ 写新日记' }}</h2>

    <!-- 标题输入 -->
    <input
      v-model="form.title"
      type="text"
      placeholder="标题"
      @input="updateWordCount"
    />
    <div class="word-count">{{ titleLength }} / 100</div>

    <!-- Markdown 编辑器 -->
    <MdEditor
      v-model="form.content"
      :onUploadImg="handleEditorImageUpload"
      previewTheme="github"
      codeTheme="github"
      @onSave="handleSave"
      style="height: 400px;"
    />
    <div class="word-count">{{ contentLength }} 字符</div>

    <!-- 标签输入 -->
    <input
      v-model="tagsStr"
      type="text"
      placeholder="标签，用英文逗号分隔 (如: 生活,工作,旅行)"
    />

    <!-- 公开/私密开关 -->
    <div class="toggle-switch-container">
    <span class="toggle-label">{{ form.is_public ? '🌍 公开' : '🔒 私密' }}</span>
    <button
        type="button"
        role="switch"
        :aria-checked="form.is_public"
        class="toggle-switch"
        :class="{ 'toggle-switch--checked': form.is_public }"
        @click="form.is_public = !form.is_public"
    >
        <span class="toggle-slider"></span>
    </button>
    </div>

    <!-- 图片上传（独立于编辑器，但编辑器已支持拖拽/粘贴，此按钮可选） -->
    <input type="file" @change="handleImageUpload" accept="image/*" />
    <div class="image-preview" v-if="form.image_url">
      <img :src="form.image_url" width="80" />
      <button @click="form.image_url = null">移除</button>
    </div>

    <!-- 操作按钮 -->
    <div style="display: flex; gap: 12px; margin-top: 16px;">
      <button @click="handleSave">💾 保存</button>
      <button @click="resetForm" style="background:#94a3b8;">取消编辑</button>
    </div>
    <div class="auto-save-tip">{{ autoSaveTip }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { MdEditor } from 'md-editor-v3';
import { useDiaryStore } from '@/stores/diaryStore';
import { uploadImage } from '@/api/diary';
import type { Diary } from '@/types/diary';

const store = useDiaryStore();
const emit = defineEmits<{ (e: 'saved'): void }>();

// 编辑状态
const isEdit = ref(false);
const editId = ref<string | null>(null);
const autoSaveTip = ref('');
let autoSaveTimer: number | null = null;

// 表单数据
const form = reactive({
  title: '',
  content: '',
  tags: [] as string[],
  is_public: true,
  image_url: null as string | null,
});

// 标签字符串（用于输入框）
const tagsStr = computed({
  get: () => form.tags.join(','),
  set: (val: string) => {
    form.tags = val.split(',').map(s => s.trim()).filter(Boolean);
  },
});

// 字数统计
const titleLength = computed(() => form.title.length);
const contentLength = computed(() => form.content.length);
function updateWordCount() {
  // 仅用于触发计算属性更新，实际不需要额外逻辑
}

// 自动保存草稿（每30秒）
function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = window.setInterval(() => {
    const draft = {
      title: form.title,
      content: form.content,
      tags: form.tags,
      is_public: form.is_public,
      image_url: form.image_url,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('diary_draft', JSON.stringify(draft));
    autoSaveTip.value = `草稿已自动保存 ${new Date().toLocaleTimeString()}`;
  }, 30000);
}

function loadDraft() {
  const raw = localStorage.getItem('diary_draft');
  if (raw) {
    const draft = JSON.parse(raw);
    form.title = draft.title || '';
    form.content = draft.content || '';
    form.tags = draft.tags || [];
    form.is_public = draft.is_public !== undefined ? draft.is_public : true;
    form.image_url = draft.image_url || null;
    autoSaveTip.value = '已加载上次未提交的草稿';
  }
}

function clearDraft() {
  localStorage.removeItem('diary_draft');
  autoSaveTip.value = '';
}

// 重置表单（取消编辑）
function resetForm() {
  isEdit.value = false;
  editId.value = null;
  form.title = '';
  form.content = '';
  form.tags = [];
  form.is_public = true;
  form.image_url = null;
  clearDraft();
}

// 图片上传（独立文件选择）
async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const url = await uploadImage(file);
    form.image_url = url;
  } catch (err) {
    alert('图片上传失败');
  }
}

// 编辑器内部的图片上传钩子（支持拖拽/粘贴）
async function handleEditorImageUpload(files: File[], callback: (urls: string[]) => void) {
  try {
    const uploadPromises = files.map(file => uploadImage(file));
    const urls = await Promise.all(uploadPromises);
    callback(urls);
  } catch (error) {
    console.error('图片上传失败:', error);
    alert('部分图片上传失败，请重试');
    callback([]);
  }
}

// 保存日记
async function handleSave() {
  if (!form.title.trim() && !form.content.trim()) {
    alert('请至少填写标题或内容');
    return;
  }
  const payload = {
    title: form.title.trim() || '无标题',
    content: form.content.trim(),
    tags: form.tags,
    is_public: form.is_public,
    image_url: form.image_url,
  };
  await store.saveDiary(payload, editId.value || undefined);
  resetForm();
  emit('saved');
}

// 外部调用：设置编辑模式
function setEditMode(diary: Diary) {
  isEdit.value = true;
  editId.value = diary.id;
  form.title = diary.title;
  form.content = diary.content;
  form.tags = diary.tags || [];
  form.is_public = diary.is_public;
  form.image_url = diary.image_url;
}

// 监听内容变化，自动保存草稿（可选：实时保存，但定时保存已足够）
watch(
  () => form.content,
  () => {
    // 可以在这里实现更频繁的草稿保存，但为了性能，我们保留定时保存
  }
);

onMounted(() => {
  startAutoSave();
  loadDraft();
});

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

// 暴露方法给父组件
defineExpose({ setEditMode, resetForm });
</script>

<style scoped>
/* 如果需要调整编辑器高度等，可以在这里添加局部样式 */
.editor-panel {
  /* 确保编辑器容器样式正常 */
}
/* 滑动开关容器 */
.toggle-switch-container {
  display: flex;
  align-items: center;
  margin: 16px 0;
  padding: 0 4px;
  gap: 10px;
}

.toggle-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 开关按钮基础样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  background-color: var(--border-color);
  border-radius: 28px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0;
  margin: 0;
}

.toggle-switch:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent);
}

/* 滑块 */
.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: var(--shadow-sm);
}

/* 选中状态 */
.toggle-switch--checked {
  background-color: var(--accent);
}

.toggle-switch--checked .toggle-slider {
  transform: translateX(24px);
}
</style>