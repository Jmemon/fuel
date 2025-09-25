# V0.7 Local Deployment Implementation Schema

## Docker Configuration Files

### docker-compose.yml
```yaml
version: '3.8'
# Full configuration as specified in requirements
# depends_on relationships: postgres -> fuel_backend -> fuel_frontend
# Network isolation: fuel_backend_network, fuel_frontend_network
# Volume persistence: postgres_data for database
# Migration auto-loading: ./database/migrations:/docker-entrypoint-initdb.d
```
**dependencies**: .env file, backend/Dockerfile, frontend/Dockerfile, database/migrations/ (from v0.3)

### .env
```bash
# Database, backend, and frontend configuration
# All environment variables as specified in requirements
```

### .gitignore
```gitignore
# Dependencies, environment, build outputs, runtime data, coverage, Docker, IDE, OS, logs
# Complete .gitignore as specified in requirements
```

## Backend Docker Configuration

### backend/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
# Package installation, TypeScript compilation, production startup
CMD ["npm", "start"]
```
**dependencies**: backend/package.json, backend/src/ (from v0.5), TypeScript compiler

### backend/.dockerignore
```dockerignore
# Exclude development files, source control, environment files
```

### backend/package.json (Docker scripts)
```json
{
  "scripts": {
    "build": (): calls [tsc]: compiles TypeScript source to JavaScript for production,
    "start": (): calls [node]: runs compiled JavaScript from dist/ directory,
    "dev": (): calls [nodemon, ts-node]: runs TypeScript directly for development
  }
}
```
**dependencies**: TypeScript, Node.js runtime

## Frontend Docker Configuration

### frontend/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Install dependencies including serve
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Install serve globally for production file serving
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve built files
CMD ["serve", "-s", "dist", "-l", "3000"]
```
**dependencies**: Node.js 18 Alpine, Vite build output, serve package

### frontend/.dockerignore
```dockerignore
node_modules/
npm-debug.log
.git/
.gitignore
README.md
.env
.env.local
coverage/
.vscode/
.idea/
dist/
build/
```

### frontend/package.json (Docker scripts)
```json
{
  "scripts": {
    "build": (): calls [tsc, vite]: compiles TypeScript and builds production React bundle,
    "preview": (): calls [vite]: serves built application for local testing
  }
}
```
**dependencies**: TypeScript, Vite, React build system

## Database Migration Integration

### Migration file loading
- Uses **database/migrations/** from v0.3 database schema
- PostgreSQL docker-entrypoint-initdb.d auto-executes:
  - `001_initial_schema.sql`: All CREATE TABLE statements
  - `002_add_indexes.sql`: All CREATE INDEX statements
- Files execute alphabetically during container initialization

**dependencies**: v0.3 database schema files (001_initial_schema.sql, 002_add_indexes.sql)

## Deployment Orchestration

### Service startup sequence:
1. **postgres**: calls [PostgreSQL initialization]: loads migration files and starts database
2. **fuel_backend**: calls [Docker build, npm start]: compiles and starts API server on port 3001
3. **fuel_frontend**: calls [Docker build, serve]: builds React app and serves static files on port 3000

### Port mapping:
- **Frontend**: Container port 3000 → Host `localhost:${FRONTEND_PORT}`
- **Backend**: Container port 3001 → Host `localhost:${BACKEND_PORT}`
- **Database**: Internal only, accessible via backend container

### Network architecture:
- **fuel_backend_network**: isolates postgres ↔ backend communication
- **fuel_frontend_network**: enables frontend ↔ backend communication
- **Host exposure**: frontend and backend ports accessible at localhost

### Data persistence:
- **postgres_data volume**: survives container lifecycle for database persistence
- **Environment-based config**: all secrets and URLs externalized via .env

**dependencies**: Docker Compose, PostgreSQL 14, Node.js 18, serve package