# Fuel v0.7 - Local Deployment

## Deployment

### Docker Compose Configuration

The application deploys using three Docker containers:

**Prerequisites:**
- Create `./database/migrations/` directory in project root
- Add SQL migration files (e.g., `001_initial_schema.sql`, `002_add_indexes.sql`) to auto-initialize database schema

#### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: fuel_postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    networks:
      - fuel_backend_network
    # Note: No external port exposure - only accessible to backend

  fuel_backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fuel_backend
    environment:
      NODE_ENV: ${NODE_ENV}
      PORT: ${BACKEND_PORT}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      CORS_ORIGIN: ${FRONTEND_URL}
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    depends_on:
      - postgres
    networks:
      - fuel_backend_network
      - fuel_frontend_network

  fuel_frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: fuel_frontend
    environment:
      VITE_API_BASE_URL: ${BACKEND_URL}
      NODE_ENV: ${NODE_ENV}
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - fuel_backend
    networks:
      - fuel_frontend_network

volumes:
  postgres_data:

networks:
  fuel_backend_network:
    driver: bridge
  fuel_frontend_network:
    driver: bridge
```

### Environment Variables

#### .env file structure
```
# Database Configuration
POSTGRES_DB=fuel_activity_log
POSTGRES_USER=fuel_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_PORT=5432

# Backend Configuration
NODE_ENV=production
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000
```

## Data Persistence and Backup

### Local Data Persistence
The PostgreSQL database uses Docker named volumes for data persistence:

- **Data survives app shutdown**: Running `docker-compose down` keeps all database data
- **Persistent storage location**: Data stored in Docker volume `postgres_data`
- **Volume location**: Managed by Docker, typically in `/var/lib/docker/volumes/`

### Data Loss Scenarios
Database data will only be lost if you explicitly remove the volume:
```bash
# These commands WILL delete your data:
docker-compose down -v          # Removes volumes
docker volume rm postgres_data  # Removes specific volume
docker system prune --volumes   # Removes all unused volumes
```

### Future: Remote Backup Strategy
For production deployments, consider implementing:

- **Automated database backups** to cloud storage (S3, Google Cloud Storage)
- **Scheduled pg_dump exports** with rotation policy
- **Database replication** for high availability
- **Point-in-time recovery** capabilities
- **Backup monitoring and alerting**

**Recommended backup frequency**: Daily for active development, hourly for production use