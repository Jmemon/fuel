

# Fuel v0.8 - FuelEvents Queue System

**Base Version:** v0.5 (see fuel-v0-5-frontend-backend.md)
**Purpose:** Add app-agnostic event queue system for capturing events from integrated applications
**Timeline:** Version 0.8 upgrade from v0.5

## Overview

FuelEvents system provides a reliable, app-agnostic queue for capturing events from integrated applications (git hooks, Claude Code, future integrations) and processing them into activity logs and specialized records.

**Storage:** `~/.fuel/events/` directory-based queue
**Processing:** Handler-based system that transforms events into database records via DatabaseService

## Architecture Principles

1. **App-Agnostic**: Queue system doesn't know about specific event formats
2. **Handler-Based**: Each app integration provides its own event processing handler
3. **Always Available**: Queue accepts events whether Fuel is running or not
4. **Atomic Operations**: File operations prevent corruption during concurrent writes
5. **Reliable Processing**: Events persist until successfully processed with retry capability

## Directory Structure

```
~/.fuel/events/
├── pending/           # New events awaiting processing
├── processing/        # Events currently being processed
├── completed/         # Successfully processed events
├── failed/           # Failed events awaiting retry
├── archive/          # Old completed events (rotated)
└── .metadata         # Queue metadata and configuration
```

### Handling Existing ~/.fuel Directory

**Directory Setup Strategy:**
1. Check if `~/.fuel` exists
2. If exists, validate structure and merge safely
3. Backup existing content before any modifications
4. Create missing subdirectories as needed
5. Initialize `.metadata` file if not present

## Event File Format

### Naming Convention
```
{timestamp}_{event_type}_{unique_id}_{context}.json

Examples:
20240115_103045_123_commit_a1b2c3d4.json
20240115_104230_456_claude_session_89abcdef.json
20240115_105015_789_checkout_feature_branch.json
```

### Base FuelEvent Structure
```typescript
interface FuelEvent {
  event_id: string;           // Unique identifier
  event_type: string;         // Handler key (commit, claude_session_end, etc.)
  timestamp: string;          // ISO 8601 timestamp
  created_at: string;         // When event was written to queue
  app_source: string;         // Source application (git, claude_code, etc.)
  data: Record<string, any>;  // App-specific event data
}
```

## Handler Interface System

### Handler Registration
```typescript
// backend/src/services/FuelEventHandler.ts
interface FuelEventHandler {
  eventType: string;
  appSource: string;

  processEvent(fuelEvent: FuelEvent): Promise<ProcessedEventData>;
}

interface ProcessedEventData {
  activityLogParams: CreateActivityLogParams;
  specializedRecordParams: any; // Varies by handler
  specializedTableName: string;
}

// Handler registry manages available handlers
class FuelEventHandlerRegistry {
  private handlers = new Map<string, FuelEventHandler>();

  registerHandler(handler: FuelEventHandler): void;
  getHandler(eventType: string): FuelEventHandler | null;
  listSupportedEventTypes(): string[];
}
```

### Example Handler Implementation
```typescript
// Future git integration would provide this handler
class GitCommitEventHandler implements FuelEventHandler {
  eventType = 'commit';
  appSource = 'git';

  async processEvent(fuelEvent: FuelEvent): Promise<ProcessedEventData> {
    const { data } = fuelEvent;

    return {
      activityLogParams: {
        type: 'commit',
        timestamp: fuelEvent.timestamp,
        project_id: await this.resolveProjectId(data.repo_path),
        summary: `Commit: ${data.message.substring(0, 100)}`,
        details: JSON.stringify({
          commit_hash: data.commit_hash,
          branch: data.branch,
          files_changed: data.files_changed
        })
      },
      specializedRecordParams: {
        commit_hash: data.commit_hash,
        message: data.message,
        author_name: data.author_name,
        author_email: data.author_email,
        commit_timestamp: data.commit_timestamp,
        project_id: await this.resolveProjectId(data.repo_path),
        branch: data.branch,
        files_changed: data.files_changed
      },
      specializedTableName: 'git_commits'
    };
  }

  private async resolveProjectId(repoPath: string): Promise<string> {
    // Logic to find/create project based on repo path
  }
}
```

## Event Processing Service

