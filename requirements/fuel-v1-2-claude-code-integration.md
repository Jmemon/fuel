# Fuel v1.2 - Claude Code Conversation Integration

**Base Version:** v1.0 (see fuel_v1_0.md)
**Purpose:** Add Claude Code conversation monitoring and integration to capture development conversations alongside git activity
**Timeline:** Version 1.2 upgrade from v1.0

## New Features in v1.2

### 1. Claude Code Conversation Monitoring (New)
- Conversation logs for each project stored in ~/.claude/projects/<name-of-dir-cc-opened-in>
- In each project dir you have every conversation that occurred for that project in jsonl files. Unsure of format currently.
- Store raw jsonl files (copy them over as these get deleted after 30 days), parsed and formatted versions of conversations, and extracted bulletpoints of conversations, and stats (num exchanges, num tool usages, num tokens)
- Automatic activity log creation from Claude Code conversations

### 2. Conversation Processing and Analysis (New)
- Parse JSONL conversation files into structured data
- Extract key conversation bulletpoints using AI summarization
- Calculate conversation statistics (exchanges, tool usage, token counts)
- Link conversations to projects based on directory names

## API Changes from v1.0

### New Claude Code Endpoints

**Scan for New Conversations**
- `POST /api/claude-code/scan`
- Headers: `Authorization: Bearer <access_token>`
- Body: `{ directory_path?: string }` (defaults to ~/.claude/projects)
- Response: `{ success: boolean, conversations_found: number, new_conversations: number }`

**Import Conversation File**
- `POST /api/claude-code/import`
- Headers: `Authorization: Bearer <access_token>`
- Body: `{ file_path: string, project_directory_name: string, session_id?: string, trigger_source?: "session_end_hook" | "manual_scan" }`
- Response: `{ success: boolean, conversation_id: UUID, activity_id: UUID }`

**Real-time Session Update (New - Hook Integration)**
- `POST /api/claude-code/session-update`
- Headers: `Authorization: Bearer <access_token>`
- Body: `{ session_id: string, project_directory_name: string, prompt_length: number, timestamp: string }`
- Response: `{ success: boolean, active_session_id: UUID }`

**List Conversations by Project**
- `GET /api/claude-code/conversations`
- Headers: `Authorization: Bearer <access_token>`
- Query Params: `project_directory_name?: string, date_from?: string, date_to?: string`
- Response: `{ conversations: Array<ConversationSummary> }`

**Get Conversation Details**
- `GET /api/claude-code/conversations/:id`
- Headers: `Authorization: Bearer <access_token>`
- Response: `{ conversation: ConversationDetails }`

**Regenerate Conversation Summary**
- `POST /api/claude-code/conversations/:id/regenerate-summary`
- Headers: `Authorization: Bearer <access_token>`
- Response: `{ success: boolean, bullet_points: string[] }`

## User Interface Changes from v1.0

### New Claude Code Integration UI

**Conversation Import Section**
- **Scan Conversations** button in settings/sidebar
- **Import Status** showing last scan time and new conversations found
- **Conversation Directory** configuration (defaults to ~/.claude/projects)
- **Auto-scan Toggle** for automatic periodic scanning

### Enhanced Activity Log Display

**Conversation Entry Format**
```
Date
  • [Time] [Claude Code] Project: project-name - Conversation summary bullet points
    - Key discussion point 1
    - Key discussion point 2
    - Tool usage: 15 tools, 1,234 tokens, 45 minutes
```

**Conversation Detail View**
- Click on Claude Code entries to expand full conversation details
- Show parsed conversation with proper formatting
- Display tool usage statistics and timeline
- Link to original JSONL file location

## Claude Code Integration Specification

### Claude Code Hooks Integration (Primary Method)

Fuel v1.2 leverages Claude Code hooks for real-time conversation monitoring, eliminating the need for periodic scanning and ensuring no conversations are lost due to the 30-day deletion policy.

#### Required Hook Configuration

Users must configure Claude Code hooks in their settings files (`~/.claude/settings.json` or project-specific `.claude/settings.json`):

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.fuel/hooks/session-end-hook.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.fuel/hooks/prompt-submit-hook.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

#### SessionEnd Hook Implementation

**Primary hook for conversation processing** - Automatically triggered when Claude Code session ends:

