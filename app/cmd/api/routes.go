package main

import (
	"expvar"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (app *application) routes() http.Handler {
	router := httprouter.New()

	router.NotFound = http.HandlerFunc(app.notFoundResponse)
	router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedResponse)

	// Health check
	router.HandlerFunc(http.MethodGet, "/v1/healthcheck", app.healthcheckHandler)

	// Public endpoints
	router.HandlerFunc(http.MethodGet, "/v1/posts", app.listPostsWithImagesHandler)
	router.HandlerFunc(http.MethodGet, "/v1/posts/:id", app.showPostWithImagesHandler)
	router.HandlerFunc(http.MethodGet, "/v1/slug/:slug", app.showPostBySlugWithImagesHandler)
	router.HandlerFunc(http.MethodGet, "/v1/images/:filename", app.serveImageHandler)

	// Post management endpoints
	router.HandlerFunc(http.MethodPost, "/v1/posts", app.createPostHandler)
	router.HandlerFunc(http.MethodPatch, "/v1/posts/:id", app.updatePostHandler)
	router.HandlerFunc(http.MethodDelete, "/v1/posts/:id", app.deletePostHandler)

	// Image management endpoints
	router.HandlerFunc(http.MethodPost, "/v1/posts/:id/images", app.uploadPostImageHandler)
	router.HandlerFunc(http.MethodGet, "/v1/posts/:id/images", app.getPostImagesHandler)
	router.HandlerFunc(http.MethodPatch, "/v1/images/:id", app.updateImageHandler)
	router.HandlerFunc(http.MethodDelete, "/v1/images/:id", app.deleteImageHandler)
	router.HandlerFunc(http.MethodPatch, "/v1/posts/:id/featured-image", app.setFeaturedImageHandler)

	// Debug endpoint
	router.Handler(http.MethodGet, "/debug/vars", expvar.Handler())

	return app.recoverPanic(app.enableCORS(app.rateLimit(router)))
}
