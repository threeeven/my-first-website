export interface Diary {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiaryInput {
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  image_url?: string | null;
}