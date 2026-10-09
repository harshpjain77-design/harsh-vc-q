import React from 'react';
import { KanbanSquare, Plus, UserPlus, Database, Layers } from 'lucide-react';

export default function Navbar({
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewTask,
  onOpenAddMember,
  dbStatus
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Project Selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <KanbanSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">FlowState</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Kanban
                </span>
              </div>
              <p className="text-xs text-slate-400">Streamlined Task Management & Workload Balancer</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {/* Project Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
            <Layers className="w-4 h-4 text-slate-400 ml-2" />
            <select
              aria-label="Active Project"
              value={selectedProjectId || ''}
              onChange={(e) => onSelectProject(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-200 py-1 pr-3 focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-slate-200">
                  {p.name} ({p.task_count || 0} tasks)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls & DB Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Storage:</span>
            <span className="font-semibold text-slate-200">{dbStatus || 'PostgreSQL'}</span>
          </div>

          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-all shadow-sm active:scale-95"
            title="Add user with permissions to current project"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Add Member</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}
