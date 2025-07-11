CREATE INDEX IF NOT EXISTS posts_title_idx ON posts USING GIN (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at);