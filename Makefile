# Include variables from the .envrc file
include .envrc

# ==================================================================================== #
# HELPERS
# ==================================================================================== #

## help: print this help message
.PHONY: help
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'
# Create the new confirm target.
.PHONY: confirm
confirm:
	@echo -n 'Are you sure? [y/N] ' && read ans && [ $${ans:-N} = y ]


# ==================================================================================== # 
# DEVELOPMENT
# ==================================================================================== #
## dev/start: complete development environment setup
.PHONY: dev/start
dev/start:
	@./scripts/dev-start.sh

## run/api: run the cmd/api application
.PHONY: run/api
run/api:
	go run ./app/cmd/api -db-dsn=${TECHNOPRISE_DB_DSN} -cors-trusted-origins="http://localhost:4200"

## run/web: run the Angular web application
.PHONY: run/web
run/web:
	cd app/cmd/web && npm start

## run/api: with hot-reload using air
.PHONY: api/hot-reload
api/hot-reload:
	air -- -db-dsn=${TECHNOPRISE_DB_DSN} -cors-trusted-origins="http://localhost:4200"

## web/install: install web dependencies
.PHONY: web/install
web/install:
	cd app/cmd/web && npm install

## web/build: build the Angular web application
.PHONY: web/build
web/build:
	cd app/cmd/web && npm run build

## db/docker/start: start the PostgreSQL database with Docker
.PHONY: db/docker/start
db/docker/start:
	@echo 'Starting PostgreSQL database with Docker...'
	docker-compose up -d postgres

## db/docker/stop: stop the PostgreSQL database Docker container
.PHONY: db/docker/stop
db/docker/stop:
	@echo 'Stopping PostgreSQL database...'
	docker-compose down

## db/docker/restart: restart the PostgreSQL database Docker container
.PHONY: db/docker/restart
db/docker/restart:
	@echo 'Restarting PostgreSQL database...'
	docker-compose restart postgres

## db/docker/logs: view PostgreSQL database logs
.PHONY: db/docker/logs
db/docker/logs:
	docker-compose logs -f postgres

## db/psql: connect to the database using psql
.PHONY: db/psql
db/psql:
	psql ${TECHNOPRISE_DB_DSN}

## db/migrations/new name=$1: create a new database migration
.PHONY: db/migrations/new
db/migrations/new:
	@echo 'Creating migration files for ${name}...'
	migrate create -seq -ext=.sql -dir=./migrations ${name}

## db/migrations/up: apply all up database migrations
.PHONY: db/migrations/up
db/migrations/up: confirm
	@echo 'Running up migrations...'
	migrate -path ./migrations -database ${TECHNOPRISE_DB_DSN} up

## db/migrations/down: apply all down database migrations
.PHONY: db/migrations/down
db/migrations/down: confirm
	@echo 'Running down migrations...'
	migrate -path ./migrations -database ${TECHNOPRISE_DB_DSN} down

## db/setup: start database and run migrations
.PHONY: db/setup
db/setup:
	@echo 'Setting up database...'
	make db/docker/start
	@echo 'Waiting for database to be ready...'
	@until docker-compose exec postgres pg_isready -U technoprise -d technoprise; do sleep 1; done
	@echo 'Database is ready, running migrations...'
	migrate -path ./migrations -database ${TECHNOPRISE_DB_DSN} up