### Core Service Architecture
```typescript
// backend/src/services/EventQueueService.ts
class EventQueueService {
  constructor(
    private handlerRegistry: FuelEventHandlerRegistry,
    private databaseService: DatabaseService
  ) {}

  async processEvents(): Promise<ProcessingStats>;
  async processEvent(filename: string): Promise<boolean>;
  async retryFailedEvents(): Promise<void>;
  async archiveCompletedEvents(): Promise<void>;
  async getQueueStats(): Promise<QueueStats>;
}
```

### Processing Pipeline
```typescript
class EventProcessor {
  async processEvent(filename: string): Promise<void> {
    const processingPath = await this.moveToProcessing(filename);

    try {
      // 1. Parse FuelEvent from JSON file
      const fuelEvent = await this.parseFuelEvent(processingPath);

      // 2. Find appropriate handler
      const handler = this.handlerRegistry.getHandler(fuelEvent.event_type);
      if (!handler) {
        throw new Error(`No handler for event type: ${fuelEvent.event_type}`);
      }

      // 3. Process event through handler
      const processedData = await handler.processEvent(fuelEvent);

      // 4. Create database records via DatabaseService
      await this.databaseService.createActivityLogWithSpecializedRecord(
        processedData.activityLogParams,
        processedData.specializedRecordParams,
        processedData.specializedTableName
      );

      // 5. Move to completed
      await this.moveToCompleted(processingPath);

    } catch (error) {
      await this.moveToFailed(processingPath, error);
      throw error;
    }
  }
}
```

### File Operations
```typescript
class FileQueueOperations {
  private pendingDir = path.join(os.homedir(), '.fuel/events/pending');
  private processingDir = path.join(os.homedir(), '.fuel/events/processing');
  private completedDir = path.join(os.homedir(), '.fuel/events/completed');
  private failedDir = path.join(os.homedir(), '.fuel/events/failed');

  async moveToProcessing(filename: string): Promise<string>;
  async moveToCompleted(processingPath: string): Promise<void>;
  async moveToFailed(processingPath: string, error: Error): Promise<void>;
  async parseFuelEvent(filepath: string): Promise<FuelEvent>;
  async ensureDirectoryStructure(): Promise<void>;
}
```

## Database Integration

### Enhanced DatabaseService Methods
```typescript
// backend/src/services/DatabaseService.ts - New methods for v0.8
class DatabaseService {
  // Existing methods...

  async createActivityLogWithSpecializedRecord(
    activityLogParams: CreateActivityLogParams,
    specializedParams: any,
    specializedTableName: string
  ): Promise<{ activityLogId: string; specializedRecordId: string }> {
    // Transaction to create both records atomically
    // Links specialized record to activity log via foreign key
  }
}

interface CreateActivityLogParams {
  type: string;
  timestamp: string;
  project_id?: string;
  summary: string;
  details?: string;
  reviewed?: boolean;
}
```

## API Endpoints

```typescript
// backend/src/routes/fuelEvents.ts
GET    /api/fuel-events/queue-status        # Get queue statistics
POST   /api/fuel-events/process             # Manually trigger processing
POST   /api/fuel-events/retry-failed        # Retry failed events
GET    /api/fuel-events/failed              # List failed events with details
DELETE /api/fuel-events/failed/:id          # Remove specific failed event
GET    /api/fuel-events/handlers            # List registered event handlers
```

## Queue Management

### Queue Statistics
```typescript
interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  last_processed_at: string | null;
  processing_rate_per_hour: number;
  supported_event_types: string[];
}
```

### Retry Strategy
```typescript
interface RetryConfig {
  maxAttempts: 3;
  backoffDelayMs: [1000, 5000, 15000];
  retryableErrors: ['ENOENT', 'EACCES', 'TIMEOUT', 'CONNECTION_ERROR'];
}

class RetryProcessor {
  async retryFailedEvent(filename: string): Promise<boolean> {
    const metadata = await this.getFailedEventMetadata(filename);

    if (metadata.retryCount >= this.config.maxAttempts) {
      return false; // Max retries exceeded
    }

    const delay = this.config.backoffDelayMs[metadata.retryCount];
    await this.sleep(delay);

    return await this.processEvent(filename);
  }
}
```

### File System Monitoring
```typescript
import chokidar from 'chokidar';

class EventQueueMonitor {
  startWatching(): void {
    const watcher = chokidar.watch(this.pendingDir, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    watcher.on('add', (filepath) => {
      this.processEvent(path.basename(filepath));
    });
  }
}
```

## Frontend Integration

