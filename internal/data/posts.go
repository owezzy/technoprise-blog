package data

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"blog/internal/data/validator"
)

type Post struct {
	ID            int64     `json:"id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Title         string    `json:"title"`
	Slug          string    `json:"slug"`
	Content       string    `json:"content"`
	Excerpt       string    `json:"excerpt"`
	PublishedAt   time.Time `json:"published_at"`
	Version       int32     `json:"version"`
	FeaturedImage *Image    `json:"featured_image,omitempty"`
	Images        []*Image  `json:"images,omitempty"`
}

type PostModel struct {
	DB *sql.DB
}

func (p PostModel) Insert(post *Post) error {
	query := `
		INSERT INTO posts (title, slug, content, excerpt, published_at) 
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at, version`

	args := []any{post.Title, post.Slug, post.Content, post.Excerpt, post.PublishedAt}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	return p.DB.QueryRowContext(ctx, query, args...).Scan(&post.ID, &post.CreatedAt, &post.UpdatedAt, &post.Version)
}

func (p PostModel) Get(id int64) (*Post, error) {
	if id < 1 {
		return nil, ErrRecordNotFound
	}

	query := `
		SELECT id, created_at, updated_at, title, slug, content, excerpt, published_at, version
		FROM posts
		WHERE id = $1`

	var post Post

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := p.DB.QueryRowContext(ctx, query, id).Scan(
		&post.ID,
		&post.CreatedAt,
		&post.UpdatedAt,
		&post.Title,
		&post.Slug,
		&post.Content,
		&post.Excerpt,
		&post.PublishedAt,
		&post.Version,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	return &post, nil
}

func (p PostModel) GetBySlug(slug string) (*Post, error) {
	if slug == "" {
		return nil, ErrRecordNotFound
	}

	query := `
		SELECT id, created_at, updated_at, title, slug, content, excerpt, published_at, version
		FROM posts
		WHERE slug = $1`

	var post Post

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := p.DB.QueryRowContext(ctx, query, slug).Scan(
		&post.ID,
		&post.CreatedAt,
		&post.UpdatedAt,
		&post.Title,
		&post.Slug,
		&post.Content,
		&post.Excerpt,
		&post.PublishedAt,
		&post.Version,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	return &post, nil
}

func (p PostModel) Update(post *Post) error {
	query := `
		UPDATE posts 
		SET title = $1, slug = $2, content = $3, excerpt = $4, published_at = $5, updated_at = NOW(), version = version + 1
		WHERE id = $6 AND version = $7
		RETURNING updated_at, version`

	args := []any{
		post.Title,
		post.Slug,
		post.Content,
		post.Excerpt,
		post.PublishedAt,
		post.ID,
		post.Version,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := p.DB.QueryRowContext(ctx, query, args...).Scan(&post.UpdatedAt, &post.Version)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return ErrEditConflict
		default:
			return err
		}
	}

	return nil
}

func (p PostModel) Delete(id int64) error {
	if id < 1 {
		return ErrRecordNotFound
	}

	query := `DELETE FROM posts WHERE id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	result, err := p.DB.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrRecordNotFound
	}

	return nil
}

func (p PostModel) GetAll(title string, filters Filters) ([]*Post, Metadata, error) {
	query := fmt.Sprintf(`
		SELECT count(*) OVER(), id, created_at, updated_at, title, slug, content, excerpt, published_at, version
		FROM posts
		WHERE (to_tsvector('simple', title) @@ plainto_tsquery('simple', $1) OR $1 = '')
		AND published_at <= NOW()
		ORDER BY %s %s, id ASC
		LIMIT $2 OFFSET $3`, filters.sortColumn(), filters.sortDirection())

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	args := []any{title, filters.limit(), filters.offset()}

	rows, err := p.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, Metadata{}, err
	}
	defer rows.Close()

	totalRecords := 0
	posts := []*Post{}

	for rows.Next() {
		var post Post
		err := rows.Scan(
			&totalRecords,
			&post.ID,
			&post.CreatedAt,
			&post.UpdatedAt,
			&post.Title,
			&post.Slug,
			&post.Content,
			&post.Excerpt,
			&post.PublishedAt,
			&post.Version,
		)
		if err != nil {
			return nil, Metadata{}, err
		}
		posts = append(posts, &post)
	}

	if err = rows.Err(); err != nil {
		return nil, Metadata{}, err
	}

	metadata := calculateMetadata(totalRecords, filters.Page, filters.PageSize)
	return posts, metadata, nil
}

