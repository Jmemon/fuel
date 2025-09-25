-- Performance indexes for common query patterns
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_reviewed ON activity_logs(reviewed);
CREATE INDEX idx_activity_logs_type_reviewed ON activity_logs(type, reviewed);

CREATE INDEX idx_manual_logs_activity_id ON manual_logs(activity_id);
CREATE INDEX idx_git_commits_activity_id ON git_commits(activity_id);
CREATE INDEX idx_git_commits_repo_id ON git_commits(repo_id);
CREATE INDEX idx_git_commits_hash ON git_commits(commit_hash);

CREATE INDEX idx_claude_conversations_activity_id ON claude_code_conversations(activity_id);
CREATE INDEX idx_git_checkouts_activity_id ON git_checkouts(activity_id);
CREATE INDEX idx_git_checkouts_repo_id ON git_checkouts(repo_id);

CREATE INDEX idx_git_hooks_activity_id ON git_hooks_installed(activity_id);
CREATE INDEX idx_git_hooks_repo_id ON git_hooks_installed(repo_id);

CREATE INDEX idx_connected_repos_active ON connected_local_git_repos(is_active);
CREATE INDEX idx_connected_repos_path ON connected_local_git_repos(local_repo_path);