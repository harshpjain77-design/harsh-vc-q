import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus, ListTodo, Loader2, CheckCircle } from 'lucide-react';

const COLUMN_CONFIG = {
  todo: {
    title: 'To-Do',
    icon: ListTodo,
    accent: 'border-t-blue-500',
    counterBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  in_progress: {
    title: 'In Progress',
    icon: Loader2,
    accent: 'border-t-amber-500',
    counterBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  done: {
    title: 'Done',
    icon: CheckCircle,
    accent: 'border-t-emerald-500',
    counterBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }
};

export default function KanbanColumn({
  columnId,
  tasks = [],
  columnIndex,
  totalColumns,
  onDropTask,
  onEditTask,
  onDeleteTask,
  onMoveColumn,
  onQuickAdd
}) {
  const [isOver, setIsOver] = useState(false);
  const config = COLUMN_CONFIG[columnId] || {
    title: columnId,
    icon: ListTodo,
    accent: 'border-t-slate-500',
    counterBadge: 'bg-slate-700 text-slate-300'
  };
  const Icon = config.icon;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e) => {
    // Only unset if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.taskId) {
        onDropTask(data.taskId, columnId);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[300px] max-w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-200 border-t-4 ${config.accent} ${
        isOver ? 'ring-2 ring-indigo-500/80 bg-slate-850/80 shadow-xl' : ''
      }`}
    >
      {/* Column Header with Counter */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-200 tracking-wide">
            {config.title}
          </h2>
          {/* Column Task Counter */}
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border font-mono ${config.counterBadge}`}
            title={`${tasks.length} tasks in ${config.title}`}
          >
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAdd(columnId)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={`Add task directly to ${config.title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Column Tasks Container */}
      <div className="p-3 flex-1 flex flex-col gap-3 min-h-[350px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <div
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors ${
              isOver ? 'border-indigo-500/60 bg-indigo-500/5 text-indigo-300' : 'border-slate-800/70 text-slate-500'
            }`}
          >
            <p className="text-xs font-medium">No tasks in {config.title}</p>
            <p className="text-[11px] text-slate-600 mt-1">Drag tasks here or click +</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentColumnIndex={columnIndex}
              totalColumns={totalColumns}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMoveColumn={onMoveColumn}
            />
          ))
        )}
      </div>
    </div>
  );
}
