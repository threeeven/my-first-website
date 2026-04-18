<template>
  <div class="editor-panel">
    <h2>{{ isEdit ? '✏️ 编辑日记' : '✍️ 写新日记' }}</h2>
    <input v-model="form.title" type="text" placeholder="标题" @input="updateWordCount" />
    <div class="word-count">{{ titleLength }} / 100</div>

    <textarea v-model="form.content" rows="8" placeholder="支持 Markdown 语法" @input="updateWordCount"></textarea>
    <div class="word-count">{{ contentLength }} 字符</div>

    <input v-model="tagsStr" placeholder="标签，用英文逗号分隔" />

    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <input type="checkbox" v-model="form.is_public" /> 公开日记
    </label>

    <input type="file" @change="handleImageUpload" accept="image/*" />
    <div class="image-preview" v-if="form.image_url">
      <img :src="form.image_url" width="80" />
      <button @click="form.image_url = null">移除</button>
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
  image_url: null as string | null,
});

const tagsStr = computed({
  get: () => form.tags.join(','),
  set: (val: string) => { form.tags = val.split(',').map(s => s.trim()).filter(Boolean); }
});

const titleLength = computed(() => form.title.length);
const contentLength = computed(() => form.content.length);

function updateWordCount() { /* 只是触发计算属性更新 */ }

// 自动保存草稿
function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = window.setInterval(() => {
    const draft = {
      title: form.title,
      content: form.content,
      tags: form.tags,
      is_public: form.is_public,
      image_url: form.image_url,
      updatedAt: new Date().toISOString()
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

// 外部调用设置编辑模式
function setEditMode(diary: Diary) {
  isEdit.value = true;
  editId.value = diary.id;
  form.title = diary.title;
  form.content = diary.content;
  form.tags = diary.tags || [];
  form.is_public = diary.is_public;
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