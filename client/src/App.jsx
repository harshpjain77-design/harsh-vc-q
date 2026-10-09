import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import WorkloadBar from './components/WorkloadBar';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/TaskModal';
import AddMemberModal from './components/AddMemberModal';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workloadUsers, setWorkloadUsers] = useState([]);
  const [dbStatus, setDbStatus] = useState('Checking...');

  // Filters & Search
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultColumnForModal, setDefaultColumnForModal] = useState('todo');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Status & Notifications
  const [loading, setLoading] = useState(true);
  const [demoActionLoading, setDemoActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check backend health & storage mode
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.storageMode || 'PostgreSQL');
      }
    } catch {
      setDbStatus('Local Relational');
    }
  };

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  // Fetch all users for membership assignments
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch all users:', err);
    }
  };

  // Fetch workload metrics for team list burnout monitoring
  const fetchWorkload = useCallback(async () => {
    try {
      const res = await fetch('/api/workload');
      if (res.ok) {
        const data = await res.json();
        setWorkloadUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch workload:', err);
    }
  }, []);

  // Fetch project details, members, and tasks for selected project
  const fetchProjectData = useCallback(async (projId) => {
    if (!projId) return;
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projId}`),
        fetch(`/api/tasks?projectId=${projId}`)
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setCurrentProject(pData);
        setProjectMembers(pData.members || []);
      }

      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData);
      }
      await fetchWorkload();
    } catch (err) {
      console.error('Error fetching project data:', err);
      showToast('Error loading project data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchWorkload]);

  useEffect(() => {
    fetchHealth();
    fetchProjects();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectData(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectData]);

  // Drag and drop handler
  const handleDropTask = async (taskId, targetColumnId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetColumnId) return;

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetColumnId } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumnId })
      });

      if (!res.ok) {
        throw new Error('Failed to update task status');
      }

      // Re-fetch workload to immediately update In Progress counts and potential burnout pulse
      await fetchWorkload();
      showToast(`Task moved to ${targetColumnId.replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error('Drop error:', err);
      setTasks(previousTasks);
      showToast('Failed to move task', 'error');
    }
  };

  // Quick move column button (+1 or -1)
  const handleMoveColumn = async (taskId, direction) => {
    const columns = ['todo', 'in_progress', 'done'];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = columns.indexOf(task.status);
    const targetIndex = currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < columns.length) {
      await handleDropTask(taskId, columns[targetIndex]);
    }
  };

  // Create or Update task
  const handleSaveTask = async (taskData) => {
    const targetProjId = taskData.projectId || selectedProjectId || 1;

    let res;
    if (taskData.id) {
      // Update
      res = await fetch(`/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
    } else {
      // Create
      res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, projectId: targetProjId })
      });
    }

    if (!res.ok) {
      let errMsg = 'Failed to save task';
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch {
        errMsg = await res.text() || errMsg;
      }
      throw new Error(errMsg);
    }

    const savedTask = await res.json();

    // Close modal
    setIsTaskModalOpen(false);
    setTaskToEdit(null);

    // If new task was created with a priority or assignee that would be hidden by active filters,
    // reset filters so the newly created task card is GUARANTEED to be visible immediately!
    if (!taskData.id) {
      setSelectedPriority('all');
      setSelectedUserFilter('all');
      setSearchQuery('');
    }

    // Switch to target project if different
    if (targetProjId !== selectedProjectId) {
      setSelectedProjectId(targetProjId);
    } else {
      await fetchProjectData(targetProjId);
    }

    await fetchProjects();
    showToast(taskData.id ? 'Task updated successfully' : `Task "${savedTask.title}" created successfully!`, 'success');
    return savedTask;
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setTasks(prev => prev.filter(t => t.id !== taskId));
      await fetchWorkload();
      showToast('Task deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete task', 'error');
    }
  };

  // Add Member to Project with permissions
  const handleAddMember = async (memberData) => {
    try {
      let userIdToAdd = memberData.userId;

      // If new user was created on the fly
      if (memberData.isNewUser) {
        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: memberData.name,
            email: memberData.email,
            role: 'member'
          })
        });
        if (!userRes.ok) throw new Error('Failed to create new user');
        const createdUser = await userRes.json();
        userIdToAdd = createdUser.id;
        await fetchAllUsers();
      }

      // Add to project
      const res = await fetch(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdToAdd,
          permissionRole: memberData.permissionRole
        })
      });

      if (!res.ok) throw new Error('Failed to add member to project');

      setIsAddMemberOpen(false);
      await fetchProjectData(selectedProjectId);
      showToast(`User successfully added with ${memberData.permissionRole} permissions`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add user to project', 'error');
    }
  };

  // Interactive Burnout Demo Helper (> 5 tasks trigger)
  const handleTriggerBurnoutDemo = async (userId = 2) => {
    try {
      setDemoActionLoading(true);
      const res = await fetch('/api/workload/seed-burnout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        await fetchProjectData(selectedProjectId);
        showToast('🔥 Burnout triggered! Member has >5 In Progress tasks and avatar is pulsing red!', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handleResetBurnoutDemo = async (userId = 2) => {
    try {
      setDemoActionLoading(true);
      const res = await fetch('/api/workload/reset-burnout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        await fetchProjectData(selectedProjectId);
        showToast('Workload balanced. Burnout warning cleared.', 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDemoActionLoading(false);
    }
  };

  // Filter tasks based on Priority, Assignee, Search query
  const filteredTasks = tasks.filter((t) => {
    const matchPriority =
      selectedPriority === 'all' ||
      t.priority?.toLowerCase() === selectedPriority.toLowerCase();

    const matchUser =
      selectedUserFilter === 'all' ||
      t.assignee_id === Number(selectedUserFilter);

    const matchSearch =
      !searchQuery.trim() ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchPriority && matchUser && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border transition-all animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-red-950 border-red-500 text-red-200'
              : toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setDefaultColumnForModal('todo');
          setIsTaskModalOpen(true);
        }}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        dbStatus={dbStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        
        {/* The Vibe Check: Workload Balancing Bar */}
        <WorkloadBar
          workloadUsers={workloadUsers}
          selectedUserFilter={selectedUserFilter}
          onSelectUserFilter={setSelectedUserFilter}
          onTriggerBurnoutDemo={handleTriggerBurnoutDemo}
          onResetBurnoutDemo={handleResetBurnoutDemo}
          loadingDemo={demoActionLoading}
        />

        {/* Filter Controls Bar (Priority & Search) */}
        <FilterBar
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalTasksCount={tasks.length}
          filteredTasksCount={filteredTasks.length}
        />

        {/* Kanban Board with 3 Columns: To-Do, In Progress, Done */}
        {loading ? (
          <div className="flex-1 min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 font-medium">Loading project tasks...</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onDropTask={handleDropTask}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onMoveColumn={handleMoveColumn}
            onQuickAdd={(columnId) => {
              setTaskToEdit(null);
              setDefaultColumnForModal(columnId);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        projectId={selectedProjectId}
        projects={projects}
        members={projectMembers}
        allUsers={allUsers}
        defaultStatus={defaultColumnForModal}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
        allUsers={allUsers}
        currentProjectMembers={projectMembers}
        projectName={currentProject?.name || 'Project'}
      />
    </div>
  );
}
