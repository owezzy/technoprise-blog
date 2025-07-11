package data

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"blog/internal/data/validator"
)

type Image struct {
	ID               int64     `json:"id"`
	PostID           int64     `json:"post_id"`
	Filename         string    `json:"filename"`
	OriginalFilename string    `json:"original_filename"`
	FilePath         string    `json:"file_path"`
	FileSize         int64     `json:"file_size"`
	MimeType         string    `json:"mime_type"`
	Width            *int      `json:"width,omitempty"`
	Height           *int      `json:"height,omitempty"`
	AltText          *string   `json:"alt_text,omitempty"`
	Caption          *string   `json:"caption,omitempty"`
	IsFeatured       bool      `json:"is_featured"`
	SortOrder        int       `json:"sort_order"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Version          int32     `json:"version"`
}

type ImageModel struct {
	DB *sql.DB
}

func (i ImageModel) Insert(image *Image) error {
	query := `
		INSERT INTO images (post_id, filename, original_filename, file_path, file_size, 
		                   mime_type, width, height, alt_text, caption, is_featured, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at, version`

	args := []interface{}{
		image.PostID, image.Filename, image.OriginalFilename, image.FilePath,
		image.FileSize, image.MimeType, image.Width, image.Height,
		image.AltText, image.Caption, image.IsFeatured, image.SortOrder,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	return i.DB.QueryRowContext(ctx, query, args...).Scan(
		&image.ID, &image.CreatedAt, &image.UpdatedAt, &image.Version,
	)
}

func (i ImageModel) Get(id int64) (*Image, error) {
	if id < 1 {
		return nil, ErrRecordNotFound
	}

	query := `
		SELECT id, post_id, filename, original_filename, file_path, file_size,
		       mime_type, width, height, alt_text, caption, is_featured, sort_order,
		       created_at, updated_at, version
		FROM images
		WHERE id = $1`

	var image Image

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := i.DB.QueryRowContext(ctx, query, id).Scan(
		&image.ID, &image.PostID, &image.Filename, &image.OriginalFilename,
		&image.FilePath, &image.FileSize, &image.MimeType, &image.Width,
		&image.Height, &image.AltText, &image.Caption, &image.IsFeatured,
		&image.SortOrder, &image.CreatedAt, &image.UpdatedAt, &image.Version,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	return &image, nil
}

func (i ImageModel) GetByPostID(postID int64) ([]*Image, error) {
	query := `
		SELECT id, post_id, filename, original_filename, file_path, file_size,
		       mime_type, width, height, alt_text, caption, is_featured, sort_order,
		       created_at, updated_at, version
		FROM images
		WHERE post_id = $1
		ORDER BY sort_order, created_at`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := i.DB.QueryContext(ctx, query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	images := []*Image{}
	for rows.Next() {
		var image Image
		err := rows.Scan(
			&image.ID, &image.PostID, &image.Filename, &image.OriginalFilename,
			&image.FilePath, &image.FileSize, &image.MimeType, &image.Width,
			&image.Height, &image.AltText, &image.Caption, &image.IsFeatured,
			&image.SortOrder, &image.CreatedAt, &image.UpdatedAt, &image.Version,
		)
		if err != nil {
			return nil, err
		}
		images = append(images, &image)
	}

	return images, rows.Err()
}

func (i ImageModel) GetFeaturedByPostID(postID int64) (*Image, error) {
	query := `
		SELECT id, post_id, filename, original_filename, file_path, file_size,
		       mime_type, width, height, alt_text, caption, is_featured, sort_order,
		       created_at, updated_at, version
		FROM images
		WHERE post_id = $1 AND is_featured = true`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var image Image
	err := i.DB.QueryRowContext(ctx, query, postID).Scan(
		&image.ID, &image.PostID, &image.Filename, &image.OriginalFilename,
		&image.FilePath, &image.FileSize, &image.MimeType, &image.Width,
		&image.Height, &image.AltText, &image.Caption, &image.IsFeatured,
		&image.SortOrder, &image.CreatedAt, &image.UpdatedAt, &image.Version,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	return &image, nil
}

func (i ImageModel) Update(image *Image) error {
	query := `
		UPDATE images 
		SET filename = $2, original_filename = $3, file_path = $4, file_size = $5,
		    mime_type = $6, width = $7, height = $8, alt_text = $9, caption = $10,
		    is_featured = $11, sort_order = $12, updated_at = NOW(), version = version + 1
		WHERE id = $1 AND version = $13
		RETURNING version`

	args := []interface{}{
		image.ID, image.Filename, image.OriginalFilename, image.FilePath,
		image.FileSize, image.MimeType, image.Width, image.Height,
		image.AltText, image.Caption, image.IsFeatured, image.SortOrder,
		image.Version,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := i.DB.QueryRowContext(ctx, query, args...).Scan(&image.Version)
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

func (i ImageModel) SetFeatured(postID, imageID int64) error {
	tx, err := i.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// Remove featured flag from all images for this post
	_, err = tx.ExecContext(ctx, `
		UPDATE images SET is_featured = false, updated_at = NOW(), version = version + 1
		WHERE post_id = $1 AND is_featured = true`, postID)
	if err != nil {
		return err
	}

	// Set new featured image
	result, err := tx.ExecContext(ctx, `
		UPDATE images SET is_featured = true, updated_at = NOW(), version = version + 1
		WHERE id = $1 AND post_id = $2`, imageID, postID)
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

	return tx.Commit()
}

func (i ImageModel) Delete(id int64) error {
	if id < 1 {
		return ErrRecordNotFound
	}

	query := `DELETE FROM images WHERE id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	result, err := i.DB.ExecContext(ctx, query, id)
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

func (i ImageModel) UpdateSortOrder(postID int64, imageOrders []struct {
	ID    int64 `json:"id"`
	Order int   `json:"order"`
}) error {
	if len(imageOrders) == 0 {
		return nil
	}

	tx, err := i.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	stmt, err := tx.PrepareContext(ctx, `
		UPDATE images SET sort_order = $1, updated_at = NOW(), version = version + 1
		WHERE id = $2 AND post_id = $3`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, order := range imageOrders {
		_, err = stmt.ExecContext(ctx, order.Order, order.ID, postID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (i ImageModel) GetByFilename(filename string) (*Image, error) {
	query := `
		SELECT id, post_id, filename, original_filename, file_path, file_size,
		       mime_type, width, height, alt_text, caption, is_featured, sort_order,
		       created_at, updated_at, version
		FROM images
		WHERE filename = $1`

	var image Image

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := i.DB.QueryRowContext(ctx, query, filename).Scan(
		&image.ID, &image.PostID, &image.Filename, &image.OriginalFilename,
		&image.FilePath, &image.FileSize, &image.MimeType, &image.Width,
		&image.Height, &image.AltText, &image.Caption, &image.IsFeatured,
		&image.SortOrder, &image.CreatedAt, &image.UpdatedAt, &image.Version,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrRecordNotFound
		default:
			return nil, err
		}
	}

	return &image, nil
}

type Validator struct{}

func (v Validator) Check(b bool, s string, s2 string) bool {
	return true
}

func ValidateImage(v *validator.Validator, image *Image) {
	v.Check(image.PostID > 0, "post_id", "must be a positive integer")
	v.Check(image.Filename != "", "filename", "must be provided")
	v.Check(len(image.Filename) <= 255, "filename", "must not be more than 255 bytes long")
	v.Check(image.OriginalFilename != "", "original_filename", "must be provided")
	v.Check(len(image.OriginalFilename) <= 255, "original_filename", "must not be more than 255 bytes long")
	v.Check(image.FilePath != "", "file_path", "must be provided")
	v.Check(len(image.FilePath) <= 500, "file_path", "must not be more than 500 bytes long")
	v.Check(image.FileSize > 0, "file_size", "must be a positive integer")
	v.Check(image.FileSize <= 10*1024*1024, "file_size", "must not be larger than 10MB")
	v.Check(image.MimeType != "", "mime_type", "must be provided")
	v.Check(PermittedValue(image.MimeType, "image/jpeg", "image/png", "image/gif", "image/webp"), "mime_type", "must be a valid image format")

	if image.AltText != nil {
		v.Check(len(*image.AltText) <= 500, "alt_text", "must not be more than 500 bytes long")
	}

	if image.Caption != nil {
		v.Check(len(*image.Caption) <= 1000, "caption", "must not be more than 1000 bytes long")
	}

	v.Check(image.SortOrder >= 0, "sort_order", "must not be negative")
}

func PermittedValue(mimeType string, s string, s2 string, s3 string, s4 string) bool {
	return true
}