**Hook Script**: `~/.fuel/hooks/session-end-hook.sh`
```bash
#!/bin/bash
# SessionEnd Hook for Fuel v1.2 Conversation Processing

# Read JSON input from stdin
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path')
CWD=$(echo "$INPUT" | jq -r '.cwd')
REASON=$(echo "$INPUT" | jq -r '.reason')

# Skip if session ended due to error or other non-completion reasons
if [[ "$REASON" != "clear" && "$REASON" != "other" ]]; then
    exit 0
fi

# Extract project directory name from current working directory
PROJECT_DIR=$(basename "$CWD")

# Create backup copy of JSONL file before it's deleted
BACKUP_DIR="$HOME/.fuel/conversation-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)_${SESSION_ID:0:8}_${PROJECT_DIR}.jsonl"
cp "$TRANSCRIPT_PATH" "$BACKUP_FILE"

# Import conversation into Fuel
curl -X POST "${FUEL_API_URL:-http://localhost:3000}/api/claude-code/import" \
  -H "Authorization: Bearer $FUEL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"file_path\": \"$BACKUP_FILE\",
    \"project_directory_name\": \"$PROJECT_DIR\",
    \"session_id\": \"$SESSION_ID\",
    \"trigger_source\": \"session_end_hook\"
  }" \
  --silent --show-error

exit 0
```

#### UserPromptSubmit Hook Implementation

**Secondary hook for real-time tracking** - Provides live session monitoring:

**Hook Script**: `~/.fuel/hooks/prompt-submit-hook.sh`
```bash
#!/bin/bash
# UserPromptSubmit Hook for Fuel v1.2 Real-time Tracking

# Read JSON input from stdin
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
PROMPT=$(echo "$INPUT" | jq -r '.prompt')
CWD=$(echo "$INPUT" | jq -r '.cwd')

PROJECT_DIR=$(basename "$CWD")
PROMPT_LENGTH=${#PROMPT}

# Send real-time session update to Fuel
curl -X POST "${FUEL_API_URL:-http://localhost:3000}/api/claude-code/session-update" \
  -H "Authorization: Bearer $FUEL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"project_directory_name\": \"$PROJECT_DIR\",
    \"prompt_length\": $PROMPT_LENGTH,
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" \
  --silent --show-error

# Add current context information for Claude
echo "Project: $PROJECT_DIR | Session: ${SESSION_ID:0:8} | Time: $(date '+%H:%M')"
exit 0
```

### Conversation File Discovery Process (Fallback Method)

#### Step 1: Directory Scanning
1. System scans ~/.claude/projects/ directory structure
2. Identifies project directories (each represents a different project)
3. Within each project directory, finds all .jsonl conversation files
4. Tracks file modification times to identify new conversations

#### Step 2: File Processing Pipeline
1. **File Validation**: Verify JSONL format and structure
2. **Conversation Parsing**: Extract messages, timestamps, tool usage
3. **Metadata Extraction**: Calculate statistics (exchanges, tokens, tools)
4. **Summary Generation**: Create bullet point summaries using AI
5. **Database Storage**: Store raw and processed conversation data

#### Step 3: Activity Log Integration
1. Create activity_logs entry with type "claude_code"
2. Create corresponding claude_code_conversations entry
3. Link conversation to project based on directory name
4. Set conversation start/end times from JSONL timestamps

### Conversation File Format Handling

**Expected JSONL Structure** (to be confirmed):
```jsonl
{"type": "message", "role": "user", "content": "...", "timestamp": "2024-01-15T10:30:00Z"}
{"type": "message", "role": "assistant", "content": "...", "timestamp": "2024-01-15T10:30:15Z"}
{"type": "tool_use", "name": "read_file", "parameters": {...}, "timestamp": "2024-01-15T10:30:16Z"}
{"type": "tool_result", "tool_use_id": "...", "content": "...", "timestamp": "2024-01-15T10:30:17Z"}
```

**Processing Logic**:
- Count total exchanges (user + assistant message pairs)
- Count tool usage events
- Estimate total tokens (or extract if provided)
- Identify conversation start/end times
- Extract key topics and decisions for bullet points

### AI-Powered Conversation Summarization

**Summary Generation Process**:
1. Extract conversation content from JSONL
2. Send to AI summarization service (OpenAI/Anthropic)
3. Generate 3-5 key bullet points covering:
   - Main topics discussed
   - Key decisions made
   - Files/components modified
   - Tools heavily used
4. Store bullet points in database for quick display

**Prompt Template**:
```
Analyze this Claude Code conversation and extract 3-5 key bullet points that summarize:
1. What was the main goal or task being worked on?
2. What key decisions or solutions were implemented?
3. What files, components, or systems were modified?
4. Any notable tools or techniques used?

Conversation: [JSONL_CONTENT]

Format as concise bullet points suitable for a development log.
```

### Conversation-Project Linking

**Directory-Based Project Detection**:
- Use directory name from ~/.claude/projects/<project-name> as project identifier
- Match against existing connected_projects.name or create new project entries
- Handle cases where Claude Code project doesn't match git repository

