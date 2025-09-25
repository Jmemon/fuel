-- Connected Local Git Repositories
CREATE TABLE connected_local_git_repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    local_repo_path TEXT NOT NULL UNIQUE,
    remote_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs (Central logging table)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('manual', 'git_commit', 'claude_code', 'git_checkout', 'git_hook_install')),
    reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Manual Logs
CREATE TABLE manual_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activity_logs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Git Commits
CREATE TABLE git_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activity_logs(id) ON DELETE CASCADE,
    repo_id UUID NOT NULL REFERENCES connected_local_git_repos(id) ON DELETE CASCADE,
    commit_hash VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    committed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    files_changed TEXT[],
    metadata JSONB,
    UNIQUE(commit_hash, repo_id)
);

-- Claude Code Conversations
CREATE TABLE claude_code_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activity_logs(id) ON DELETE CASCADE,
    project_directory_name VARCHAR(255),
    conversation_file_path TEXT NOT NULL,
    raw_jsonl TEXT,
    parsed_content JSONB,
    bullet_points TEXT[],
    num_exchanges INTEGER DEFAULT 0,
    num_tool_usages INTEGER DEFAULT 0,
    num_tokens INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Git Checkouts
CREATE TABLE git_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activity_logs(id) ON DELETE CASCADE,
    repo_id UUID NOT NULL REFERENCES connected_local_git_repos(id) ON DELETE CASCADE,
    timestamp VARCHAR(255) NOT NULL,
    prev_head VARCHAR(40) NOT NULL,
    new_head VARCHAR(40) NOT NULL,
    prev_branch VARCHAR(255) NOT NULL,
    new_branch VARCHAR(255) NOT NULL,
    repo_path TEXT NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Git Hooks Installed
CREATE TABLE git_hooks_installed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activity_logs(id) ON DELETE CASCADE,
    repo_id UUID NOT NULL REFERENCES connected_local_git_repos(id) ON DELETE CASCADE,
    hook_type VARCHAR(50) NOT NULL,
    hook_script_path TEXT,
    installation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    repo_path TEXT NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);