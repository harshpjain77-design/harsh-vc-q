# FlowState: Streamlined Task Management App with Workload Balancing

FlowState is a task management application built with Kanban-style organization, custom CRUD API, PostgreSQL relational data hierarchy, and an interactive **Workload Balancing** burnout prevention engine.

---

## 🚀 Live App Services

- **Frontend UI (Kanban Board)**: [http://localhost:3000](http://localhost:3000)
- **Backend CRUD API**: [http://localhost:5000](http://localhost:5000)
- **Health Check & Storage Status**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🌟 Key Features

### 1. Kanban Board & User Interaction
- **Three Columns**: **To-Do**, **In Progress**, and **Done** with drag-and-drop support.
- **Fluid Drag-and-Drop**: Drag task cards between columns with immediate optimistic updates and persisted database status updates (`PATCH /api/tasks/:id/status`).
- **Interactive Shift Controls**: Keyboard and single-click directional shift buttons (`<` / `>`) for rapid column movement.

### 2. Task Cards
- **Priority Tags**: Distinct visual badges for **Urgent** (Flame / Red), **High** (Amber), **Medium** (Blue), and **Low** (Green).
- **Due Dates**: Formatted dates with calendar icons and visual urgency indicators.
- **Descriptions & Hierarchy**: Expandable descriptions linked to project entities.
- **Assignee Avatars**: Tooltips and member avatars representing the task owner.

### 3. User Controls
- **Create Task Modal**: Title, description, status column, priority level, assignee selection, and due date.
- **Add Users to Projects**: Add team members with specific relational permissions (`owner`, `admin`, `member`, `viewer`), or invite new users directly.
- **Priority Filter**: Instant filter buttons for **All**, **Urgent**, **High**, **Medium**, and **Low**.
- **Live Search**: Instant keyword search filtering tasks by title and description.
- **Project Switcher**: Switch between active projects in real-time.

---

## 🔥 The Vibe Check: "Workload Balancing"

- **Column Task Counters**: Every column displays an active badge counter indicating the exact number of tasks (e.g., `To-Do (3)`, `In Progress (2)`, `Done (4)`).
- **Burnout Warning Condition**:
  - The workload monitor calculates the number of tasks in **In Progress** for every team member in real-time.
  - **If any user has MORE THAN 5 tasks in "In Progress"**, the background color of their avatar in the team list **pulses red** (`burnout-pulse ring-4 ring-red-500 bg-red-600`) with an animated warning flame badge (`🔥 BURNOUT RISK (>5 in progress)`).
- **1-Click Test Button**:
  - Click the **"Simulate Burnout (>5)"** button in the header bar to immediately assign tasks to Sarah Chen and witness the avatar pulsing red in real-time!
  - Click **"Reset"** to rebalance workload back to normal.

---

## 🗄️ Backend Logic & Relational Data

### Relational Schema (`schema.sql`):
1. `users`: Stores user identity, email, avatar, and global roles.
2. `projects`: Project hierarchies with creation and modification timestamps.
3. `project_members`: Relational junction table storing **user permissions** (`owner`, `admin`, `member`, `viewer`) per project with unique constraints and foreign keys (`ON DELETE CASCADE`).
4. `tasks`: Relational task hierarchy (`project_id REFERENCES projects(id) ON DELETE CASCADE`), status, priority, and `assignee_id REFERENCES users(id) ON DELETE SET NULL`.

### Dual PostgreSQL & Relational Engine:
- If PostgreSQL is available (`DATABASE_URL` or default `localhost:5432`), the server automatically connects, provisions tables from `schema.sql`, and creates indexes.
- To run PostgreSQL via Docker:
  ```bash
  docker compose up -d
  ```
- If PostgreSQL is not active, the backend seamlessly falls back to the embedded relational storage engine (`server/data/store.json`) with identical relational semantics, foreign key handling, and queries.

---

## 📡 Custom CRUD API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and storage mode |
| `GET` | `/api/projects` | List all projects with task and member counts |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id` | Get project details and project members |
| `POST` | `/api/projects/:id/members` | Add user to project with permissions |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create a user |
| `GET` | `/api/tasks` | Filter tasks by `projectId`, `priority`, `status`, `search` |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Get single task details |
| `PUT` | `/api/tasks/:id` | Update task details |
| `PATCH` | `/api/tasks/:id/status` | Update task column status (drag-and-drop) |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/workload` | Real-time workload & burnout indicator status |
| `POST` | `/api/workload/seed-burnout` | Simulate >5 in-progress tasks burnout trigger |
| `POST` | `/api/workload/reset-burnout` | Reset demo tasks to normal |
