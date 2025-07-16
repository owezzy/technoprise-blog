export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  version: number;
  featured_image?: {
    id: number;
    filename: string;
    file_path: string;
    alt_text?: string;
    caption?: string;
  };
}

export interface BlogResponse {
  posts: BlogPost[];
  metadata: {
    current_page: number;
    page_size: number;
    first_page: number;
    last_page: number;
    total_records: number;
  };
}