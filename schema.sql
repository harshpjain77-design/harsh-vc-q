-- PostgreSQL Relational Schema for Task Management Application
-- Stores task hierarchy (projects -> tasks) and user permissions

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member', -- global role: admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Project Memberships & Permissions Table (relational user permissions per project)
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
);

-- 4. Tasks Table (Relational Hierarchy: Project -> Tasks with User Assignee)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Seed Initial Demo Data
INSERT INTO users (id, name, email, avatar_url, role) VALUES
(1, 'Alex Rivera', 'alex@example.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin'),
(2, 'Sarah Chen', 'sarah@example.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'member'),
(3, 'Marcus Vance', 'marcus@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'member'),
(4, 'Elena Rostova', 'elena@example.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'member')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description) VALUES
(1, 'Cloud Sync Architecture', 'Core cloud data sync, offline cache, and real-time WebSocket protocol.'),
(2, 'Design System Refresh', 'Redesign UI components, accessible color contrast, and micro-interactions.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, permission_role) VALUES
(1, 1, 'owner'),
(1, 2, 'admin'),
(1, 3, 'member'),
(1, 4, 'viewer'),
(2, 1, 'admin'),
(2, 2, 'member')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, due_date, order_index) VALUES
(1, 1, 'Design Database Schema for Sync', 'Normalize project and task entities with PostgreSQL constraints.', 'done', 'high', 1, CURRENT_DATE + INTERVAL '2 days', 0),
(2, 1, 'Implement WebSocket Heartbeat', 'Add ping/pong ping pong protocol to detect dead connections.', 'done', 'medium', 2, CURRENT_DATE + INTERVAL '4 days', 1),
(3, 1, 'Build Kanban Drag & Drop Columns', 'Interactive columns for To-Do, In Progress, and Done with smooth reordering.', 'in_progress', 'urgent', 2, CURRENT_DATE + INTERVAL '1 days', 0),
(4, 1, 'Setup Relational Foreign Key Cascades', 'Ensure tasks are cleaned up when projects or members are modified.', 'in_progress', 'high', 3, CURRENT_DATE + INTERVAL '3 days', 1),
(5, 1, 'Workload Balancing Burnout Indicator', 'Highlight avatars pulsing red when user has >5 In Progress tasks.', 'in_progress', 'urgent', 1, CURRENT_DATE + INTERVAL '2 days', 2),
(6, 1, 'Integrate OAuth2 Authentication', 'Google and GitHub SSO login flows with session tokens.', 'todo', 'high', 4, CURRENT_DATE + INTERVAL '6 days', 0),
(7, 1, 'Add Priority Filter Controls', 'Filter Kanban cards dynamically by Low, Medium, High, and Urgent.', 'todo', 'medium', 2, CURRENT_DATE + INTERVAL '5 days', 1),
(8, 1, 'Audit Accessibility & Color Contrast', 'Ensure WCAG AA compliance across dark & light UI components.', 'todo', 'low', 3, CURRENT_DATE + INTERVAL '8 days', 2)
ON CONFLICT (id) DO NOTHING;