func (p PostModel) GetWithImages(id int64) (*Post, error) {
	if id < 1 {
		return nil, ErrRecordNotFound
	}

	query := `
		SELECT p.id, p.created_at, p.updated_at, p.title, p.slug, p.content, p.excerpt,
		       p.published_at, p.version,
		       COALESCE(
		           json_agg(
		               json_build_object(
		                   'id', i.id,
		                   'filename', i.filename,
		                   'original_filename', i.original_filename,
		                   'file_path', i.file_path,
		                   'file_size', i.file_size,
		                   'mime_type', i.mime_type,
		                   'width', i.width,
		                   'height', i.height,
		                   'alt_text', i.alt_text,
		                   'caption', i.caption,
		                   'is_featured', i.is_featured,
		                   'sort_order', i.sort_order,
		                   'created_at', i.created_at,
		                   'updated_at', i.updated_at,
		                   'version', i.version
		               ) ORDER BY i.sort_order, i.created_at
		           ) FILTER (WHERE i.id IS NOT NULL),
		           '[]'::json
		       ) as images
		FROM posts p
		LEFT JOIN images i ON p.id = i.post_id
		WHERE p.id = $1
		GROUP BY p.id, p.created_at, p.updated_at, p.title, p.slug, p.content, p.excerpt,
		         p.published_at, p.version`

	var post Post
	var imagesJSON []byte

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := p.DB.QueryRowContext(ctx, query, id).Scan(
		&post.ID, &post.CreatedAt, &post.UpdatedAt, &post.Title, &post.Slug,
		&post.Content, &post.Excerpt, &post.PublishedAt, &post.Version, &imagesJSON,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	if len(imagesJSON) > 0 && string(imagesJSON) != "[]" {
		err = json.Unmarshal(imagesJSON, &post.Images)
		if err != nil {
			return nil, err
		}

		// Set featured image
		for _, img := range post.Images {
			if img.IsFeatured {
				post.FeaturedImage = img
				break
			}
		}
	}

	return &post, nil
}

func (p PostModel) GetBySlugWithImages(slug string) (*Post, error) {
	if slug == "" {
		return nil, ErrRecordNotFound
	}

	query := `
		SELECT p.id, p.created_at, p.updated_at, p.title, p.slug, p.content, p.excerpt,
		       p.published_at, p.version,
		       COALESCE(
		           json_agg(
		               json_build_object(
		                   'id', i.id,
		                   'filename', i.filename,
		                   'original_filename', i.original_filename,
		                   'file_path', i.file_path,
		                   'file_size', i.file_size,
		                   'mime_type', i.mime_type,
		                   'width', i.width,
		                   'height', i.height,
		                   'alt_text', i.alt_text,
		                   'caption', i.caption,
		                   'is_featured', i.is_featured,
		                   'sort_order', i.sort_order,
		                   'created_at', i.created_at,
		                   'updated_at', i.updated_at,
		                   'version', i.version
		               ) ORDER BY i.sort_order, i.created_at
		           ) FILTER (WHERE i.id IS NOT NULL),
		           '[]'::json
		       ) as images
		FROM posts p
		LEFT JOIN images i ON p.id = i.post_id
		WHERE p.slug = $1
		GROUP BY p.id, p.created_at, p.updated_at, p.title, p.slug, p.content, p.excerpt,
		         p.published_at, p.version`

	var post Post
	var imagesJSON []byte

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := p.DB.QueryRowContext(ctx, query, slug).Scan(
		&post.ID, &post.CreatedAt, &post.UpdatedAt, &post.Title, &post.Slug,
		&post.Content, &post.Excerpt, &post.PublishedAt, &post.Version, &imagesJSON,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	if len(imagesJSON) > 0 && string(imagesJSON) != "[]" {
		err = json.Unmarshal(imagesJSON, &post.Images)
		if err != nil {
			return nil, err
		}

		// Set featured image
		for _, img := range post.Images {
			if img.IsFeatured {
				post.FeaturedImage = img
				break
			}
		}
	}

	return &post, nil
}

func (p PostModel) GetAllWithFeaturedImages(title string, filters Filters) ([]*Post, Metadata, error) {
	query := fmt.Sprintf(`
		SELECT count(*) OVER(), p.id, p.created_at, p.updated_at, p.title, p.slug, 
		       p.content, p.excerpt, p.published_at, p.version,
		       i.id, i.filename, i.file_path, i.alt_text, i.caption, i.width, i.height
		FROM posts p
		LEFT JOIN images i ON p.id = i.post_id AND i.is_featured = true
		WHERE (to_tsvector('simple', p.title) @@ plainto_tsquery('simple', $1) OR $1 = '')
		AND p.published_at <= NOW()
		ORDER BY p.%s %s, p.id ASC
		LIMIT $2 OFFSET $3`, filters.sortColumn(), filters.sortDirection())

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	args := []any{title, filters.limit(), filters.offset()}

	rows, err := p.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, Metadata{}, err
	}
	defer rows.Close()

	totalRecords := 0
	posts := []*Post{}

	for rows.Next() {
		var post Post
		var imageID sql.NullInt64
		var filename, filePath, altText, caption sql.NullString
		var width, height sql.NullInt64

		err := rows.Scan(
			&totalRecords, &post.ID, &post.CreatedAt, &post.UpdatedAt,
			&post.Title, &post.Slug, &post.Content, &post.Excerpt,
			&post.PublishedAt, &post.Version,
			&imageID, &filename, &filePath, &altText, &caption, &width, &height,
		)
		if err != nil {
			return nil, Metadata{}, err
		}

		// Add featured image if exists
		if imageID.Valid {
			post.FeaturedImage = &Image{
				ID:       imageID.Int64,
				PostID:   post.ID,
				Filename: filename.String,
				FilePath: filePath.String,
			}
			if altText.Valid {
				post.FeaturedImage.AltText = &altText.String
			}
			if caption.Valid {
				post.FeaturedImage.Caption = &caption.String
			}
			if width.Valid {
				w := int(width.Int64)
				post.FeaturedImage.Width = &w
			}
			if height.Valid {
				h := int(height.Int64)
				post.FeaturedImage.Height = &h
			}
			post.FeaturedImage.IsFeatured = true
		}

		posts = append(posts, &post)
	}

	if err = rows.Err(); err != nil {
		return nil, Metadata{}, err
	}

	metadata := calculateMetadata(totalRecords, filters.Page, filters.PageSize)
	return posts, metadata, nil
}

func ValidatePost(v *validator.Validator, post *Post) {
	v.Check(post.Title != "", "title", "must be provided")
	v.Check(len(post.Title) <= 500, "title", "must not be more than 500 bytes long")
	v.Check(post.Slug != "", "slug", "must be provided")
	v.Check(len(post.Slug) <= 200, "slug", "must not be more than 200 bytes long")
	v.Check(post.Content != "", "content", "must be provided")
	v.Check(post.Excerpt != "", "excerpt", "must be provided")
	v.Check(len(post.Excerpt) <= 1000, "excerpt", "must not be more than 1000 bytes long")
	v.Check(!post.PublishedAt.IsZero(), "published_at", "must be provided")
}
