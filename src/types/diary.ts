// src/types/diary.ts
export interface Diary {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  pinned: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
    visitor_ip?: string;             // 新增
  visitor_province?: string;       // 新增
  visitor_city?: string;           // 新增
}

export interface DiaryInput {
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  pinned?: boolean;
  image_url?: string | null;
  visitor_ip?: string;             // 新增，但通常由后端自动填充，前端不需要提交
}