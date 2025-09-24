# Fuel v1.0 - Local Git Hooks Integration

**Base Version:** v0.5 (see fuel-v0-5.md)
**Purpose:** Add automated git commit capture using local git hooks and repository registry system
**Timeline:** Version 1.0 upgrade from v0.5

## New Features in v1.0

### 1. Automated Git Repository Monitoring (Enhancement)
**Replaces manual import from v0.5 with:**
- Local git hooks for automatic commit capture
- Real-time activity log creation on commit events
- File-based event queue system for reliability

### 2. Repository Registry System (New)
- Local repository discovery and registration
- Git hook installation and management
- Project configuration and status tracking
- Multi-repository support with unified activity feed

### 3. Git Hook Management System (New)
- Automated hook installation across multiple repositories
- Hook status monitoring and maintenance
- Event processing and activity log creation
- Branch switching and checkout tracking

## Database Schema Changes from v0.5

### Enhanced Table: `connected_local_git_repos`
**Additions to existing v0.5 schema:**
```sql
ALTER TABLE connected_local_git_repos
ADD COLUMN hooks_status VARCHAR(50) DEFAULT 'not_installed',
ADD COLUMN last_hook_event TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_connected_local_git_repos_hooks_status ON connected_local_git_repos(hooks_status);
```

## API Changes from v0.5

### Repository Management Endpoints

**Discover Local Repositories**
- `POST /api/repositories/discover`
- Body: `{ search_paths?: string[] }` (optional, defaults to ~/Desktop)
- Response: `{ repositories: Array<RepoDiscovery>, total_found: number }`

**Register Repository**
- `POST /api/repositories/register`
- Body: `{ name: string, repo_path: string, install_hooks?: boolean }`
- Response: `{ id: UUID, name: string, repo_path: string, hooks_status: string }`

**List Registered Repositories**
- `GET /api/repositories`
- Response: `{ repositories: Array<Repository> }`

**Install Git Hooks**
- `POST /api/repositories/:id/install-hooks`
- Response: `{ success: boolean, hooks_installed: string[] }`

**Uninstall Git Hooks**
- `DELETE /api/repositories/:id/hooks`
- Response: `{ success: boolean, hooks_removed: string[] }`

**Check Hook Status**
- `GET /api/repositories/:id/hook-status`
- Response: `{ status: string, hooks: object, last_event: string }`

### Event Processing Endpoints

**Process Git Events**
- `POST /api/git-events/process`
- Response: `{ processed: number, errors: number }`

**Get Event Queue Status**
- `GET /api/git-events/queue-status`
- Response: `{ pending_events: number, last_processed: string }`

## Git Hook Implementation

### Post-Commit Hook
```bash
#!/bin/sh
# .git/hooks/post-commit
# Fuel Hook - Auto-generated

# Ensure fuel events directory exists
mkdir -p ~/.fuel/events

# Build commit event payload
cat <<EOF >> ~/.fuel/events/git-events.jsonl
{"event_type":"commit","timestamp":"$(date -Iseconds)","commit_hash":"$(git rev-parse HEAD)","message":$(git log -1 --pretty=%B | jq -Rs .),"author_name":"$(git log -1 --pretty=%an)","author_email":"$(git log -1 --pretty=%ae)","commit_timestamp":"$(git log -1 --pretty=%ci)","repo_path":"$(git rev-parse --show-toplevel)","repo_name":"$(basename $(git rev-parse --show-toplevel))","branch":"$(git branch --show-current)","files_changed":$(git diff-tree --no-commit-id --name-only -r HEAD | jq -Rs 'split("\n")[:-1]')}
EOF
```

### Post-Checkout Hook
```bash
#!/bin/sh
# .git/hooks/post-checkout
# Fuel Hook - Auto-generated

PREV_HEAD=$1
NEW_HEAD=$2
CHECKOUT_TYPE=$3

# Only track branch checkouts (not file checkouts)
if [ "$CHECKOUT_TYPE" = "1" ]; then
  mkdir -p ~/.fuel/events

  cat <<EOF >> ~/.fuel/events/git-events.jsonl
{"event_type":"branch_checkout","timestamp":"$(date -Iseconds)","prev_head":"$PREV_HEAD","new_head":"$NEW_HEAD","prev_branch":"$(git name-rev --name-only $PREV_HEAD 2>/dev/null || echo 'unknown')","new_branch":"$(git name-rev --name-only $NEW_HEAD 2>/dev/null || echo 'unknown')","repo_path":"$(git rev-parse --show-toplevel)","repo_name":"$(basename $(git rev-parse --show-toplevel))"}
EOF
fi
```

## Repository Discovery System

### Automatic Repository Discovery
The system scans ~/Desktop to find git repositories for user selection:

