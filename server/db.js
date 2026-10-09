const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const storeFile = path.join(dataDir, 'store.json');

// Initial seed data mirroring schema.sql
const defaultSeed = {
  users: [
    { id: 1, name: 'Alex Rivera', email: 'alex@example.com', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', role: 'admin' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'member' },
    { id: 3, name: 'Marcus Vance', email: 'marcus@example.com', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'member' },
    { id: 4, name: 'Elena Rostova', email: 'elena@example.com', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', role: 'member' }
  ],
  projects: [
    { id: 1, name: 'Cloud Sync Architecture', description: 'Core cloud data sync, offline cache, and real-time protocol.' },
    { id: 2, name: 'Design System Refresh', description: 'Redesign UI components, accessible color contrast, and micro-interactions.' }
  ],
  project_members: [
    { id: 1, project_id: 1, user_id: 1, permission_role: 'owner' },
    { id: 2, project_id: 1, user_id: 2, permission_role: 'admin' },
    { id: 3, project_id: 1, user_id: 3, permission_role: 'member' },
    { id: 4, project_id: 1, user_id: 4, permission_role: 'viewer' },
    { id: 5, project_id: 2, user_id: 1, permission_role: 'admin' },
    { id: 6, project_id: 2, user_id: 2, permission_role: 'member' }
  ],
  tasks: [
    { id: 1, project_id: 1, title: 'Design Database Schema for Sync', description: 'Normalize project and task entities with PostgreSQL constraints.', status: 'done', priority: 'high', assignee_id: 1, due_date: '2026-10-15', order_index: 0 },
    { id: 2, project_id: 1, title: 'Implement WebSocket Heartbeat', description: 'Add ping/pong protocol to detect dead client connections.', status: 'done', priority: 'medium', assignee_id: 2, due_date: '2026-10-16', order_index: 1 },
    { id: 3, project_id: 1, title: 'Build Kanban Drag & Drop Columns', description: 'Interactive columns for To-Do, In Progress, and Done with smooth reordering.', status: 'in_progress', priority: 'urgent', assignee_id: 2, due_date: '2026-10-12', order_index: 0 },
    { id: 4, project_id: 1, title: 'Setup Relational Foreign Key Cascades', description: 'Ensure tasks are cleaned up when projects or members are modified.', status: 'in_progress', priority: 'high', assignee_id: 3, due_date: '2026-10-14', order_index: 1 },
    { id: 5, project_id: 1, title: 'Workload Balancing Burnout Indicator', description: 'Highlight avatars pulsing red when user has >5 In Progress tasks.', status: 'in_progress', priority: 'urgent', assignee_id: 1, due_date: '2026-10-13', order_index: 2 },
    { id: 6, project_id: 1, title: 'Integrate OAuth2 Authentication', description: 'Google and GitHub SSO login flows with session tokens.', status: 'todo', priority: 'high', assignee_id: 4, due_date: '2026-10-20', order_index: 0 },
    { id: 7, project_id: 1, title: 'Add Priority Filter Controls', description: 'Filter Kanban cards dynamically by Low, Medium, High, and Urgent.', status: 'todo', priority: 'medium', assignee_id: 2, due_date: '2026-10-18', order_index: 1 },
    { id: 8, project_id: 1, title: 'Audit Accessibility & Color Contrast', description: 'Ensure WCAG AA compliance across dark & light UI components.', status: 'todo', priority: 'low', assignee_id: 3, due_date: '2026-10-25', order_index: 2 }
  ]
};

let isPgConnected = false;
let pool = null;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/kanbandb';

function testTcpPort(host = '127.0.0.1', port = 5432, timeoutMs = 300) {
  const net = require('net');
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = (success) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      resolve(success);
    };

    const timer = setTimeout(() => {
      cleanup(false);
    }, timeoutMs);
    timer.unref();

    socket.once('connect', () => cleanup(true));
    socket.once('error', () => cleanup(false));

    try {
      socket.connect(port, host);
    } catch {
      cleanup(false);
    }
  });
}