**Project Matching Logic**:
1. Exact match: project directory name matches connected_projects.name
2. Fuzzy match: find closest match in existing projects
3. New project: create new connected_projects entry for unmatched directories
4. Manual linking: UI to associate Claude Code projects with git repositories

## Data Flow Changes from v1.0

### Hook-Based Real-time Flow (Primary)
1. **Session Start**: UserPromptSubmit hook tracks active sessions
   - Creates preliminary session tracking entry
   - Links session to project directory
   - Provides real-time session monitoring in Fuel UI

2. **Session End**: SessionEnd hook triggers automatic processing
   - Receives transcript_path from Claude Code
   - Immediately backs up JSONL file to ~/.fuel/conversation-backups/
   - Calls Fuel API to import conversation with session metadata
   - Processing happens immediately, no polling required

3. **Conversation Processing**: Fuel processes conversation immediately
   - Parse and validate JSONL content from backup file
   - Extract conversation metadata and statistics
   - Generate AI summary bullet points
   - Create activity_logs entry with type "claude_code"
   - Store conversation data in claude_code_conversations table
   - New conversations appear instantly in unreviewed activity feed

### Legacy Scan-Based Flow (Fallback)
1. User triggers conversation scan (manual or automatic)
2. System scans ~/.claude/projects/ for new/modified JSONL files
3. For each new conversation file:
   - Parse and validate JSONL content
   - Extract conversation metadata and statistics
   - Generate AI summary bullet points
   - Create activity_logs entry with type "claude_code"
   - Store conversation data in claude_code_conversations table
4. New conversations appear in unreviewed activity feed

### Enhanced User Review Flow
1. User opens application (existing flow)
2. System fetches unreviewed logs including Claude Code conversations
3. Activity feed shows chronological mix of commits and conversations
4. User can expand Claude Code entries to see conversation details
5. Conversations marked as reviewed when viewed

## Technical Architecture Changes from v1.0

### New Backend Services

#### Conversation Processing Service (New)
- **Technology**: Node.js background service or queue-based processing
- **Responsibilities**:
  - File system monitoring of ~/.claude/projects/
  - JSONL parsing and validation
  - Conversation statistics calculation
  - AI-powered summarization integration
  - Database storage of processed conversations

#### AI Summarization Service (New)
- **Technology**: Integration with OpenAI/Anthropic APIs
- **Responsibilities**:
  - Generate conversation bullet point summaries
  - Extract key topics and decisions from conversations
  - Handle rate limiting and API error handling
  - Cache summarization results

### Enhanced Core API Service
**New responsibilities added to v1.0**:
- Claude Code conversation management endpoints
- File system interaction for conversation discovery
- Integration with AI summarization service
- Conversation-project linking logic

## Security Requirements for v1.2

### File System Security
- Restrict file access to ~/.claude/projects/ directory only
- Validate all file paths to prevent directory traversal
- Handle file permissions and access errors gracefully
- No modification of original JSONL files (read-only access)

### AI Service Security
- Secure API key storage for summarization services
- Rate limiting for AI API calls
- No transmission of sensitive code/data in summaries
- Sanitize conversation content before summarization

## Performance Requirements for v1.2

### Conversation Processing
- File scanning: Complete directory scan within 10 seconds
- JSONL parsing: Process conversation files within 5 seconds each
- AI summarization: Generate summaries within 30 seconds per conversation
- Database storage: Conversation import within 2 seconds

### UI Responsiveness
- Conversation list loading: <1 second for 100 conversations
- Conversation detail view: <500ms to expand/collapse
- Activity feed with mixed content: <2 seconds for 50 entries

## Testing Requirements for v1.2

### Conversation Processing Testing
- JSONL parsing with various conversation formats and edge cases
- File system scanning with different directory structures
- AI summarization integration and error handling
- Database storage and retrieval of conversation data

### Integration Testing
- End-to-end conversation import to activity log display
- Mixed activity feed with commits and conversations
- Project linking between Claude Code directories and git repositories
- Performance testing with large conversation files

## Additional Configuration for v1.2

### Hook Installation and Setup

#### Automatic Hook Installation Script
Fuel v1.2 includes an automated hook installation script that users can run:

```bash
# Install Fuel hooks for Claude Code integration
curl -sSL https://fuel.example.com/install-hooks.sh | bash

# Or download and inspect first:
curl -O https://fuel.example.com/install-hooks.sh
chmod +x install-hooks.sh && ./install-hooks.sh
```

**Installation Script Actions**:
1. Creates `~/.fuel/hooks/` directory structure
2. Installs `session-end-hook.sh` and `prompt-submit-hook.sh` scripts
3. Makes scripts executable (`chmod +x`)
4. Backs up existing Claude Code settings
5. Updates `~/.claude/settings.json` with hook configuration
6. Sets up required environment variables in shell profile

