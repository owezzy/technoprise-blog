# Technoprise Blog Application

A full-stack blog application built with Angular (Frontend) and Go (Backend) using PostgreSQL database. The application features a modern, responsive design with comprehensive blog management capabilities.

## 🚀 Features

- **Modern UI/UX**: Built with Angular 19 and Fuse Framework
- **Blog Management**: Create, read, update, and delete blog posts
- **Image Upload**: Featured image support with drag & drop interface
- **Search Functionality**: Real-time search across blog posts
- **Pagination**: Material Design paginator with customizable page sizes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Authentication**: Secure user authentication and authorization
- **RESTful API**: Go-based backend with structured logging
- **Database**: PostgreSQL with migrations support
- **Containerization**: Docker and Docker Compose support

## 🛠️ Tech Stack

### Frontend
- **Angular 19**: Modern web framework with standalone components
- **Angular Material**: UI component library
- **Fuse Framework**: Premium Angular admin template
- **RxJS**: Reactive programming with observables
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript

### Backend
- **Go 1.21**: High-performance backend language
- **PostgreSQL**: Robust relational database
- **Gorilla Mux**: HTTP router and URL matcher
- **Structured Logging**: Using Go's slog package
- **JWT Authentication**: Secure token-based authentication
- **Database Migrations**: Version-controlled schema changes

### DevOps
- **Docker**: Application containerization
- **Docker Compose**: Multi-container orchestration
- **Caddy**: Reverse proxy and static file serving
- **Make**: Build automation

## 📋 Prerequisites

Choose one of the following setup methods:

### Option 1: Local Development
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Go**: 1.21 or higher
- **PostgreSQL**: 15.x or higher

### Option 2: Docker Development
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd technoprise
   ```

2. **Start with Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up --build

   # Or run in detached mode
   docker-compose up -d --build
   ```

3. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:4000
   - Database: localhost:5435

4. **Stop the services**
   ```bash
   docker-compose down
   ```

### Option 2: Local Development Setup

#### Backend Setup

1. **Navigate to project root**
   ```bash
   cd technoprise
   ```

2. **Install Go dependencies**
   ```bash
   go mod download
   ```

3. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb technoprise
   
   # Run migrations
   make db/migrations/up
   ```

4. **Set environment variables**
   ```bash
   export TECHNOPRISE_DB_DSN="postgres://username:password@localhost/technoprise?sslmode=disable"
   ```

5. **Start the backend server**
   ```bash
   # Development mode
   make run/api
   
   # Or direct go run
   go run ./app/cmd/api
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd app/cmd/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   
   # Or using Angular CLI
   ng serve
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

#### Backend
- `PORT`: Server port (default: 4000)
- `TECHNOPRISE_DB_DSN`: PostgreSQL connection string
- `DB_HOST`: Database host (Docker: postgres)
- `DB_PORT`: Database port (default: 5432)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

#### Frontend
- `BASE_URL`: API base URL (configured in environment files)

### Database Configuration

The application uses PostgreSQL with the following default settings:
- **Database**: technoprise
- **Username**: technoprise
- **Password**: pa55word
- **Port**: 5435 (Docker), 5432 (Local)

## 📁 Project Structure

```
technoprise/
├── app/
│   ├── cmd/
│   │   ├── api/              # Go backend application
│   │   └── web/              # Angular frontend application
├── internal/                 # Go internal packages
│   ├── data/                 # Database models and queries
│   ├── logger/               # Structured logging
│   └── container/            # Dependency injection
├── migrations/               # Database migration files
├── scripts/                  # Utility scripts
├── uploads/                  # File upload directory
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile.backend        # Backend Dockerfile
├── Makefile                  # Build automation
└── README.md                 # This file
```

## 🗃️ Database

The application uses PostgreSQL with automated migrations for schema management.

### Quick Database Setup
```bash
# Complete setup with migrations
make db/setup

# Or use Docker Compose
docker-compose up postgres
```

### Schema Overview

**Core Tables:**
- `users` - User accounts and authentication
- `tokens` - Authentication tokens
- `permissions` - User permissions system
- `posts` - Blog posts with full content
- `images` - Image attachments for posts

**Key Features:**
- Automated migrations with rollback support
- Full-text search on posts
- Optimistic locking for concurrent updates
- Foreign key constraints and indexes

### Migration Tool

Install golang-migrate for database migrations:
```bash
# macOS
brew install golang-migrate

# Linux/Windows or using Go
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

📖 **For detailed database documentation, migration guides, and troubleshooting, see [DATABASE.md](DATABASE.md)**

## 🔨 Available Commands

### Using Make (Recommended)

```bash
# Development
make run/api                  # Start backend server
make build/api               # Build backend binary
make db/migrations/up        # Apply database migrations
make db/migrations/down      # Rollback database migrations

