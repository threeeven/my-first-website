<template>
  <div class="diary-card">
    <div class="diary-title">{{ diary.title }}</div>
    <div class="diary-meta">
      <span>🕒 {{ formatDate(diary.created_at) }}</span>
      <span :class="diary.is_public ? 'badge-public' : 'badge-private'">
        {{ diary.is_public ? '公开' : '私密' }}
      </span>
      <span>🏷️ <span v-for="tag in diary.tags" :key="tag" class="tag">{{ tag }}</span></span>
    </div>
    <div class="diary-content" v-html="renderedContent"></div>
    <img v-if="diary.image_url" :src="diary.image_url" class="diary-image" />
    <div style="margin-top: 12px;">
      <button @click="$emit('edit', diary.id)">✏️ 编辑</button>
      <button class="delete-btn" @click="$emit('delete', diary.id)">🗑️ 删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import type { Diary } from '@/types/diary';
import { formatDate } from '@/utils/helpers';

const props = defineProps<{ diary: Diary }>();
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'delete', id: string): void }>();

const renderedContent = computed(() => marked.parse(props.diary.content || ''));
</script>