### Enhanced Sidebar with Events Navigation
```tsx
// frontend/src/components/Sidebar/Sidebar.tsx - Updated with Events section
export const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useAppStore();
  const { queueStats } = useEventQueue();

  return (
    <aside className="sidebar">
      {/* Existing sidebar sections */}
      <div className="filters-section">
        {/* ... existing filter controls ... */}
      </div>

      <div className="repositories-section">
        {/* ... existing repository list ... */}
      </div>

      {/* New Events section at bottom */}
      <div className="events-section">
        <div
          className={`events-nav-item ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => setActiveView('events')}
        >
          <span className="events-label">Events</span>
          {queueStats && (queueStats.pending > 0 || queueStats.failed > 0) && (
            <div className="events-indicators">
              {queueStats.pending > 0 && (
                <span className="pending-indicator">{queueStats.pending}</span>
              )}
              {queueStats.failed > 0 && (
                <span className="failed-indicator">{queueStats.failed}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
```

### MainView Integration
```tsx
// frontend/src/components/MainView/MainView.tsx - Updated to handle Events view
export const MainView: React.FC = () => {
  const { activeView } = useAppStore();

  const renderView = () => {
    switch (activeView) {
      case 'activity-logs':
        return <LogFeed />;
      case 'events':
        return <EventQueueMonitor />;
      default:
        return <LogFeed />;
    }
  };

  return (
    <main className="main-view">
      {renderView()}
    </main>
  );
};
```

### Event Queue Monitor Component
```tsx
// frontend/src/components/MainView/EventQueueMonitor.tsx
export const EventQueueMonitor: React.FC = () => {
  const { queueStats, processEvents, retryFailed, failedEvents, loadFailedEvents } = useEventQueue();

  useEffect(() => {
    if (queueStats?.failed > 0) {
      loadFailedEvents();
    }
  }, [queueStats?.failed]);

  return (
    <div className="event-queue-monitor">
      <div className="monitor-header">
        <h2>Event Queue Monitor</h2>
        <div className="last-updated">
          Last updated: {queueStats?.last_processed_at ?
            new Date(queueStats.last_processed_at).toLocaleTimeString() :
            'Never'
          }
        </div>
      </div>

      {queueStats && (
        <div className="queue-overview">
          <div className="queue-metrics-grid">
            <div className="metric-card pending">
              <div className="metric-value">{queueStats.pending}</div>
              <div className="metric-label">Pending</div>
            </div>
            <div className="metric-card processing">
              <div className="metric-value">{queueStats.processing}</div>
              <div className="metric-label">Processing</div>
            </div>
            <div className="metric-card completed">
              <div className="metric-value">{queueStats.completed}</div>
              <div className="metric-label">Completed</div>
            </div>
            <div className="metric-card failed">
              <div className="metric-value">{queueStats.failed}</div>
              <div className="metric-label">Failed</div>
            </div>
          </div>

          <div className="processing-rate">
            <span className="rate-label">Processing Rate:</span>
            <span className="rate-value">{queueStats.processing_rate_per_hour} events/hour</span>
          </div>

          <div className="queue-actions">
            {queueStats.pending > 0 && (
              <button onClick={processEvents} className="process-btn">
                Process {queueStats.pending} Pending Events
              </button>
            )}
            {queueStats.failed > 0 && (
              <button onClick={retryFailed} className="retry-btn">
                Retry {queueStats.failed} Failed Events
              </button>
            )}
          </div>
        </div>
      )}

      <div className="monitor-sections">
        <div className="supported-handlers-section">
          <h3>Supported Event Types</h3>
          <div className="handlers-grid">
            {queueStats?.supported_event_types.map(type => (
              <div key={type} className="handler-card">
                <div className="event-type">{type}</div>
                <div className="handler-status active">Active</div>
              </div>
            ))}
          </div>
        </div>

        {queueStats?.failed > 0 && failedEvents && (
          <div className="failed-events-section">
            <h3>Failed Events ({queueStats.failed})</h3>
            <div className="failed-events-list">
              {failedEvents.map(event => (
                <div key={event.id} className="failed-event-item">
                  <div className="event-header">
                    <span className="event-type">{event.event_type}</span>
                    <span className="event-time">
                      {new Date(event.failed_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="event-error">
                    <strong>Error:</strong> {event.error.message}
                  </div>
                  <div className="event-retry-info">
                    Retry {event.retry_count}/{3}
                  </div>
                  <div className="event-actions">
                    <button onClick={() => retryFailedEvent(event.id)}>
                      Retry Now
                    </button>
                    <button onClick={() => deleteFailedEvent(event.id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Enhanced useEventQueue Hook
```typescript
// frontend/src/hooks/useEventQueue.ts
export const useEventQueue = () => {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [failedEvents, setFailedEvents] = useState<FailedEvent[] | null>(null);

  const fetchQueueStats = async () => {
    const stats = await api.get<QueueStats>('/api/fuel-events/queue-status');
    setQueueStats(stats);
  };

  const processEvents = async () => {
    await api.post('/api/fuel-events/process');
    await fetchQueueStats();
  };

  const retryFailed = async () => {
    await api.post('/api/fuel-events/retry-failed');
    await fetchQueueStats();
  };

  const loadFailedEvents = async () => {
    const events = await api.get<FailedEvent[]>('/api/fuel-events/failed');
    setFailedEvents(events);
  };

  const retryFailedEvent = async (eventId: string) => {
    await api.post(`/api/fuel-events/retry-failed/${eventId}`);
    await Promise.all([fetchQueueStats(), loadFailedEvents()]);
  };

  const deleteFailedEvent = async (eventId: string) => {
    await api.delete(`/api/fuel-events/failed/${eventId}`);
    await Promise.all([fetchQueueStats(), loadFailedEvents()]);
  };

  useEffect(() => {
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return {
    queueStats,
    failedEvents,
    processEvents,
    retryFailed,
    loadFailedEvents,
    retryFailedEvent,
    deleteFailedEvent
  };
};
```

### App Store Update
```typescript
// frontend/src/stores/appStore.ts - Updated with Events view
interface AppState {
  activeView: 'activity-logs' | 'events';
  setActiveView: (view: 'activity-logs' | 'events') => void;
  // ... existing state
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'activity-logs',
  setActiveView: (view) => set({ activeView: view }),
  // ... existing implementation
}));
```

## Configuration

### Environment Variables
```bash
# Event Queue Configuration
FUEL_EVENTS_DIR=~/.fuel/events
EVENT_PROCESSING_INTERVAL=5000     # ms between processing cycles
MAX_RETRY_ATTEMPTS=3
ARCHIVE_RETENTION_DAYS=30
ENABLE_FILE_WATCHING=true

# Processing Performance
MAX_BATCH_SIZE=50
PROCESSING_TIMEOUT=30000           # ms timeout per event
MAX_CONCURRENT_PROCESSING=5

# Cleanup Configuration
CLEANUP_INTERVAL_HOURS=24
MAX_ARCHIVE_SIZE_MB=100
```

### Queue Metadata File
```json
// ~/.fuel/events/.metadata
{
  "version": "1.0",
  "created_at": "2024-01-15T10:30:00Z",
  "last_cleanup_at": "2024-01-15T09:00:00Z",
  "config": {
    "max_retry_attempts": 3,
    "archive_after_days": 30,
    "max_archive_size_mb": 100,
    "cleanup_interval_hours": 24
  },
  "stats": {
    "total_processed": 1234,
    "total_failed": 5,
    "last_24h_processed": 45,
    "registered_handlers": ["commit", "claude_session_end", "branch_checkout"]
  }
}
```

## Error Handling

### Event Validation
```typescript
class FuelEventValidator {
  validateFuelEvent(data: unknown): FuelEvent {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid FuelEvent: not an object');
    }

    const event = data as any;

    if (!event.event_id || !event.event_type || !event.timestamp) {
      throw new ValidationError('Missing required FuelEvent fields');
    }

    // Additional validation logic
    return event as FuelEvent;
  }
}
```

### Failed Event Metadata
```typescript
interface FailedEvent {
  id: string;
  original_filename: string;
  event_type: string;
  failed_at: string;
  retry_count: number;
  last_retry_at?: string;
  error: {
    type: string;
    message: string;
    stack?: string;
  };
  handler_used: string;
}
```

## Testing with Mock Event Generator

### Comprehensive Mock Event Generator
```typescript
// backend/tests/unit/MockEventGenerator.ts
class MockEventGenerator {
  private eventsDir = path.join(os.homedir(), '.fuel/events/pending');

  async generateMockEvents(config: MockGenerationConfig): Promise<GeneratedEventSummary> {
    const events: FuelEvent[] = [];

    // Generate different event types based on config
    if (config.gitCommits > 0) {
      events.push(...this.generateGitCommitEvents(config.gitCommits));
    }
    if (config.claudeSessions > 0) {
      events.push(...this.generateClaudeSessionEvents(config.claudeSessions));
    }
    if (config.branchCheckouts > 0) {
      events.push(...this.generateBranchCheckoutEvents(config.branchCheckouts));
    }
    if (config.customEvents?.length > 0) {
      events.push(...this.generateCustomEvents(config.customEvents));
    }

    // Write events with optional delays/concurrency simulation
    await this.writeEventsToQueue(events, config.writePattern);

    return {
      totalGenerated: events.length,
      eventTypes: this.summarizeEventTypes(events),
      timeRange: this.getTimeRange(events)
    };
  }

  // Error injection capabilities for testing
  async generateCorruptedEvents(config: CorruptionConfig): Promise<void> {
    const corruptionTypes = [
      'malformed_json',
      'missing_required_fields',
      'invalid_timestamps',
      'null_values',
      'oversized_data'
    ];

    for (const corruptionType of corruptionTypes) {
      if (config[corruptionType] > 0) {
        await this.generateSpecificCorruption(corruptionType, config[corruptionType]);
      }
    }
  }

  // Concurrency simulation for stress testing
  private async writeEventsToQueue(events: FuelEvent[], pattern: WritePattern): Promise<void> {
    switch (pattern.type) {
      case 'sequential':
        await this.writeSequentially(events, pattern.delayMs || 0);
        break;
      case 'concurrent':
        await this.writeConcurrently(events, pattern.batchSize || 10);
        break;
      case 'burst':
        await this.writeBursts(events, pattern.burstSize || 5, pattern.burstDelayMs || 1000);
        break;
      case 'random':
        await this.writeRandomly(events, pattern.minDelayMs || 10, pattern.maxDelayMs || 1000);
        break;
    }
  }
}

interface MockGenerationConfig {
  gitCommits: number;
  claudeSessions: number;
  branchCheckouts: number;
  customEvents?: CustomEventConfig[];
  writePattern: WritePattern;
}

interface WritePattern {
  type: 'sequential' | 'concurrent' | 'burst' | 'random';
  delayMs?: number;
  batchSize?: number;
  burstSize?: number;
  burstDelayMs?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
}

interface CorruptionConfig {
  malformed_json: number;
  missing_required_fields: number;
  invalid_timestamps: number;
  null_values: number;
  oversized_data: number;
}
```

### CLI Interface for Testing
```typescript
// backend/src/cli/mockEventGenerator.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('fuel-mock-events')
  .description('Generate mock FuelEvents for testing')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate mock events')
  .option('-c, --commits <number>', 'number of git commit events', '10')
  .option('-s, --sessions <number>', 'number of Claude session events', '5')
  .option('-b, --branches <number>', 'number of branch checkout events', '3')
  .option('-p, --pattern <type>', 'write pattern (sequential|concurrent|burst|random)', 'sequential')
  .action(async (options) => {
    const generator = new MockEventGenerator();

    const config: MockGenerationConfig = {
      gitCommits: parseInt(options.commits),
      claudeSessions: parseInt(options.sessions),
      branchCheckouts: parseInt(options.branches),
      writePattern: { type: options.pattern }
    };

    const summary = await generator.generateMockEvents(config);
    console.log('Generated events:', summary);
  });

program
  .command('stress-test')
  .description('Run stress test scenarios')
  .option('--concurrent-burst', 'simulate concurrent burst writes')
  .option('--high-volume', 'generate high volume of events')
  .action(async (options) => {
    const generator = new MockEventGenerator();

    if (options.concurrentBurst) {
      await generator.generateMockEvents({
        gitCommits: 100,
        claudeSessions: 50,
        branchCheckouts: 25,
        writePattern: { type: 'burst', burstSize: 20, burstDelayMs: 100 }
      });
    }

    if (options.highVolume) {
      await generator.generateMockEvents({
        gitCommits: 1000,
        claudeSessions: 200,
        branchCheckouts: 100,
        writePattern: { type: 'concurrent', batchSize: 50 }
      });
    }
  });

program.parse();
```

### E2E Testing Strategies

**1. Handler Stub Testing**
```typescript
// Test handlers that verify processing pipeline without real app integrations
class TestEventHandler implements FuelEventHandler {
  eventType = 'test_event';
  appSource = 'test';

  async processEvent(fuelEvent: FuelEvent): Promise<ProcessedEventData> {
    return {
      activityLogParams: {
        type: 'test',
        timestamp: fuelEvent.timestamp,
        summary: `Test event: ${fuelEvent.event_id}`,
        details: JSON.stringify(fuelEvent.data)
      },
      specializedRecordParams: {
        test_field: fuelEvent.data.test_value,
        event_source: fuelEvent.app_source
      },
      specializedTableName: 'test_events'
    };
  }
}
```

**2. Database Verification Tests**
```typescript
// Verify proper activity_logs and specialized records creation
describe('Event Processing Integration', () => {
  it('should create activity log and specialized record', async () => {
    // Generate test event
    await mockGenerator.generateMockEvents({
      customEvents: [{
        eventType: 'test_event',
        appSource: 'test',
        count: 1,
        staticData: { test_value: 'integration_test' }
      }],
      writePattern: { type: 'sequential' }
    });

    // Process events
    await eventQueueService.processEvents();

    // Verify database records
    const activityLogs = await db.query('SELECT * FROM activity_logs WHERE type = ?', ['test']);
    const specializedRecords = await db.query('SELECT * FROM test_events');

    expect(activityLogs).toHaveLength(1);
    expect(specializedRecords).toHaveLength(1);
    expect(specializedRecords[0].activity_id).toBe(activityLogs[0].id);
  });
});
```

**3. Concurrency and Recovery Testing**
```typescript
// Test concurrent event writing and recovery scenarios
describe('Event Queue Reliability', () => {
  it('should handle concurrent event writes', async () => {
    await mockGenerator.generateMockEvents({
      gitCommits: 50,
      writePattern: { type: 'concurrent', batchSize: 10 }
    });

    const stats = await eventQueueService.getQueueStats();
    expect(stats.pending).toBe(50);
    expect(stats.failed).toBe(0);
  });

  it('should recover from processing failures', async () => {
    // Generate corrupted events
    await mockGenerator.generateCorruptedEvents({
      malformed_json: 3,
      missing_required_fields: 2
    });

    await eventQueueService.processEvents();

    const stats = await eventQueueService.getQueueStats();
    expect(stats.failed).toBe(5);
    expect(stats.processing).toBe(0); // No events stuck in processing
  });
});
```

## Future Extensibility

### Plugin Architecture
```typescript
// Future: Plugin system for dynamically loading handlers
interface FuelEventPlugin {
  name: string;
  version: string;
  handlers: FuelEventHandler[];
  install(): Promise<void>;
  uninstall(): Promise<void>;
}

class PluginManager {
  loadPlugin(pluginPath: string): Promise<FuelEventPlugin>;
  installPlugin(plugin: FuelEventPlugin): Promise<void>;
  listInstalledPlugins(): FuelEventPlugin[];
}
```

### Network Event Collection
For future scaling, the directory-based queue provides migration paths:
- **Remote Event Sync**: Other machines rsync events to central Fuel instance
- **Multi-Instance Processing**: Multiple Fuel instances can process shared directory
- **Redis Migration**: Directory structure maps to Redis streams for network deployment

## Success Criteria for v0.8

### Functional Success
- Event queue reliably captures events whether Fuel is running or not
- Handler system successfully processes different event types
- No event loss during concurrent operations or system crashes
- Failed events can be inspected, retried, or manually resolved
- Queue processing keeps up with expected development workload

### Technical Success
- Atomic file operations prevent corruption during concurrent writes
- Handler registry allows dynamic event type support
- Database integration creates proper activity log and specialized records
- File system monitoring provides efficient event processing
- Error handling isolates failures without affecting other events

### Extensibility Success
- New app integrations can easily add their own event handlers
- Queue system remains app-agnostic and doesn't require changes for new event types
- Clean separation between queue management and event processing logic
- Foundation ready for future scaling and plugin architecture

### Testing Success
- Mock event generator enables comprehensive testing without real integrations
- E2E tests verify complete processing pipeline from file to database
- Stress testing confirms system handles expected concurrent workloads
- Error injection tests validate recovery and retry mechanisms
- Frontend monitoring provides clear visibility into queue health and issues

This FuelEvents system provides a robust, extensible foundation for capturing and processing events from any integrated application while maintaining reliability and performance. The comprehensive testing strategy ensures the system works correctly before any real app integrations are implemented.

