# Fuel v0.5 - Frontend, Backend & Local Deployment

## Project Overview

**Project Name:** Fuel v0.5
**Purpose:** A foundational personal development activity log system with PostgreSQL database and UI for managing and reviewing activity entries.
**Target User:** Individual developers who want to track and review their daily coding activities across multiple projects.
**Timeline:** Version 0.5 (Basic MVP without automated webhooks)

## Core Functionality

### 1. Activity Log Management
- Manual activity log entry creation capability
- Review status tracking (reviewed/unreviewed)
- Activity log: id, reviewed: bool, type: "manual" | <future-types>, created_at, updated_at

### 2. Filtering and Viewing
- Filter activity logs by created_at
- Concatenated view of filtered logs organized chronologically, a feed
- Default view shows all unreviewed logs
- Automatic marking of logs as "reviewed" when viewed

## User Interface Specification

### Layout Structure

The application uses a three-component layout:

1. **Header**: Contains app title and contextual filter controls
2. **Sidebar**: Navigation and future feature placeholders
3. **Main View**: Primary content area for displaying logs

### Header Component
- Displays "Fuel" as the main title
- When Log View is active, displays filter controls:
  - Date range picker (from/to dates)
  - Apply/Clear filter buttons

### Sidebar Component
- **Log View** clickable div
  - Always visible
  - When clicked, activates Log View in main area
  - Activates filter controls in header
- **Horizontal divider** below Log View
- **Empty space below divider** (reserved for v1.0 features)

### Main View Component

#### Default State (App Load)
- Automatically displays all unreviewed logs
- Logs organized chronologically within each project
- Immediately marks displayed logs as reviewed
- Shows message if no unreviewed logs exist

#### Filtered Log View
- Default is a feed of unreviewed logs
- Displays logs matching selected date filters
- Organized chronologically across all activity types
- Does not automatically mark as reviewed (only unreviewed default view does this)
- Shows count of matching logs

#### Log Entry Display Format
```
Date
  • [Time] [Type] Activity content (commit message, conversation summary, or manual entry)
  • [Time] [Type] Another activity entry
  • [Time] [Type] Another activity entry

Another Date
  • [Time] [Type] Activity content
```

## Technical Architecture

### Client Layer (React UI)
- **Technology**: React 18 with TypeScript
- **State Management**: Zustand for simple state needs
- **Styling**: Tailwind CSS for consistent design
- **Build Tool**: Vite for fast development
- **API Communication**: Axios/Fetch for REST API calls to backend
- **Container**: `fuel_frontend` Docker container

### Server Layer (Node.js API)
- **Technology**: Node.js with Express.js
- **Language**: TypeScript
- **Database Client**: postgres.js (https://github.com/porsager/postgres)
- **Validation**: Input validation for API endpoints
- **Container**: `fuel_backend` Docker container
- **Port**: 3001 (configurable via environment)

### Database Layer (PostgreSQL)
- **Technology**: PostgreSQL 14+
- **Configuration**: Connection pooling via postgres.js
- **Migrations**: SQL migration files
- **Indexes**: Optimized for common query patterns (repo+date, reviewed status)
- **Container**: `postgres` Docker container
- **Port**: 5432

## API Specification

### Base URL
```
http://localhost:3001/api/v1
```

### Endpoints

#### GET /activity-logs
Retrieve activity logs with optional filtering.

**Query Parameters:**
- `from_date` (optional): ISO date string (YYYY-MM-DD) - filter logs from this date
- `to_date` (optional): ISO date string (YYYY-MM-DD) - filter logs to this date
- `reviewed` (optional): boolean - filter by review status
- `type` (optional): string - filter by activity type ("manual", "git_commit", "claude_code", "git_checkout", "git_hook_install")

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "manual",
      "reviewed": false,
      "created_at": "2024-01-15T10:30:00Z",
      "reviewed_at": null,
      "content": {
        "text": "Manual activity entry text"
      }
    }
  ],
  "meta": {
    "total": 25,
    "count": 10
  }
}
```

#### POST /activity-logs
Create a new manual activity log entry.

**Request Body:**
```json
{
  "content": {
    "text": "Manual activity entry text"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "type": "manual",
    "reviewed": false,
    "created_at": "2024-01-15T10:30:00Z",
    "reviewed_at": null,
    "content": {
      "text": "Manual activity entry text"
    }
  }
}
```

#### PUT /activity-logs/:id
Update an existing manual activity log entry.

**Path Parameters:**
- `id`: UUID of the activity log to update

**Request Body:**
```json
{
  "content": {
    "text": "Updated manual activity entry text"
  },
  "reviewed": true
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "type": "manual",
    "reviewed": true,
    "created_at": "2024-01-15T10:30:00Z",
    "reviewed_at": "2024-01-15T11:00:00Z",
    "content": {
      "text": "Updated manual activity entry text"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Activity log not found
- `422 Unprocessable Entity`: Cannot edit non-manual activity logs
- `500 Internal Server Error`: Server error

## Data Flow

### User Review Flow
1. User opens application
2. System fetches all unreviewed logs
3. Logs displayed in organized format in main view
4. System immediately marks displayed logs as reviewed
5. User can apply filters to view specific subsets of logs

### Manual Entry Flow
1. User clicks "Add Manual Entry"
2. User enters content
3. System creates activity log entry with current date
4. Entry appears in appropriate filtered views

## Security Requirements

### Data Protection
- Database credentials in environment variables
- No sensitive data in logs
- Regular automated backups

## Performance Requirements

### Scalability
- Support up to 50 connected local git repositories per user
- Store unlimited historical activity log data

### Reliability
- 99.9% uptime for API endpoints
- Graceful degradation when external services unavailable

## Testing Requirements

### End-to-End Testing
- Complete user workflows from UI to database
- Filter and search functionality testing
- Cross-browser compatibility testing
- Manual log creation and review workflows
- Performance testing under realistic load

## Success Criteria

### Functional Success
- Provides functional filtering and viewing interface
- Marks logs as reviewed when viewed
- Supports manual log entry creation

### Technical Success
- Fast query performance for typical filter operations
- Clean, maintainable codebase ready for v1.0 features
- Proper error handling and logging throughout system

### User Experience Success
- Intuitive interface requiring minimal learning
- Fast load times for typical activity log viewing
- Clear organization of logs by project and time
- Responsive design working on desktop browsers

## Deployment

See [fuel-v0-7-local-deploy.md](./fuel-v0-7-local-deploy.md) for Docker Compose configuration and environment setup.

## Future Considerations (v1.0 Preview)

While not implemented in v0.5, the architecture should accommodate:
- Authentication and user management (v0.8)
- Automated GitHub webhook integration (v1.0)
- Real-time commit capture (v1.0)
- Claude code integration (v1.2)
- Enhanced filtering and search capabilities
- Multi-user support