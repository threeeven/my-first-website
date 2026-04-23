export interface Diary {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  pinned: boolean;      // 新增
}

export interface DiaryInput {
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  image_url?: string | null;
}