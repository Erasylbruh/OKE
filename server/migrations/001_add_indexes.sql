-- Migration: Add performance indexes
-- Created: 2025-12-20
-- Description: Adds indexes to frequently queried columns for better performance

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_public ON projects(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public);

-- Likes table indexes
CREATE INDEX IF NOT EXISTS idx_likes_project ON likes(project_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- Followers table indexes
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Comment likes table indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Users table indexes (for profile lookups)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