**Search Location:**
- `~/Desktop` only (recursively, max depth: 3 levels)

**Discovery Process:**
1. Scan ~/Desktop for directories containing `.git` folders
2. Extract repository metadata (name, current branch, remote URL)
3. Check repository status (clean/dirty, last commit info)
4. Present discovered repositories in selection interface
5. User can select repositories to register from discovery results
6. User can also manually add repositories not found in ~/Desktop

**Repository Information Collected:**
- Repository name (directory name)
- Full local path
- Current active branch
- Remote URL (if configured)
- Working directory status
- Last commit information

## Hook Installation System

### Git Hook Installer
Manages the installation and maintenance of git hooks across repositories:

**Supported Hooks:**
- `post-commit`: Captures commit events
- `post-checkout`: Tracks branch switching

**Installation Process:**
1. Backup any existing hooks with timestamp
2. Deploy Fuel hook templates to `.git/hooks/`
3. Make hooks executable (chmod +x)
4. Verify hook installation and functionality
5. Update repository status in database

**Hook Template System:**
- Standardized hook scripts ensure consistent behavior
- Templates include Fuel identifier for safe management
- Customizable hook behavior through template variables

**Backup and Restore:**
- Existing hooks automatically backed up before installation
- Backup files named with timestamp (e.g., `post-commit.backup.1642089600`)
- Restore capability when uninstalling Fuel hooks

## Event Processing System (SLIGHTLY UNCERTAIN)

### Git Event Monitor
Monitors and processes git events from hook-generated files:

**File-Based Event System:**
- Events written to `~/.fuel/events/git-events.jsonl`
- Each event is a single JSON line (JSONL format)
- File monitoring detects new events in real-time
- Processed events archived to separate file

**Event Processing Pipeline:**
1. **File Monitoring**: Watch for changes to git-events.jsonl
2. **Event Parsing**: Read and validate new JSONL entries
3. **Data Transformation**: Convert git events to activity log format
4. **Database Storage**: Create activity logs and commit records
5. **Event Archival**: Move processed events to archive file

**Event Types Processed:**
- **commit**: New commits captured by post-commit hook
- **branch_checkout**: Branch switches from post-checkout hook

### Event Data Transformation (SLIGHTLY UNCERTAIN)

**Commit Event Processing:**
1. Find or create project record for repository
2. Create activity_logs entry with type "commit"
3. Create commits entry with detailed commit information
4. Link commit to appropriate project
5. Mark activity as unreviewed for user attention

**Branch Checkout Processing:**
1. Create activity log for significant branch changes
2. Track branch switching patterns for insights

## User Interface Changes from v0.5

### Repository Management UI Requirements
- **Repository Discovery Interface**: Button to scan ~/Desktop for git repositories
- **Repository Selection Modal**: Present discovered repositories with metadata for selection
- **Manual Repository Addition**: Form to manually add repository paths not found in scan
- **Repository List View**: Display all registered repositories with status indicators
- **Hook Status Indicators**: Visual indicators (installed, not installed, outdated, error)
- **Hook Management Actions**: Install, uninstall, update, and test hooks per repository
- **Repository Details View**: Show repository metadata, hook status, and recent events

### Enhanced Sidebar Navigation Requirements
- **Repository Filter**: Dropdown to filter activity logs by specific repository
- **Repository Status Section**: Summary view of all repositories with hook health indicators
- **Event Queue Display**: Show count of pending git events awaiting processing
- **Repository Quick Actions**: Direct access to common repository management tasks

### Activity Log Display Enhancements
- **Repository Identification**: Clear labeling of which repository each commit came from
- **Repository Grouping**: Option to group activity logs by repository
- **Hook Capture Indication**: Visual indicator that activity was captured via git hooks
- **Repository Status Integration**: Show repository health alongside activity logs

## Technical Architecture Changes from v0.5

### New File System Monitor Service
- **Purpose**: Monitor ~/.fuel/events/git-events.jsonl for new entries
- **Technology**: File system watching with debouncing to prevent duplicate processing
- **Responsibilities**: Parse events, validate data, transform to activity logs
- **Error Handling**: Malformed event logging, processing retry logic

### Enhanced Core API Service
**New responsibilities added to v0.5:**
- Repository discovery through file system scanning
- Git hook template management and deployment
- Event processing pipeline coordination
- Repository status monitoring and reporting

### Git Hook Template System
- **Hook Storage**: Template hooks stored in application resources
- **Deployment**: Automated copying and customization of hooks
- **Version Management**: Hook versioning for updates and compatibility
- **Safety Features**: Backup existing hooks before installation

## Data Flow Changes from v0.5