## db/seed: create example blog posts
.PHONY: db/seed
db/seed:
	@echo 'Creating example blog posts...'
	@curl -X POST http://localhost:4000/v1/posts \
		-H "Content-Type: application/json" \
		-d '{"title": "Welcome to Technoprise Blog", "slug": "welcome-to-technoprise", "content": "This is our first blog post! Welcome to the Technoprise blog platform. Here you can read about the latest in technology, programming, and innovation. This platform is built with Go and PostgreSQL, providing a fast and reliable blogging experience.", "excerpt": "Welcome to our new blog platform built with Go and PostgreSQL.", "published_at": "2024-01-01T10:00:00Z"}' \
		-s > /dev/null && echo 'Created welcome post'
	@curl -X POST http://localhost:4000/v1/posts \
		-H "Content-Type: application/json" \
		-d '{"title": "Getting Started with Go APIs", "slug": "getting-started-go-apis", "content": "Go is an excellent language for building APIs. In this post, we explore the key concepts and best practices for creating robust, scalable APIs with Go. We cover routing, middleware, database integration, and proper error handling. Whether you are new to Go or looking to improve your API development skills, this guide will help you build better backends.", "excerpt": "Learn how to build robust and scalable APIs using Go programming language.", "published_at": "2024-01-02T14:30:00Z"}' \
		-s > /dev/null && echo 'Created Go API post'
	@curl -X POST http://localhost:4000/v1/posts \
		-H "Content-Type: application/json" \
		-d '{"title": "Database Design Best Practices", "slug": "database-design-best-practices", "content": "Proper database design is crucial for application performance and maintainability. This post covers essential principles including normalization, indexing strategies, relationship modeling, and performance optimization. We also discuss common pitfalls to avoid and how to design schemas that scale with your application growth.", "excerpt": "Essential principles for designing efficient and scalable database schemas.", "published_at": "2024-01-03T09:15:00Z"}' \
		-s > /dev/null && echo 'Created database post'
	@curl -X POST http://localhost:4000/v1/posts \
		-H "Content-Type: application/json" \
		-d '{"title": "Modern Frontend Development", "slug": "modern-frontend-development", "content": "Frontend development has evolved significantly over the years. Today we have powerful frameworks like Angular, React, and Vue.js that make building complex user interfaces easier than ever. In this post, we explore the latest trends in frontend development, including TypeScript adoption, component-based architecture, and state management patterns.", "excerpt": "Exploring the latest trends and best practices in modern frontend development.", "published_at": "2024-01-04T16:45:00Z"}' \
		-s > /dev/null && echo 'Created frontend post'
	@curl -X POST http://localhost:4000/v1/posts \
		-H "Content-Type: application/json" \
		-d '{"title": "Docker for Developers", "slug": "docker-for-developers", "content": "Docker has revolutionized how we develop, test, and deploy applications. This comprehensive guide covers Docker basics, containerization best practices, and how to integrate Docker into your development workflow. Learn how to create efficient Dockerfiles, manage multi-container applications with Docker Compose, and optimize your container images for production.", "excerpt": "A comprehensive guide to using Docker in your development workflow.", "published_at": "2024-01-05T11:20:00Z"}' \
		-s > /dev/null && echo 'Created Docker post'
	@echo 'Example data created successfully!'
	@echo ''
	@echo 'Test the API now:'
	@echo '  curl http://localhost:4000/v1/posts'
	@echo '  curl http://localhost:4000/v1/slug/welcome-to-technoprise'
	@echo '  curl http://localhost:4000/v1/posts/1'

# ==================================================================================== # 
# QUALITY CONTROL
# ==================================================================================== #
## audit: tidy dependencies and format, vet and test all code
.PHONY: audit
audit: vendor
	@echo 'Formatting code...'
	go fmt ./...
	@echo 'Vetting code...'
	go vet ./...
	staticcheck ./...
	@echo 'Running tests...'
	go test -race -vet=off ./...

## vendor: tidy and vendor dependencies
.PHONY: vendor
vendor:
	@echo 'Tidying and verifying module dependencies...'
	go mod tidy
	go mod verify
	@echo 'Vendoring dependencies...'
	go mod vendor

# ==================================================================================== # 
# BUILD
# ==================================================================================== #
## build/api: build the cmd/api application
.PHONY: build/api 
build/api:
	@echo 'Building cmd/api...'
	go build -ldflags='-s' -o=./bin/api ./app/cmd/api
	GOOS=linux GOARCH=amd64 go build -ldflags='-s' -o=./bin/linux_amd64/api ./app/cmd/api

