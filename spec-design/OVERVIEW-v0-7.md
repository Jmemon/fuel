# Fuel Project File Structure

## Root Structure
```
fuel/
├── docker-compose.yml
├── .env
├── .gitignore
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_add_indexes.sql
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── cli/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── models/
│   │   │   ├── ActivityLog.ts
│   │   │   ├── ManualLog.ts
│   │   │   ├── GitCommit.ts
│   │   │   ├── ClaudeCodeConversation.ts
│   │   │   ├── GitCheckout.ts
│   │   │   ├── GitHooksInstalled.ts
│   │   │   └── ConnectedLocalGitRepo.ts
│   │   ├── routes/
│   │   │   └── activityLogs.ts
│   │   ├── services/
│   │   │   ├── ActivityLogService.ts
│   │   │   └── DatabaseService.ts
│   │   ├── middleware/
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   └── types/
│   │       └── api.ts
│   └── tests/
│       ├── integration/
│       └── unit/
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── Header/
    │   │   │   ├── Header.tsx
    │   │   │   └── FilterControls.tsx
    │   │   ├── Sidebar/
    │   │   │   └── Sidebar.tsx
    │   │   └── MainView/
    │   │       ├── MainView.tsx
    │   │       ├── LogFeed.tsx
    │   │       ├── LogEntry.tsx
    │   │       └── ManualLogForm.tsx
    │   ├── hooks/
    │   │   ├── useActivityLogs.ts
    │   │   └── useFilters.ts
    │   ├── services/
    │   │   └── api.ts
    │   ├── stores/
    │   │   └── appStore.ts
    │   ├── types/
    │   │   └── api.ts
    │   └── styles/
    │       └── index.css
    └── tests/
        ├── e2e/
        └── unit/
```

## Component Architecture

### Backend Structure
- **Models**: Database entity models with type definitions
- **Routes**: Express route handlers for API endpoints
- **Services**: Business logic layer for data operations
- **Middleware**: Request validation, error handling, CORS
- **Config**: Database connection and environment configuration

### Frontend Structure
- **Components**: Reusable UI components organized by feature
- **Hooks**: Custom React hooks for data fetching and state management
- **Services**: API client and external service integrations
- **Stores**: Zustand stores for global state management
- **Types**: TypeScript type definitions shared across components

### Database Structure
- **Migrations**: SQL files for database schema initialization
- **Schema**: Follows v0.3 database design with proper indexes and relationships