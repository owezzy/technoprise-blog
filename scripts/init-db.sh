#!/bin/bash
set -e

# This script initializes the PostgreSQL database for the technoprise application

echo "Creating technoprise database and user..."

# Create user if it doesn't exist and enable extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS citext;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
    DO \$\$
    BEGIN
        CREATE USER technoprise WITH ENCRYPTED PASSWORD 'pa55word';
        EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'User technoprise already exists';
    END
    \$\$;
    
    -- Grant privileges to technoprise user
    GRANT ALL PRIVILEGES ON DATABASE technoprise TO technoprise;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO technoprise;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO technoprise;
    
    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO technoprise;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO technoprise;
EOSQL

echo "Database initialization completed!"