# Fuel v0.3 - Database Design Document

## Project Overview

**Project Name:** Fuel v0.3 - Database Foundation
**Purpose:** Database schema and data structures for personal development activity log system

## Database Schema

### Tables

#### `connected_local_git_repos`
```sql
CREATE TABLE connected_local_git_repos (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    local_repo_path VARCHAR(500) NOT NULL,
    remote_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `activity_logs`
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- "git_commit" | "claude_code" | "manual" | "git_checkout" | "git_hook_install"
    reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    INDEX (created_at),
    INDEX (reviewed),
    INDEX (type)
);
```

#### `manual_logs`
```sql
CREATE TABLE manual_logs (
    id UUID PRIMARY KEY,
    activity_id UUID REFERENCES activity_logs(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX (activity_id),
    INDEX (created_at)
);
```

#### `git_commits`
```sql
CREATE TABLE git_commits (
    id UUID PRIMARY KEY,
    activity_id UUID REFERENCES activity_logs(id),
    repo_id UUID REFERENCES connected_local_git_repos(id), -- Local git repository reference
    commit_hash VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    committed_at TIMESTAMP NOT NULL,
    files_changed JSONB, -- array of file paths
    metadata JSONB,
    UNIQUE(commit_hash, repo_id),
    INDEX (activity_id),
    INDEX (committed_at),
    INDEX (author_email)
);
```

#### `claude_code_conversations`
```sql
CREATE TABLE claude_code_conversations (
    id UUID PRIMARY KEY,
    activity_id UUID REFERENCES activity_logs(id),
    project_directory_name VARCHAR(255), -- name of the dir CC was opened in
    conversation_file_path VARCHAR(500) NOT NULL, -- path to original jsonl file
    raw_jsonl TEXT, -- backup of raw conversation data
    parsed_content JSONB, -- structured conversation data
    bullet_points TEXT[], -- extracted key points
    num_exchanges INTEGER DEFAULT 0,
    num_tool_usages INTEGER DEFAULT 0,
    num_tokens INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB,
    INDEX (activity_id),
    INDEX (started_at),
    INDEX (project_directory_name)
);
```

#### `git_checkouts`
```sql
CREATE TABLE git_checkouts (
    id UUID PRIMARY KEY,
    activity_id UUID REFERENCES activity_logs(id),
    repo_id UUID REFERENCES connected_local_git_repos(id),
    timestamp TEXT NOT NULL, -- ISO 8601 format timestamp from git hook
    prev_head VARCHAR(255) NOT NULL, -- Previous commit hash
    new_head VARCHAR(255) NOT NULL, -- New commit hash
    prev_branch VARCHAR(255) NOT NULL, -- Previous branch name or 'unknown'
    new_branch VARCHAR(255) NOT NULL, -- New branch name or 'unknown'
    repo_path VARCHAR(500) NOT NULL, -- Full path to repository root
    repo_name VARCHAR(255) NOT NULL, -- Repository name (basename of repo_path)
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX (activity_id),
    INDEX (repo_id),
    INDEX (timestamp),
    INDEX (new_branch),
    UNIQUE(timestamp, repo_id) -- Prevent duplicate checkout events
);
```

#### `git_hooks_installed`
```sql
CREATE TABLE git_hooks_installed (
    id UUID PRIMARY KEY,
    activity_id UUID REFERENCES activity_logs(id),
    repo_id UUID REFERENCES connected_local_git_repos(id),
    hook_type VARCHAR(50) NOT NULL, -- "post-checkout" | "pre-commit" | "post-commit" | etc.
    hook_script_path VARCHAR(500), -- Path to the installed hook script
    installation_timestamp TIMESTAMP NOT NULL, -- When the hook was installed
    repo_path VARCHAR(500) NOT NULL, -- Full path to repository root
    repo_name VARCHAR(255) NOT NULL, -- Repository name (basename of repo_path)
    metadata JSONB, -- Additional hook configuration or details
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX (activity_id),
    INDEX (repo_id),
    INDEX (hook_type),
    INDEX (installation_timestamp),
    UNIQUE(hook_type, repo_id) -- One hook of each type per repo
);
```

## Database Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_reviewed ON activity_logs(reviewed);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_unreviewed_recent ON activity_logs(created_at DESC) WHERE reviewed = false;

-- Manual logs table indexes
CREATE INDEX idx_manual_logs_activity_id ON manual_logs(activity_id);
CREATE INDEX idx_manual_logs_created_at ON manual_logs(created_at);

-- Git commits table indexes
CREATE INDEX idx_git_commits_activity_id ON git_commits(activity_id);
CREATE INDEX idx_git_commits_committed_at ON git_commits(committed_at);
CREATE INDEX idx_git_commits_repo_id ON git_commits(repo_id);

-- Claude Code conversations table indexes
CREATE INDEX idx_conversations_activity_id ON claude_code_conversations(activity_id);
CREATE INDEX idx_conversations_started_at ON claude_code_conversations(started_at);
CREATE INDEX idx_conversations_project_dir ON claude_code_conversations(project_directory_name);

-- Git checkouts table indexes
CREATE INDEX idx_git_checkouts_activity_id ON git_checkouts(activity_id);
CREATE INDEX idx_git_checkouts_repo_id ON git_checkouts(repo_id);
CREATE INDEX idx_git_checkouts_timestamp ON git_checkouts(timestamp);
CREATE INDEX idx_git_checkouts_new_branch ON git_checkouts(new_branch);

-- Git hooks installed table indexes
CREATE INDEX idx_git_hooks_activity_id ON git_hooks_installed(activity_id);
CREATE INDEX idx_git_hooks_repo_id ON git_hooks_installed(repo_id);
CREATE INDEX idx_git_hooks_hook_type ON git_hooks_installed(hook_type);
CREATE INDEX idx_git_hooks_installation_timestamp ON git_hooks_installed(installation_timestamp);
```