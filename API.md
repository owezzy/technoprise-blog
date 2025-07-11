# Technoprise Blog API

A clean, production-ready blog API built with Go and PostgreSQL.

## Features

- ✅ **Blog Post Management**: Full CRUD operations for blog posts
- ✅ **Dynamic Routing**: Access posts by ID or slug
- ✅ **Pagination**: Built-in pagination for post listings
- ✅ **Search**: Full-text search on post titles
- ✅ **No Authentication**: Simple, open API for easy frontend integration
- ✅ **Docker Database**: PostgreSQL running in Docker
- ✅ **Migrations**: Database schema versioning

## API Endpoints

### Health Check
- `GET /v1/healthcheck` - API health status

### Blog Posts
- `GET /v1/posts` - List all posts (with pagination & search)
  - Query params: `page`, `page_size`, `sort`, `title`
- `GET /v1/posts/:id` - Get post by ID
- `GET /v1/slug/:slug` - Get post by slug
- `POST /v1/posts` - Create new post
- `PATCH /v1/posts/:id` - Update post
- `DELETE /v1/posts/:id` - Delete post

### Debug
- `GET /debug/vars` - Runtime metrics (development only)

## Quick Start

1. **Setup the development environment:**
   ```bash
   make dev/start
   ```

2. **Start the API:**
   ```bash
   make run/api
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:4000/v1/healthcheck
   ```

## Usage Examples

### Create Sample Data
```bash
make db/seed
```

### Create a Blog Post
```bash
curl -X POST http://localhost:4000/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "slug": "my-first-post",
    "content": "This is the full content of my blog post...",
    "excerpt": "A brief summary of the post.",
    "published_at": "2024-01-01T00:00:00Z"
  }'
```

### Get All Posts
```bash
curl http://localhost:4000/v1/posts
```

### Get Post by Slug
```bash
curl http://localhost:4000/v1/slug/my-first-post
```

### Search Posts
```bash
curl "http://localhost:4000/v1/posts?title=first&page=1&page_size=10"
```

## Configuration

- **Port**: 4000 (API server)
- **Database**: PostgreSQL on port 5435
- **Environment**: Configured via `.envrc` file

## Development Commands

- `make dev/start` - Complete development setup
- `make run/api` - Start API server
- `make api/hot-reload` - Start with hot-reload (requires air)
- `make db/setup` - Setup database with migrations
- `make db/docker/start` - Start database container
- `make db/docker/stop` - Stop database container
- `make db/psql` - Connect to database
- `make build/api` - Build production binary

## Project Structure

```
├── cmd/api/           # Application entry point
├── internal/data/     # Data models and database logic
├── migrations/        # Database migrations
├── scripts/           # Development scripts
├── docker-compose.yml # Database container config
├── Makefile          # Development commands
└── .envrc            # Environment variables
```

## Requirements

- Go 1.20+
- Docker & Docker Compose
- golang-migrate (for database migrations)

Ready for Angular frontend integration!