import React, { useState } from 'react';
import { Calendar, Trash2, Edit3, ArrowLeft, ArrowRight, GripVertical, Flame, AlertCircle, Clock, Check } from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: Flame,
    color: 'text-red-400'
  },
  high: {
    label: 'High',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: AlertCircle,
    color: 'text-amber-400'
  },
  medium: {
    label: 'Medium',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Clock,
    color: 'text-blue-400'
  },
  low: {
    label: 'Low',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Check,
    color: 'text-emerald-400'
  }
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onMoveColumn,
  currentColumnIndex,
  totalColumns = 3
}) {
  const [isDragging, setIsDragging] = useState(false);
  const priorityInfo = PRIORITY_CONFIG[task.priority?.toLowerCase()] || PRIORITY_CONFIG.medium;
  const PriorityIcon = priorityInfo.icon;

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, originStatus: task.status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative bg-slate-800/90 hover:bg-slate-800 border rounded-xl p-4 transition-all duration-200 shadow-md hover:shadow-xl cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 border-indigo-500 scale-95'
          : 'border-slate-700/60 hover:border-slate-600'
      }`}
    >
      {/* Top Header: Priority Tag & Action Icons */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityInfo.badge}`}
          >
            <PriorityIcon className="w-3 h-3" />
            <span>{priorityInfo.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Quick Column Shift for ease of use alongside drag & drop */}
          {currentColumnIndex > 0 && (
            <button
              onClick={() => onMoveColumn(task.id, -1)}
              title="Move to previous column"
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {currentColumnIndex < totalColumns - 1 && (
            <button
              onClick={() => onMoveColumn(task.id, 1)}
              title="Move to next column"
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white mb-1.5 leading-snug">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Due Date & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs text-slate-400">
        {/* Due Date */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          {task.due_date ? (
            <>
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatDate(task.due_date)}</span>
            </>
          ) : (
            <span className="text-slate-500">No due date</span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee_name ? (
          <div className="flex items-center gap-1.5" title={`Assignee: ${task.assignee_name}`}>
            <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
              {task.assignee_name.split(' ')[0]}
            </span>
            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center">
              {task.assignee_avatar ? (
                <img
                  src={task.assignee_avatar}
                  alt={task.assignee_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-white">
                  {task.assignee_name.charAt(0)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 italic">Unassigned</span>
        )}
      </div>
    </div>
  );
}
