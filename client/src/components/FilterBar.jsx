import React from 'react';
import { Filter, Search, X, CheckSquare, Flame, AlertCircle, Clock, Check } from 'lucide-react';

const PRIORITIES = [
  { id: 'all', label: 'All Tasks', icon: CheckSquare, color: 'text-slate-300' },
  { id: 'urgent', label: 'Urgent', icon: Flame, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 'high', label: 'High', icon: AlertCircle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'medium', label: 'Medium', icon: Clock, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'low', label: 'Low', icon: Check, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
];

export default function FilterBar({
  selectedPriority,
  onSelectPriority,
  searchQuery,
  onSearchChange,
  totalTasksCount,
  filteredTasksCount
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-2">
      {/* Priority Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Filter by Priority:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {PRIORITIES.map((p) => {
            const Icon = p.icon;
            const isActive = selectedPriority === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPriority(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input & Task Count Summary */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 whitespace-nowrap bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
          Showing <span className="font-bold text-indigo-400">{filteredTasksCount}</span> / {totalTasksCount}
        </div>
      </div>
    </div>
  );
}
