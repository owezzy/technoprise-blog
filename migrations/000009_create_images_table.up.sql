CREATE TABLE IF NOT EXISTS images (
    id bigserial PRIMARY KEY,
    post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    filename varchar(255) NOT NULL,
    original_filename varchar(255) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_size bigint NOT NULL,
    mime_type varchar(100) NOT NULL,
    width integer,
    height integer,
    alt_text text,
    caption text,
    is_featured boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    version integer NOT NULL DEFAULT 1
);

-- Optimized indexes for common queries
CREATE INDEX IF NOT EXISTS images_post_id_idx ON images(post_id);
CREATE INDEX IF NOT EXISTS images_filename_idx ON images(filename);
CREATE INDEX IF NOT EXISTS images_featured_idx ON images(post_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS images_sort_order_idx ON images(post_id, sort_order);

-- Full-text search index for alt text and captions
CREATE INDEX IF NOT EXISTS images_search_idx ON images USING GIN (
    to_tsvector('english', COALESCE(alt_text, '') || ' ' || COALESCE(caption, ''))
);

-- Ensure only one featured image per post
CREATE UNIQUE INDEX IF NOT EXISTS images_featured_unique_idx ON images(post_id) 
WHERE is_featured = true;

-- Composite index for performance optimization
CREATE INDEX IF NOT EXISTS images_post_featured_sort_idx ON images(post_id, is_featured, sort_order)
INCLUDE (filename, file_path, alt_text, caption, width, height);