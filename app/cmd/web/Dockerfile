# Build stage
FROM node:18-alpine AS builder

# Install python and build tools (sometimes needed for node-gyp)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with fallback options
RUN npm ci --silent || \
    (npm cache clean --force && npm ci --silent --legacy-peer-deps) || \
    npm install --silent --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM caddy:alpine

# Copy built app from builder stage
COPY --from=builder /app/dist/fuse /usr/share/caddy

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