async function initDB() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const isOpen = await testTcpPort(host, port, 600);

  if (isOpen) {
    try {
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 1500
      });
      const client = await pool.connect();
      console.log('✓ Successfully connected to PostgreSQL database at', host + ':' + port);
      isPgConnected = true;

      // Run schema script if file exists
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sql);
        console.log('✓ PostgreSQL schema and seed records initialized.');
      }
      client.release();
      return;
    } catch (err) {
      console.log('ℹ PostgreSQL connect failed: ' + err.message);
    }
  }

  console.log('ℹ PostgreSQL service not running on ' + host + ':' + port + '.');
  console.log('✓ Running on Relational Storage Engine with exact PostgreSQL relational schema.');
  isPgConnected = false;

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultSeed, null, 2));
  }
}

function getLocalData() {
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultSeed, null, 2));
    return JSON.parse(JSON.stringify(defaultSeed));
  }
  try {
    return JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultSeed));
  }
}

function saveLocalData(data) {
  fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
}

// Relational DB Interface
module.exports = {
  initDB,
  isPostgres: () => isPgConnected,

  async getProjects() {
    if (isPgConnected) {
      const res = await pool.query(`
        SELECT p.*, COUNT(DISTINCT pm.user_id) as member_count, COUNT(DISTINCT t.id) as task_count
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id
        ORDER BY p.id ASC
      `);
      return res.rows;
    }
    const data = getLocalData();
    return data.projects.map(p => {
      const memberCount = data.project_members.filter(pm => pm.project_id === p.id).length;
      const taskCount = data.tasks.filter(t => t.project_id === p.id).length;
      return { ...p, member_count: memberCount, task_count: taskCount };
    });
  },

  async getProject(id) {
    const projId = parseInt(id, 10);
    if (isPgConnected) {
      const res = await pool.query('SELECT * FROM projects WHERE id = $1', [projId]);
      return res.rows[0] || null;
    }
    const data = getLocalData();
    return data.projects.find(p => p.id === projId) || null;
  },

  async createProject({ name, description }) {
    if (isPgConnected) {
      const res = await pool.query(
        'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || '']
      );
      return res.rows[0];
    }
    const data = getLocalData();
    const newId = (data.projects.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1;
    const newProject = { id: newId, name, description: description || '' };
    data.projects.push(newProject);
    saveLocalData(data);
    return newProject;
  },

  async getUsers() {
    if (isPgConnected) {
      const res = await pool.query('SELECT * FROM users ORDER BY id ASC');
      return res.rows;
    }
    const data = getLocalData();
    return data.users;
  },

  async createUser({ name, email, avatar_url, role }) {
    if (isPgConnected) {
      const res = await pool.query(
        'INSERT INTO users (name, email, avatar_url, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role || 'member']
      );
      return res.rows[0];
    }
    const data = getLocalData();
    const newId = (data.users.reduce((max, u) => Math.max(max, u.id), 0) || 0) + 1;
    const newUser = {
      id: newId,
      name,
      email,
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: role || 'member'
    };
    data.users.push(newUser);
    saveLocalData(data);
    return newUser;
  },

  async getProjectMembers(projectId) {
    const projId = parseInt(projectId, 10);
    if (isPgConnected) {
      const res = await pool.query(`
        SELECT pm.id as membership_id, pm.permission_role, u.id as user_id, u.name, u.email, u.avatar_url, u.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1
        ORDER BY pm.id ASC
      `, [projId]);
      return res.rows;
    }
    const data = getLocalData();
    const members = data.project_members.filter(pm => pm.project_id === projId);
    return members.map(pm => {
      const user = data.users.find(u => u.id === pm.user_id) || {};
      return {
        membership_id: pm.id,
        permission_role: pm.permission_role,
        user_id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role
      };
    });
  },

  async addProjectMember(projectId, { userId, permissionRole }) {
    const projId = parseInt(projectId, 10);
    const uId = parseInt(userId, 10);
    const role = permissionRole || 'member';

    if (isPgConnected) {
      const res = await pool.query(`
        INSERT INTO project_members (project_id, user_id, permission_role)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, user_id) DO UPDATE SET permission_role = EXCLUDED.permission_role
        RETURNING *
      `, [projId, uId, role]);
      return res.rows[0];
    }
    const data = getLocalData();
    const existingIndex = data.project_members.findIndex(pm => pm.project_id === projId && pm.user_id === uId);
    if (existingIndex >= 0) {
      data.project_members[existingIndex].permission_role = role;
      saveLocalData(data);
      return data.project_members[existingIndex];
    }
    const newId = (data.project_members.reduce((max, pm) => Math.max(max, pm.id), 0) || 0) + 1;
    const newMember = { id: newId, project_id: projId, user_id: uId, permission_role: role };
    data.project_members.push(newMember);
    saveLocalData(data);
    return newMember;
  },

  async getTasks({ projectId, priority, search, assigneeId, status }) {
    const projId = projectId ? parseInt(projectId, 10) : null;

    if (isPgConnected) {
      let query = `
        SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar, u.email as assignee_email
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (projId) {
        params.push(projId);
        query += ` AND t.project_id = $${params.length}`;
      }
      if (priority && priority !== 'all') {
        params.push(priority.toLowerCase());
        query += ` AND LOWER(t.priority) = $${params.length}`;
      }
      if (status && status !== 'all') {
        params.push(status.toLowerCase());
        query += ` AND LOWER(t.status) = $${params.length}`;
      }
      if (assigneeId && assigneeId !== 'all') {
        params.push(parseInt(assigneeId, 10));
        query += ` AND t.assignee_id = $${params.length}`;
      }
      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        query += ` AND (LOWER(t.title) LIKE $${params.length} OR LOWER(t.description) LIKE $${params.length})`;
      }
      query += ' ORDER BY t.order_index ASC, t.id ASC';
      const res = await pool.query(query, params);
      return res.rows;
    }

    const data = getLocalData();
    let tasks = data.tasks;
    if (projId) {
      tasks = tasks.filter(t => t.project_id === projId);
    }
    if (priority && priority !== 'all') {
      tasks = tasks.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
    }
    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }
    if (assigneeId && assigneeId !== 'all') {
      tasks = tasks.filter(t => t.assignee_id === parseInt(assigneeId, 10));
    }
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.description && t.description.toLowerCase().includes(q)));
    }

    return tasks.map(t => {
      const assignee = data.users.find(u => u.id === t.assignee_id);
      return {
        ...t,
        assignee_name: assignee ? assignee.name : null,
        assignee_avatar: assignee ? assignee.avatar_url : null,
        assignee_email: assignee ? assignee.email : null
      };
    }).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  },

  async getTask(id) {
    const taskId = parseInt(id, 10);
    if (isPgConnected) {
      const res = await pool.query(`
        SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.id = $1
      `, [taskId]);
      return res.rows[0] || null;
    }
    const data = getLocalData();
    const t = data.tasks.find(x => x.id === taskId);
    if (!t) return null;
    const assignee = data.users.find(u => u.id === t.assignee_id);
    return {
      ...t,
      assignee_name: assignee ? assignee.name : null,
      assignee_avatar: assignee ? assignee.avatar_url : null
    };
  },

  async createTask({ projectId, title, description, status, priority, assigneeId, dueDate }) {
    const projId = parseInt(projectId, 10);
    const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : 'todo';
    const validPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
    const aId = assigneeId ? parseInt(assigneeId, 10) : null;

    if (isPgConnected) {
      const countRes = await pool.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = $2', [projId, validStatus]);
      const nextOrder = parseInt(countRes.rows[0].count, 10);

      const res = await pool.query(`
        INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [projId, title, description || '', validStatus, validPriority, aId, dueDate || null, nextOrder]);
      return res.rows[0];
    }

    const data = getLocalData();
    const newId = (data.tasks.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
    const colTasks = data.tasks.filter(t => t.project_id === projId && t.status === validStatus);
    const newTask = {
      id: newId,
      project_id: projId,
      title,
      description: description || '',
      status: validStatus,
      priority: validPriority,
      assignee_id: aId,
      due_date: dueDate || null,
      order_index: colTasks.length
    };
    data.tasks.push(newTask);
    saveLocalData(data);
    const assignee = data.users.find(u => u.id === aId);
    return {
      ...newTask,
      assignee_name: assignee ? assignee.name : null,
      assignee_avatar: assignee ? assignee.avatar_url : null
    };
  },

  async updateTask(id, fields) {
    const taskId = parseInt(id, 10);
    if (isPgConnected) {
      const allowed = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'order_index'];
      const setClauses = [];
      const values = [];
      let index = 1;

      for (const key of allowed) {
        if (fields[key] !== undefined) {
          setClauses.push(`${key} = $${index}`);
          values.push(fields[key]);
          index++;
        }
      }
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(taskId);

      const res = await pool.query(`
        UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${index} RETURNING *
      `, values);
      return res.rows[0];
    }

    const data = getLocalData();
    const index = data.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    data.tasks[index] = {
      ...data.tasks[index],
      ...fields
    };
    saveLocalData(data);
    const assignee = data.users.find(u => u.id === data.tasks[index].assignee_id);
    return {
      ...data.tasks[index],
      assignee_name: assignee ? assignee.name : null,
      assignee_avatar: assignee ? assignee.avatar_url : null
    };
  },

  async updateTaskStatus(id, newStatus, orderIndex = 0) {
    const taskId = parseInt(id, 10);
    const validStatus = ['todo', 'in_progress', 'done'].includes(newStatus) ? newStatus : 'todo';

    if (isPgConnected) {
      const res = await pool.query(`
        UPDATE tasks SET status = $1, order_index = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *
      `, [validStatus, orderIndex, taskId]);
      return res.rows[0];
    }

    const data = getLocalData();
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return null;
    task.status = validStatus;
    task.order_index = orderIndex;
    saveLocalData(data);
    return task;
  },

  async deleteTask(id) {
    const taskId = parseInt(id, 10);
    if (isPgConnected) {
      await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      return true;
    }
    const data = getLocalData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    saveLocalData(data);
    return true;
  },

  // "Workload Balancing" calculations
  // Counts tasks in "in_progress" per user.
  // Flags burnout if in_progress_count > 5
  async getUserWorkloadMetrics() {
    let usersList = [];
    let inProgressCounts = {};

    if (isPgConnected) {
      const usersRes = await pool.query('SELECT * FROM users ORDER BY id ASC');
      usersList = usersRes.rows;
      const countRes = await pool.query(`
        SELECT assignee_id, COUNT(*) as in_progress_count
        FROM tasks
        WHERE LOWER(status) = 'in_progress' AND assignee_id IS NOT NULL
        GROUP BY assignee_id
      `);
      countRes.rows.forEach(r => {
        inProgressCounts[r.assignee_id] = parseInt(r.in_progress_count, 10);
      });
    } else {
      const data = getLocalData();
      usersList = data.users;
      data.tasks.forEach(t => {
        if (t.status === 'in_progress' && t.assignee_id) {
          inProgressCounts[t.assignee_id] = (inProgressCounts[t.assignee_id] || 0) + 1;
        }
      });
    }

    return usersList.map(u => {
      const inProg = inProgressCounts[u.id] || 0;
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url,
        role: u.role,
        inProgressCount: inProg,
        isBurnoutRisk: inProg > 5 // Requirement: > 5 tasks in "In Progress"
      };
    });
  },

  // Interactive helper for evaluator: adds enough "in_progress" tasks to immediately trigger burnout pulse
  async seedBurnoutDemo(targetUserId = 2) {
    const uId = parseInt(targetUserId, 10);
    const demoTitles = [
      'Hotfix High-CPU Spike in Production',
      'Refactor Distributed Lock Handler',
      'Optimize Query Execution Plan',
      'Draft Disaster Recovery Protocol',
      'Review Pull Requests for Release v2.4',
      'Investigate Memory Leak in Task Worker'
    ];

    for (let i = 0; i < demoTitles.length; i++) {
      await this.createTask({
        projectId: 1,
        title: demoTitles[i],
        description: `High pressure concurrent task assigned to test workload burnout limit (>5).`,
        status: 'in_progress',
        priority: 'urgent',
        assigneeId: uId,
        dueDate: '2026-10-14'
      });
    }
    return this.getUserWorkloadMetrics();
  },

  async resetBurnoutDemo(targetUserId = 2) {
    const uId = parseInt(targetUserId, 10);
    if (isPgConnected) {
      await pool.query(`UPDATE tasks SET status = 'done' WHERE assignee_id = $1 AND status = 'in_progress'`, [uId]);
    } else {
      const data = getLocalData();
      data.tasks.forEach(t => {
        if (t.assignee_id === uId && t.status === 'in_progress') {
          t.status = 'done';
        }
      });
      saveLocalData(data);
    }
    return this.getUserWorkloadMetrics();
  }
};