# ==================================================================================== # 
# DOCKER
# ==================================================================================== #
## docker/build: build all Docker images
.PHONY: docker/build
docker/build:
	@echo 'Building Docker images...'
	docker-compose build

## docker/up: start all services with Docker Compose
.PHONY: docker/up
docker/up:
	@echo 'Starting all services with Docker Compose...'
	docker-compose up -d --build

## docker/down: stop all Docker services
.PHONY: docker/down
docker/down:
	@echo 'Stopping all Docker services...'
	docker-compose down

## docker/restart: restart all Docker services
.PHONY: docker/restart
docker/restart:
	@echo 'Restarting all Docker services...'
	docker-compose restart

## docker/logs: view logs from all services
.PHONY: docker/logs
docker/logs:
	docker-compose logs -f

## docker/logs/backend: view backend logs
.PHONY: docker/logs/backend
docker/logs/backend:
	docker-compose logs -f backend

## docker/logs/frontend: view frontend logs
.PHONY: docker/logs/frontend
docker/logs/frontend:
	docker-compose logs -f frontend

## docker/logs/postgres: view database logs
.PHONY: docker/logs/postgres
docker/logs/postgres:
	docker-compose logs -f postgres

## docker/shell/backend: shell into backend container
.PHONY: docker/shell/backend
docker/shell/backend:
	docker-compose exec backend sh

## docker/shell/postgres: shell into postgres container
.PHONY: docker/shell/postgres
docker/shell/postgres:
	docker-compose exec postgres psql -U technoprise -d technoprise

## docker/clean: remove all containers, images, and volumes
.PHONY: docker/clean
docker/clean: confirm
	@echo 'Cleaning up Docker resources...'
	docker-compose down -v
	docker system prune -a --volumes -f

## docker/reset: complete reset of Docker environment
.PHONY: docker/reset
docker/reset: docker/clean docker/up

## docker/prod: start production environment
.PHONY: docker/prod
docker/prod:
	@echo 'Starting production environment...'
	docker-compose -f docker-compose.yml up -d --build

## docker/dev: start development environment
.PHONY: docker/dev
docker/dev:
	@echo 'Starting development environment...'
	docker-compose up --build

# ==================================================================================== # 
# FULL STACK DEVELOPMENT
# ==================================================================================== #
## fullstack/start: start the complete development environment
.PHONY: fullstack/start
fullstack/start:
	@echo 'Starting complete development environment...'
	make docker/up
	@echo 'Waiting for services to be ready...'
	@until curl -f http://localhost:4000/v1/healthcheck > /dev/null 2>&1; do sleep 1; done
	@echo 'Backend is ready!'
	@until curl -f http://localhost:4200 > /dev/null 2>&1; do sleep 1; done
	@echo 'Frontend is ready!'
	@echo ''
	@echo 'Application is now running:'
	@echo '  Frontend: http://localhost:4200'
	@echo '  Backend:  http://localhost:4000'
	@echo '  Database: localhost:5435'
	@echo ''
	@echo 'Use "make docker/logs" to view logs'
	@echo 'Use "make docker/down" to stop services'

## fullstack/stop: stop the complete development environment
.PHONY: fullstack/stop
fullstack/stop:
	@echo 'Stopping complete development environment...'
	make docker/down

## fullstack/restart: restart the complete development environment
.PHONY: fullstack/restart
fullstack/restart:
	@echo 'Restarting complete development environment...'
	make docker/restart

## fullstack/reset: reset the complete development environment
.PHONY: fullstack/reset
fullstack/reset:
	@echo 'Resetting complete development environment...'
	make docker/reset

# ==================================================================================== # 
# DATABASE WITH DOCKER
# ==================================================================================== #
## db/reset: reset database with sample data using Docker
.PHONY: db/reset
db/reset:
	@echo 'Resetting database with sample data...'
	@./scripts/reset-with-images.sh