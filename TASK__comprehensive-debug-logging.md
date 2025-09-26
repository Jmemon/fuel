# Comprehensive Debug Logging Implementation

## Task Description
Add comprehensive debug logging to frontend (React), backend (Node.js/Express), and PostgreSQL services to diagnose issues with frontend responsiveness and backend/database visibility. The solution will be straightforward with extensive log statements viewable via Docker logs commands.

## High-Level Design
**Architecture**: Multi-tier logging strategy with service-specific approaches
- **Backend**: Winston logger with multiple transports (console, file, error levels)
- **Frontend**: Console logging with network request/response tracking and component lifecycle logging
- **PostgreSQL**: Enhanced query logging and connection monitoring via configuration
- **Infrastructure**: Docker Compose log aggregation with proper log drivers

**Integration Strategy**: Each service logs independently but follows consistent patterns for correlation via timestamps and request IDs.

## File-Level Changes

**To-Be-Created:**
- `backend/src/utils/logger.ts` - Winston logger configuration
- `frontend/src/utils/logger.ts` - Frontend logging utility
- `backend/logs/` directory - Log file storage
- `database/postgresql.conf` - PostgreSQL logging configuration

**To-Be-Modified:**
- `backend/package.json` - Add Winston dependency
- `backend/src/index.ts` - Add request logging middleware
- `backend/src/routes/activityLogs.ts` - Add route-level logging
- `backend/src/services/DatabaseService.ts` - Add database operation logging
- `frontend/src/services/api.ts` - Add HTTP request/response logging
- `frontend/src/App.tsx` - Add application lifecycle logging
- `frontend/src/components/**/*.tsx` - Add component interaction logging
- `docker-compose.yml` - Add logging configuration and volume mounts
- `backend/Dockerfile` - Create logs directory
- `.env` - Add logging level environment variables

## Implementation Sections

### Create: Winston Logger Configuration (Backend)
Winston logger setup in `backend/src/utils/logger.ts` with multiple transports:
- Console transport for Docker logs visibility
- File transport for persistent storage (error.log, combined.log)
- Configurable log levels via environment variables
- Request correlation IDs for tracing requests across services
- Structured JSON logging for machine readability
- Timestamp formatting for easy debugging

### Create: Frontend Debug Logger
Browser-compatible logging utility in `frontend/src/utils/logger.ts`:
- Console logging with color coding by severity
- HTTP request/response interceptor logging
- Component mount/unmount lifecycle tracking
- State change logging integration
- Error boundary logging
- Performance timing measurements for slow operations

### Create: PostgreSQL Logging Configuration
Database-level logging via `database/postgresql.conf`:
- Query logging with execution times
- Connection logging for debugging connection issues
- Lock waiting and deadlock detection
- Statement duration logging for performance analysis
- Authentication and authorization logging
- Checkpoint and background writer activity logging

### Update: Backend Request/Response Logging
Enhance existing Express application in `backend/src/index.ts`:
- Request ID generation middleware
- HTTP request logging (method, URL, headers, body)
- Response logging (status, duration, response size)
- Error logging with full stack traces
- Database query logging in service layer
- Route-specific debugging information

### Update: Frontend API and Component Logging
Enhance React application components and services:
- Axios interceptors for HTTP request/response logging in `frontend/src/services/api.ts`
- Component lifecycle logging in major components
- State store action logging via Zustand middleware
- User interaction event logging
- Error boundary implementation with detailed error reporting
- Network connectivity and retry logging

### Update: Docker Infrastructure for Log Management
Enhance `docker-compose.yml` for centralized logging:
- Log driver configuration for each service
- Volume mounts for persistent log storage
- Environment variables for log levels
- Log rotation policies
- Centralized log aggregation setup for easy `docker logs` access

**Dependencies to Add:**
- Backend: `winston`, `winston-daily-rotate-file`, `@types/winston`
- Frontend: Enhanced console methods, no additional packages needed
- PostgreSQL: Configuration-only changes

**Environment Configuration:**
- `LOG_LEVEL` for controlling verbosity
- `LOG_TO_FILE` for enabling file logging
- `LOG_DIR` for custom log directory paths
- `POSTGRES_LOG_STATEMENT` for database query logging

This plan provides comprehensive visibility into all three tiers while maintaining simplicity - you'll be able to see everything that's happening by running `docker logs fuel_backend`, `docker logs fuel_frontend`, and `docker logs postgres` commands.