package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"blog/internal/data"
	"blog/internal/data/validator"
)

func (app *application) createPostHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title       string    `json:"title"`
		Slug        string    `json:"slug"`
		Content     string    `json:"content"`
		Excerpt     string    `json:"excerpt"`
		PublishedAt time.Time `json:"published_at"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	post := &data.Post{
		Title:       input.Title,
		Slug:        input.Slug,
		Content:     input.Content,
		Excerpt:     input.Excerpt,
		PublishedAt: input.PublishedAt,
	}

	if post.PublishedAt.IsZero() {
		post.PublishedAt = time.Now()
	}

	v := validator.New()
	if data.ValidatePost(v, post); !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	err = app.models.Posts.Insert(post)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	headers := make(http.Header)
	headers.Set("Location", fmt.Sprintf("/v1/posts/%d", post.ID))

	err = app.writeJSON(w, http.StatusCreated, envelope{"post": post}, headers)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) showPostHandler(w http.ResponseWriter, r *http.Request) {
	id, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	post, err := app.models.Posts.Get(id)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"post": post}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) showPostBySlugHandler(w http.ResponseWriter, r *http.Request) {
	slug := app.readSlugParam(r)
	if slug == "" {
		app.notFoundResponse(w, r)
		return
	}

	post, err := app.models.Posts.GetBySlug(slug)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"post": post}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) updatePostHandler(w http.ResponseWriter, r *http.Request) {
	id, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	post, err := app.models.Posts.Get(id)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	var input struct {
		Title       *string    `json:"title"`
		Slug        *string    `json:"slug"`
		Content     *string    `json:"content"`
		Excerpt     *string    `json:"excerpt"`
		PublishedAt *time.Time `json:"published_at"`
	}

	err = app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if input.Title != nil {
		post.Title = *input.Title
	}
	if input.Slug != nil {
		post.Slug = *input.Slug
	}
	if input.Content != nil {
		post.Content = *input.Content
	}
	if input.Excerpt != nil {
		post.Excerpt = *input.Excerpt
	}
	if input.PublishedAt != nil {
		post.PublishedAt = *input.PublishedAt
	}

	v := validator.New()
	if data.ValidatePost(v, post); !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	err = app.models.Posts.Update(post)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrEditConflict):
			app.editConflictResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"post": post}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) deletePostHandler(w http.ResponseWriter, r *http.Request) {
	id, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	err = app.models.Posts.Delete(id)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"message": "post successfully deleted"}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) listPostsHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title string
		data.Filters
	}

	v := validator.New()
	qs := r.URL.Query()

	input.Title = app.readString(qs, "title", "")
	input.Filters.Page = app.readInt(qs, "page", 1, v)
	input.Filters.PageSize = app.readInt(qs, "page_size", 20, v)
	input.Filters.Sort = app.readString(qs, "sort", "id")
	input.Filters.SortSafelist = []string{"id", "title", "published_at", "-id", "-title", "-published_at"}

	if data.ValidateFilters(v, input.Filters); !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	posts, metadata, err := app.models.Posts.GetAll(input.Title, input.Filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"posts": posts, "metadata": metadata}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) uploadPostImageHandler(w http.ResponseWriter, r *http.Request) {
	postID, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	// Check if post exists
	_, err = app.models.Posts.Get(postID)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	// Parse multipart form (10MB max)
	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("failed to parse multipart form: %v", err))
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("failed to get image file: %v", err))
		return
	}
	defer file.Close()

	// Get optional metadata
	altText := r.FormValue("alt_text")
	caption := r.FormValue("caption")
	isFeatured := r.FormValue("is_featured") == "true"
	sortOrder, _ := strconv.Atoi(r.FormValue("sort_order"))

	// Validate file
	v := validator.New()
	v.Check(header.Size <= 10*1024*1024, "image", "must not be larger than 10MB")
	v.Check(header.Size > 0, "image", "must not be empty")

	ext := strings.ToLower(filepath.Ext(header.Filename))
	v.Check(validator.PermittedValue(ext, ".jpg", ".jpeg", ".png", ".gif", ".webp"), "image", "must be a valid image format")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%d%s", postID, time.Now().Unix(), ext)
	filePath := fmt.Sprintf("uploads/images/%s", filename)

	// Ensure directory exists
	err = os.MkdirAll("uploads/images", 0755)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Create image record
	image := &data.Image{
		PostID:           postID,
		Filename:         filename,
		OriginalFilename: header.Filename,
		FilePath:         filePath,
		FileSize:         header.Size,
		MimeType:         header.Header.Get("Content-Type"),
		IsFeatured:       isFeatured,
		SortOrder:        sortOrder,
	}

	if altText != "" {
		image.AltText = &altText
	}
	if caption != "" {
		image.Caption = &caption
	}

	// Validate image data
	if data.ValidateImage(v, image); !v.Valid() {
		os.Remove(filePath) // Clean up file on validation error
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	// If this is set as featured, remove featured flag from other images
	if isFeatured {
		err = app.models.Images.SetFeatured(postID, 0) // This will clear all featured flags first
		if err != nil && !errors.Is(err, data.ErrRecordNotFound) {
			os.Remove(filePath)
			app.serverErrorResponse(w, r, err)
			return
		}
	}

	err = app.models.Images.Insert(image)
	if err != nil {
		os.Remove(filePath) // Clean up file on database error
		app.serverErrorResponse(w, r, err)
		return
	}

	// If this image was set as featured, update the flag now that we have the ID
	if isFeatured {
		err = app.models.Images.SetFeatured(postID, image.ID)
		if err != nil {
			app.serverErrorResponse(w, r, err)
			return
		}
	}

	err = app.writeJSON(w, http.StatusCreated, envelope{"image": image}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) getPostImagesHandler(w http.ResponseWriter, r *http.Request) {
	postID, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	images, err := app.models.Images.GetByPostID(postID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"images": images}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) updateImageHandler(w http.ResponseWriter, r *http.Request) {
	imageID, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	image, err := app.models.Images.Get(imageID)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	var input struct {
		AltText    *string `json:"alt_text"`
		Caption    *string `json:"caption"`
		IsFeatured *bool   `json:"is_featured"`
		SortOrder  *int    `json:"sort_order"`
	}

	err = app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if input.AltText != nil {
		image.AltText = input.AltText
	}
	if input.Caption != nil {
		image.Caption = input.Caption
	}
	if input.SortOrder != nil {
		image.SortOrder = *input.SortOrder
	}

	// Handle featured image change
	if input.IsFeatured != nil && *input.IsFeatured != image.IsFeatured {
		if *input.IsFeatured {
			// Set this as featured image
			err = app.models.Images.SetFeatured(image.PostID, image.ID)
			if err != nil {
				app.serverErrorResponse(w, r, err)
				return
			}
			image.IsFeatured = true
		} else {
			// Remove featured flag
			image.IsFeatured = false
		}
	}

	v := validator.New()
	if data.ValidateImage(v, image); !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	err = app.models.Images.Update(image)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrEditConflict):
			app.editConflictResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"image": image}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) deleteImageHandler(w http.ResponseWriter, r *http.Request) {
	imageID, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	image, err := app.models.Images.Get(imageID)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	// Delete from database first
	err = app.models.Images.Delete(imageID)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	// Delete file from filesystem
	err = os.Remove(image.FilePath)
	if err != nil && !os.IsNotExist(err) {
		// Log error but don't fail the request since database deletion succeeded
		ctx := r.Context()
		app.logger.Error(ctx, "failed to delete image file from filesystem",
			"error", err.Error(),
			"image_id", imageID,
			"file_path", image.FilePath,
			"operation", "delete_image_file",
		)
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"message": "image successfully deleted"}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) serveImageHandler(w http.ResponseWriter, r *http.Request) {
	filename := app.readFilenameParam(r)
	if filename == "" {
		app.notFoundResponse(w, r)
		return
	}

	// Get image from database to validate access
	image, err := app.models.Images.GetByFilename(filename)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	// Check if file exists
	if _, err := os.Stat(image.FilePath); os.IsNotExist(err) {
		app.notFoundResponse(w, r)
		return
	}

	// Set headers
	w.Header().Set("Content-Type", image.MimeType)
	w.Header().Set("Cache-Control", "public, max-age=31536000") // Cache for 1 year

	// Serve file
	http.ServeFile(w, r, image.FilePath)
}

func (app *application) setFeaturedImageHandler(w http.ResponseWriter, r *http.Request) {
	postID, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	var input struct {
		ImageID int64 `json:"image_id"`
	}

	err = app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate that the image belongs to the post
	image, err := app.models.Images.Get(input.ImageID)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	if image.PostID != postID {
		app.badRequestResponse(w, r, fmt.Errorf("image does not belong to this post"))
		return
	}

	err = app.models.Images.SetFeatured(postID, input.ImageID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"message": "featured image updated successfully"}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// Update existing handlers to use image-enabled methods
func (app *application) showPostWithImagesHandler(w http.ResponseWriter, r *http.Request) {
	id, err := app.readIDParam(r)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	post, err := app.models.Posts.GetWithImages(id)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"post": post}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) showPostBySlugWithImagesHandler(w http.ResponseWriter, r *http.Request) {
	slug := app.readSlugParam(r)
	if slug == "" {
		app.notFoundResponse(w, r)
		return
	}

	post, err := app.models.Posts.GetBySlugWithImages(slug)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
			app.notFoundResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"post": post}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) listPostsWithImagesHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	app.logger.Info(ctx, "listing posts with images requested",
		"remote_addr", r.RemoteAddr,
		"query_params", r.URL.RawQuery,
	)
	
	var input struct {
		Title string
		data.Filters
	}

	v := validator.New()
	qs := r.URL.Query()

	input.Title = app.readString(qs, "title", "")
	input.Filters.Page = app.readInt(qs, "page", 1, v)
	input.Filters.PageSize = app.readInt(qs, "page_size", 20, v)
	input.Filters.Sort = app.readString(qs, "sort", "id")
	input.Filters.SortSafelist = []string{"id", "title", "published_at", "-id", "-title", "-published_at"}

	if data.ValidateFilters(v, input.Filters); !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	posts, metadata, err := app.models.Posts.GetAllWithFeaturedImages(input.Title, input.Filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.logger.Info(ctx, "posts retrieved successfully",
		"posts_count", len(posts),
		"page", input.Filters.Page,
		"page_size", input.Filters.PageSize,
	)

	err = app.writeJSON(w, http.StatusOK, envelope{"posts": posts, "metadata": metadata}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