# Docker
make docker/build            # Build Docker images
make docker/up               # Start Docker containers
make docker/down             # Stop Docker containers
make docker/clean            # Clean Docker resources

# Database
make db/setup                # Setup database with migrations
make db/migrations/up        # Apply database migrations
make db/migrations/down      # Rollback database migrations
make db/migrations/new name=name # Create new migration
make db/reset                # Reset database with sample data
make db/seed                 # Seed database with sample data
```

### Using Docker Compose

```bash
# Basic operations
docker-compose up --build    # Build and start all services
docker-compose down          # Stop all services
docker-compose logs          # View all logs
docker-compose ps            # View running services

# Individual services
docker-compose up postgres   # Start only database
docker-compose up backend    # Start only backend
docker-compose up frontend   # Start only frontend

# Development
docker-compose exec backend sh    # Shell into backend container
docker-compose exec postgres psql -U technoprise -d technoprise  # Database shell
```

### Using npm (Frontend)

```bash
cd app/cmd/web

# Development
npm start                    # Start development server
npm run build                # Build for production
npm run watch               # Build and watch for changes
npm test                    # Run unit tests
npm run lint                # Run linting

# Angular CLI
ng serve                    # Development server
ng build                    # Production build
ng test                     # Unit tests
ng e2e                      # End-to-end tests
```

## 🔍 API Endpoints

### Posts
- `GET /posts` - List all posts with pagination
- `GET /posts/{id}` - Get post by ID
- `GET /slug/{slug}` - Get post by slug
- `POST /posts` - Create new post
- `PUT /posts/{id}` - Update post
- `DELETE /posts/{id}` - Delete post

### Images
- `POST /posts/{id}/images` - Upload image for post
- `PUT /images/{id}` - Update image metadata
- `DELETE /images/{id}` - Delete image
- `GET /images/{filename}` - Serve image file

### Search
- `GET /posts?title={query}` - Search posts by title
- `GET /posts?sort={field}` - Sort posts by field
- `GET /posts?page={num}&page_size={size}` - Pagination

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Login**: POST `/tokens/authentication`
2. **Logout**: DELETE `/tokens/authentication`
3. **Protected Routes**: Include `Authorization: Bearer <token>` header

## 📱 Features Overview

### Blog Management
- Create and edit blog posts with rich content
- Upload and manage featured images
- Real-time search and filtering
- Responsive pagination with customizable page sizes
- Optimistic locking for concurrent updates

### User Interface
- Modern, responsive design using Angular Material
- Fuse Framework integration for consistent UI/UX
- Dark/light theme support
- Mobile-friendly navigation
- Accessibility features

### Search & Navigation
- Real-time search across blog posts
- Advanced filtering options
- Breadcrumb navigation
- Sticky footer with proper positioning
- Layout switching capabilities

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/data
```

### Frontend Testing
```bash
cd app/cmd/web

# Unit tests
npm test

# E2E tests
npm run e2e

# Test coverage
npm run test:coverage
```

## 📊 Monitoring & Logging

### Backend Logging
- Structured logging using Go's slog package
- Configurable log levels (debug, info, warn, error)
- Request/response logging
- Database query logging
- Error tracking and reporting

### Frontend Logging
- Angular error handling
- Console logging for development
- User action tracking
- Performance monitoring

## 🚀 Deployment

### Production Build

#### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Deploy to production
docker-compose -f docker-compose.yml up -d
```

#### Manual Production
```bash
# Backend
make build/api
./bin/api -port=8080

# Frontend
cd app/cmd/web
npm run build
# Serve dist/fuse with your web server
```

## 🛠️ Development Tips

### Backend Development
- Use `make run/api` for development with auto-reload
- Check `api.log` for detailed logging
- Use database migrations for schema changes
- Follow Go best practices and conventions

### Frontend Development
- Use `ng serve` for development with hot reload
- Leverage Angular DevTools for debugging
- Follow Angular style guide
- Use Angular Material components consistently

### Database Development
- Always create migrations for schema changes
- Use transactions for complex operations
- Index frequently queried columns
- Regular backup in production

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints
- Check Docker logs for troubleshooting

## 🔄 Changelog

### v1.0.0
- Initial release with blog management
- Angular 19 with Fuse Framework
- Go backend with PostgreSQL
- Docker containerization
- Image upload functionality
- Search and pagination features
- Authentication system

---

Made with ❤️ using Angular, Go, and PostgreSQL