<template>
  <div class="editor-panel">
    <h2>{{ isEdit ? '✏️ 编辑日记' : '✍️ 写新日记' }}</h2>

    <input v-model="form.title" type="text" placeholder="标题" @input="updateWordCount" />
    <div class="word-count">{{ titleLength }} / 100</div>

    <MdEditor
      v-model="form.content"
      :onUploadImg="handleEditorImageUpload"
      previewTheme="github"
      codeTheme="github"
      @onSave="handleSave"
      style="height: 400px;"
    />
    <div class="word-count">{{ contentLength }} 字符</div>

    <input v-model="tagsStr" type="text" placeholder="标签，用英文逗号分隔 (如: 生活,工作,旅行)" />

    <!-- 公开/私密滑动开关 -->
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

    <!-- 置顶滑动开关 -->
    <div class="toggle-switch-container">
      <span class="toggle-label">📌 置顶日记</span>
      <button
        type="button"
        role="switch"
        :aria-checked="form.pinned"
        class="toggle-switch"
        :class="{ 'toggle-switch--checked': form.pinned }"
        @click="form.pinned = !form.pinned"
      >
        <span class="toggle-slider"></span>
      </button>
    </div>

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

const isEdit = ref(false);
const editId = ref<string | null>(null);
const autoSaveTip = ref('');
let autoSaveTimer: number | null = null;

const form = reactive({
  title: '',
  content: '',
  tags: [] as string[],
  is_public: true,
  pinned: false,
  image_url: null as string | null,
});

const tagsStr = computed({
  get: () => form.tags.join(','),
  set: (val: string) => {
    form.tags = val.split(',').map(s => s.trim()).filter(Boolean);
  },
});

const titleLength = computed(() => form.title.length);
const contentLength = computed(() => form.content.length);
function updateWordCount() {}

function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = window.setInterval(() => {
    const draft = {
      title: form.title,
      content: form.content,
      tags: form.tags,
      is_public: form.is_public,
      pinned: form.pinned,
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
    form.pinned = draft.pinned || false;
    form.image_url = draft.image_url || null;
    autoSaveTip.value = '已加载上次未提交的草稿';
  }
}

function clearDraft() {
  localStorage.removeItem('diary_draft');
  autoSaveTip.value = '';
}

function resetForm() {
  isEdit.value = false;
  editId.value = null;
  form.title = '';
  form.content = '';
  form.tags = [];
  form.is_public = true;
  form.pinned = false;
  form.image_url = null;
  clearDraft();
}

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
    pinned: form.pinned,
    image_url: form.image_url,
  };
  await store.saveDiary(payload, editId.value || undefined);
  resetForm();
  emit('saved');
}

function setEditMode(diary: Diary) {
  isEdit.value = true;
  editId.value = diary.id;
  form.title = diary.title;
  form.content = diary.content;
  form.tags = diary.tags || [];
  form.is_public = diary.is_public;
  form.pinned = diary.pinned || false;
  form.image_url = diary.image_url;
}

defineExpose({ setEditMode, resetForm });

onMounted(() => {
  startAutoSave();
  loadDraft();
});

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});
</script>

<style scoped>
.toggle-switch-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
}
.toggle-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}
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
.toggle-switch--checked {
  background-color: var(--accent);
}
.toggle-switch--checked .toggle-slider {
  transform: translateX(24px);
}
.word-count {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-align: right;
  margin-top: -0.5rem;
  margin-bottom: 0.75rem;
}
.image-preview {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0.75rem 0;
  align-items: center;
}
.image-preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}
.auto-save-tip {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.75rem;
  text-align: right;
}
</style>