### New Automatic Log Creation Flow
1. Developer commits to registered git repository
2. Post-commit hook executes, writes event to ~/.fuel/events/git-events.jsonl
3. File system monitor detects file change
4. Event processor reads and validates new event
5. Event transformed into activity log and commit record
6. Activity marked as unreviewed in default view
7. Event archived to processed events file

### Repository Registration Flow
1. User initiates repository discovery or manual registration
2. System scans ~/Desktop for git repositories
3. Repository metadata extracted and presented to user
4. User selects repositories to register from results
5. System creates connected_local_git_repos records
6. Optional: Install git hooks during registration
7. Repository status updated and displayed in management UI

### Hook Installation Flow
1. User selects repository and requests hook installation
2. System validates repository path and git configuration
3. Existing hooks backed up with timestamp
4. Fuel hooks deployed from templates to .git/hooks/
5. Hooks made executable and tested for basic functionality
6. Repository hooks_status updated to "installed"
7. Hook health monitoring begins

## Performance Requirements for v1.0

### Event Processing Performance
- **Event Detection**: < 1 second to detect new events in file
- **Event Processing**: < 2 seconds per commit event transformation
- **File Monitoring**: Efficient watching without polling overhead
- **Batch Processing**: Handle multiple events in single processing cycle

### Repository Management Performance
- **Discovery**: < 10 seconds to scan ~/Desktop for repositories
- **Hook Installation**: < 3 seconds per repository
- **Status Checking**: < 1 second for repository health verification
- **UI Updates**: Real-time status updates without page refresh

### Scalability Targets
- Support 20+ registered repositories simultaneously
- Handle 100+ commits per day across all repositories
- Event file rotation when exceeding 10MB
- Maintain responsiveness with large commit volumes

## Security Requirements for v1.0

### File System Security
- **Access Control**: Event files readable only by Fuel application
- **Path Validation**: Prevent directory traversal attacks in repository paths
- **Hook Safety**: Hooks execute with user permissions only
- **Backup Integrity**: Secure backup and restore of existing hooks

### Git Integration Security
- **Hook Isolation**: Hooks don't modify git operations, only observe
- **Error Handling**: Hook failures don't block git operations
- **Input Sanitization**: All git command outputs properly escaped
- **Permission Respect**: No elevation of privileges required

## Testing Requirements for v1.0

### Git Hook Integration Testing
- **Hook Triggering**: Verify hooks execute on commits and branch switches
- **Event Capture**: Validate complete and accurate event data capture
- **Error Resilience**: Ensure hooks handle edge cases without breaking git
- **Performance Impact**: Confirm minimal impact on git operation speed

### Repository Management Testing
- **Discovery Accuracy**: Test repository detection in ~/Desktop
- **Hook Installation**: Verify safe installation with existing hooks present
- **Status Monitoring**: Confirm accurate hook health reporting
- **Multi-Repository**: Test concurrent operations across multiple repositories

### Event Processing Testing
- **File Monitoring**: Test real-time event detection and processing
- **Data Integrity**: Verify event data accuracy from hook to database
- **Error Recovery**: Test system recovery from processing failures
- **Performance**: Validate processing speed under various loads

## Configuration for v1.0

### Environment Variables
```
# Repository Discovery
DEFAULT_SEARCH_PATH=~/Desktop
MAX_DISCOVERY_DEPTH=3

# Event Processing
GIT_EVENTS_FILE=~/.fuel/events/git-events.jsonl
EVENT_PROCESSING_INTERVAL=5000  # milliseconds
MAX_EVENT_FILE_SIZE_MB=10

# Hook Management
HOOKS_TEMPLATE_PATH=./hooks/templates
BACKUP_EXISTING_HOOKS=true
HOOK_INSTALL_TIMEOUT=5000  # milliseconds
```

### Database Indexes
```sql
-- Enhanced connected_local_git_repos indexes
CREATE INDEX idx_connected_local_git_repos_hooks_status ON connected_local_git_repos(hooks_status);
```

## v1.0 Success Criteria

### Functional Success
- Successfully discover and register git repositories from ~/Desktop
- Install and maintain git hooks across multiple repositories
- Capture commit and branch switch events reliably
- Process events into activity logs without data loss
- Provide clear repository and hook status information

### Technical Success
- File-based event system prevents event loss during downtime
- Hook installation preserves existing workflows and hooks
- Event processing scales to handle multiple active repositories
- Repository management provides clear operational visibility
- Clean foundation for v1.2 Claude Code integration

### User Experience Success
- Intuitive repository discovery and registration process
- Clear visual indicators for hook status across repositories
- Zero impact on normal git workflow performance
- Automatic activity log creation without manual intervention
- Reliable operation across different development environments

This local git hooks approach provides a robust, reliable foundation for automated commit tracking that works entirely offline and integrates seamlessly with existing git workflows.