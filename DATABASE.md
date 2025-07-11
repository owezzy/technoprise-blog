# Database Setup

This project uses PostgreSQL as the database, configured to run in Docker for easy development setup.

## Prerequisites

- **Docker & Docker Compose** - For running PostgreSQL in containers
- **golang-migrate** - For database migrations (see installation instructions below)
- **PostgreSQL client (optional)** - For direct database access via `make db/psql`

## Quick Start

1. **Complete setup (recommended):**
   ```bash
   make dev/start
   ```
   This will:
   - Check Docker is running
   - Start PostgreSQL in Docker
   - Wait for the database to be ready
   - Run all migrations
   - Build the API

2. **Or manual setup:**
   ```bash
   make db/setup    # Setup database
   make run/api     # Start the API
   ```

## Database Commands

### Docker Commands
- `make db/docker/start` - Start PostgreSQL container
- `make db/docker/stop` - Stop PostgreSQL container  
- `make db/docker/restart` - Restart PostgreSQL container
- `make db/docker/logs` - View database logs

### Migration Commands
- `make db/migrations/new name=migration_name` - Create new migration
- `make db/migrations/up` - Apply all up migrations
- `make db/migrations/down` - Apply all down migrations

### Migration Tool Installation

This project uses [golang-migrate](https://github.com/golang-migrate/migrate) for database migrations.

#### Install golang-migrate

**macOS (using Homebrew):**
```bash
brew install golang-migrate
```

**Linux:**
```bash
# Download and install
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
```

**Windows:**
```bash
# Using Chocolatey
choco install migrate

# Or download from releases
# https://github.com/golang-migrate/migrate/releases
```

**Using Go:**
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

#### Verify Installation
```bash
migrate -version
# Should output version information
```

## Database Migrations

### Overview
Database migrations are version-controlled schema changes that allow you to evolve your database structure over time while maintaining data integrity.

### Current Migrations
The project includes the following migrations:

1. **000004_create_users_table** - User accounts and authentication
2. **000005_create_tokens_table** - Authentication tokens
3. **000006_add_permissions** - User permissions system
4. **000007_create_posts_table** - Blog posts
5. **000008_add_posts_indexes** - Performance indexes for posts
6. **000009_create_images_table** - Image attachments for posts

### Creating New Migrations

1. **Create a new migration:**
   ```bash
   make db/migrations/new name=add_user_profiles
   ```
   This creates two files:
   - `000010_add_user_profiles.up.sql` - Forward migration
   - `000010_add_user_profiles.down.sql` - Rollback migration

2. **Edit the migration files:**
   ```sql
   -- 000010_add_user_profiles.up.sql
   CREATE TABLE user_profiles (
       id bigserial PRIMARY KEY,
       user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       bio text,
       avatar_url text,
       created_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),
       updated_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
   ```

   ```sql
   -- 000010_add_user_profiles.down.sql
   DROP TABLE IF EXISTS user_profiles;
   ```

3. **Apply the migration:**
   ```bash
   make db/migrations/up
   ```

### Migration Commands (Direct)

If you prefer to use the migrate tool directly:

```bash
# Apply all migrations
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN up

# Apply specific number of migrations
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN up 2

# Rollback one migration
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN down 1

# Check current migration version
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN version

# Force migration to specific version (use with caution)
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN force 5
```

### Migration Best Practices

1. **Always create both up and down migrations**
   - Up migrations apply changes
   - Down migrations rollback changes
   - Test both directions

2. **Use descriptive names**
   ```bash
   # Good
   make db/migrations/new name=add_user_email_index
   make db/migrations/new name=create_categories_table
   
   # Less clear
   make db/migrations/new name=update_users
   make db/migrations/new name=fix_db
   ```

3. **Make migrations idempotent**
   ```sql
   -- Good - won't fail if column already exists
   ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
   
   -- Better - check for existence first
   DO $$ 
   BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'users' AND column_name = 'email_verified') THEN
           ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
       END IF;
   END $$;
   ```

4. **Use transactions for complex migrations**
   ```sql
   BEGIN;
   
   -- Multiple related changes
   CREATE TABLE new_table (...);
   ALTER TABLE existing_table ADD COLUMN ...;
   UPDATE existing_table SET ...;
   
   COMMIT;
   ```

5. **Test migrations thoroughly**
   ```bash
   # Apply migration
   make db/migrations/up
   
   # Test your application
   make run/api
   
   # Rollback to test down migration
   make db/migrations/down
   
   # Apply again
   make db/migrations/up
   ```

### Database Access
- `make db/psql` - Connect to database with psql (requires PostgreSQL client)
- `docker-compose exec postgres psql -U technoprise -d technoprise` - Connect via Docker

## Configuration

The database configuration is stored in `.envrc`:
```bash
export TECHNOPRISE_DB_DSN='postgres://technoprise:pa55word@localhost:5435/technoprise?sslmode=disable'
```

## Docker Setup

The database runs in Docker using:
- **Image:** `postgres:15-alpine`
- **Container:** `technoprise_db`
- **Port:** `5435` (mapped to container port 5432)
- **Database:** `technoprise`
- **User:** `technoprise`
- **Password:** `pa55word`

## Available Tables

After running migrations, the following tables will be created:
- `users` - User accounts
- `tokens` - Authentication tokens
- `permissions` - User permissions
- `users_permissions` - User-permission relationships
- `posts` - Blog posts

## Troubleshooting

### Database Won't Start
```bash
# Check if port 5435 is already in use
lsof -i :5435

# Stop any existing containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
make db/setup
```

### Migration Errors
```bash
# Check migration status
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN version

# Force migration version (use with caution)
migrate -path ./migrations -database $TECHNOPRISE_DB_DSN force VERSION_NUMBER
```

### Connection Issues
```bash
# Test database connectivity
make db/psql

# Check Docker logs
make db/docker/logs
```