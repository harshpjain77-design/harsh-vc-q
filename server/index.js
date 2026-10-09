require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.url}`);
  next();
});

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storageMode: db.isPostgres() ? 'PostgreSQL' : 'Relational Local Engine',
    timestamp: new Date().toISOString()
  });
});

// Projects API
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.getProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    const project = await db.createProject({ name, description });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const members = await db.getProjectMembers(req.params.id);
    res.json({ ...project, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project Members & Permissions API
app.get('/api/projects/:id/members', async (req, res) => {
  try {
    const members = await db.getProjectMembers(req.params.id);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/members', async (req, res) => {
  try {
    const { userId, permissionRole } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    const member = await db.addProjectMember(req.params.id, { userId, permissionRole });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, avatar_url, role } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const user = await db.createUser({ name, email, avatar_url, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tasks CRUD API
app.get('/api/tasks', async (req, res) => {
  try {
    const { projectId, priority, search, assigneeId, status } = req.query;
    const tasks = await db.getTasks({ projectId, priority, search, assigneeId, status });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    let { projectId, title, description, status, priority, assigneeId, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Fallback if projectId not provided
    if (!projectId) {
      const projects = await db.getProjects();
      projectId = projects.length > 0 ? projects[0].id : 1;
    }

    const task = await db.createTask({
      projectId: parseInt(projectId, 10),
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
      dueDate: dueDate || null
    });
    console.log(`[Task Created] ID: ${task.id}, Title: "${task.title}", Status: ${task.status}, Project: ${projectId}`);
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updated = await db.updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  try {
    const { status, orderIndex } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const updated = await db.updateTaskStatus(req.params.id, status, orderIndex);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await db.deleteTask(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// "The Vibe Check" - Workload Balancing API
app.get('/api/workload', async (req, res) => {
  try {
    const metrics = await db.getUserWorkloadMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo helper endpoints for immediate demonstration of > 5 burnout trigger
app.post('/api/workload/seed-burnout', async (req, res) => {
  try {
    const userId = req.body.userId || 2; // Default Sarah Chen
    const metrics = await db.seedBurnoutDemo(userId);
    res.json({ message: `Successfully seeded >5 in_progress tasks for user ${userId}`, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workload/reset-burnout', async (req, res) => {
  try {
    const userId = req.body.userId || 2;
    const metrics = await db.resetBurnoutDemo(userId);
    res.json({ message: `Reset workload for user ${userId}`, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
async function startServer() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Kanban Backend Server listening on http://localhost:${PORT}`);
    console.log(`💾 Database Mode: ${db.isPostgres() ? 'PostgreSQL' : 'Relational Store'}`);
    console.log(`⚡ Workload Balancing Burnout Monitor: ACTIVE`);
    console.log(`=======================================================`);
  });
}

startServer();