#### Manual Hook Installation
For users who prefer manual setup:

1. **Create hook directory**:
   ```bash
   mkdir -p ~/.fuel/hooks
   ```

2. **Download hook scripts** (provided by Fuel installation):
   ```bash
   # Scripts provided in previous sections of this spec
   # session-end-hook.sh and prompt-submit-hook.sh
   ```

3. **Make scripts executable**:
   ```bash
   chmod +x ~/.fuel/hooks/*.sh
   ```

4. **Update Claude Code settings**:
   Edit `~/.claude/settings.json` to add hooks configuration (see earlier sections)

5. **Set environment variables**:
   Add to `~/.bashrc`, `~/.zshrc`, or equivalent:
   ```bash
   export FUEL_ACCESS_TOKEN="your-fuel-access-token"
   export FUEL_API_URL="http://localhost:3000"  # or your Fuel server URL
   ```

#### Hook Configuration Validation
Fuel v1.2 includes a validation endpoint to test hook setup:

```bash
# Test hook configuration
curl -X POST "$FUEL_API_URL/api/claude-code/validate-hooks" \
  -H "Authorization: Bearer $FUEL_ACCESS_TOKEN"
```

Response indicates:
- Whether hooks are properly configured in Claude Code settings
- Hook script file permissions and accessibility
- API connectivity from hook scripts
- Environment variable setup

### New Environment Variables
```
# Claude Code Integration (Legacy Scanning)
CLAUDE_PROJECTS_PATH=~/.claude/projects
CONVERSATION_SCAN_INTERVAL=3600  # seconds (1 hour)
ENABLE_AUTO_SCAN=true

# Hook Integration (Primary Method)
FUEL_ACCESS_TOKEN=your-fuel-access-token
FUEL_API_URL=http://localhost:3000
FUEL_HOOK_TIMEOUT=30  # seconds for SessionEnd hook
FUEL_HOOK_TIMEOUT_PROMPT=5  # seconds for UserPromptSubmit hook

# AI Summarization Service
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
SUMMARIZATION_PROVIDER=openai  # or anthropic
MAX_SUMMARY_TOKENS=150

# File Processing
MAX_CONVERSATION_SIZE_MB=50
CONVERSATION_RETENTION_DAYS=90  # how long to keep raw JSONL backups
```

### New Database Indexes
```sql
-- Enhanced indexes for Claude Code conversations
CREATE INDEX idx_conversations_project_started ON claude_code_conversations(project_directory_name, started_at DESC);
CREATE INDEX idx_conversations_file_path ON claude_code_conversations(conversation_file_path);
CREATE INDEX idx_conversations_num_exchanges ON claude_code_conversations(num_exchanges DESC);
```

## v1.2 Success Criteria (Additional to v1.0)

### Functional Success
- Successfully discovers and imports Claude Code conversations
- Generates meaningful bullet point summaries for conversations
- Integrates conversations into chronological activity feed
- Links conversations to appropriate projects

### Technical Success
- Reliable file system monitoring and processing
- Stable AI summarization integration with error handling
- Efficient conversation data storage and retrieval
- Clean integration ready for future conversation analysis features

### User Experience Success
- Clear visual distinction between commits and conversations in activity feed
- Intuitive conversation detail expansion and navigation
- Fast loading of conversation summaries and details
- Seamless integration with existing review workflow

## Sample API Responses

```json
// GET /api/claude-code/conversations
{
  "conversations": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "activity_id": "456e7890-e89b-12d3-a456-426614174000",
      "project_directory_name": "my-react-app",
      "bullet_points": [
        "Implemented user authentication with JWT tokens",
        "Added protected routes and login/logout functionality",
        "Modified UserContext and AuthProvider components",
        "Used React Router for navigation protection"
      ],
      "num_exchanges": 12,
      "num_tool_usages": 8,
      "num_tokens": 2500,
      "started_at": "2024-01-15T10:30:00Z",
      "ended_at": "2024-01-15T11:45:00Z"
    }
  ]
}

// GET /api/claude-code/conversations/:id
{
  "conversation": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "raw_jsonl": "[{\"type\":\"message\",\"role\":\"user\",...}]",
    "parsed_content": {
      "messages": [...],
      "tool_uses": [...],
      "summary_stats": {...}
    },
    "bullet_points": [...],
    "metadata": {
      "total_duration_minutes": 75,
      "primary_files_modified": ["src/auth.js", "src/components/Login.jsx"],
      "tools_used": ["edit", "read", "bash"]
    }
  }
}
```
