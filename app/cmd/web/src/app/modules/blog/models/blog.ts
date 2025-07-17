export interface BlogImage {
  id: number;
  post_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  caption?: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  version: number;
}

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
  featured_image?: BlogImage;
  images?: BlogImage[];
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