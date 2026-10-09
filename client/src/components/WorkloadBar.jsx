import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function WorkloadBar({
  workloadUsers = [],
  selectedUserFilter,
  onSelectUserFilter,
  onTriggerBurnoutDemo,
  onResetBurnoutDemo,
  loadingDemo
}) {
  const burnoutCount = workloadUsers.filter(u => u.isBurnoutRisk).length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Title and Burnout Alert Summary */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${burnoutCount > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {burnoutCount > 0 ? (
              <Flame className="w-5 h-5 animate-pulse text-red-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Workload Balancing</h2>
              {burnoutCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {burnoutCount} {burnoutCount === 1 ? 'member' : 'members'} burnout risk
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Healthy Load (&le;5)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Avatars pulse red if any team member exceeds <span className="font-semibold text-slate-200">5 tasks in 'In Progress'</span>
            </p>
          </div>
        </div>

        {/* Team Member Avatars List */}
        <div className="flex items-center gap-3 flex-wrap">
          {workloadUsers.map((user) => {
            const isBurnout = user.isBurnoutRisk; // inProgressCount > 5
            const isSelected = selectedUserFilter === user.userId;

            return (
              <div
                key={user.userId}
                onClick={() => onSelectUserFilter(isSelected ? 'all' : user.userId)}
                className={`relative group cursor-pointer transition-all duration-300 rounded-xl p-1.5 flex items-center gap-2.5 border ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                    : isBurnout
                    ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-500/20'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                }`}
                title={`${user.name} - ${user.inProgressCount} tasks In Progress ${isBurnout ? '(BURNOUT RISK: > 5 tasks)' : ''}`}
              >
                {/* Avatar with conditional Pulsing Red Background */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                      isBurnout
                        ? 'burnout-pulse ring-4 ring-red-500/80 bg-red-600'
                        : 'bg-slate-700 ring-2 ring-slate-700'
                    }`}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className={`w-full h-full object-cover transition-opacity ${
                          isBurnout ? 'opacity-85 mix-blend-luminosity' : 'opacity-100'
                        }`}
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {user.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Flame Badge on burnout */}
                  {isBurnout && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow-md animate-bounce">
                      <Flame className="w-3 h-3 fill-current text-amber-200" />
                    </span>
                  )}
                </div>

                {/* Member Info */}
                <div className="pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>

                  {/* Task Counter Badge */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                        isBurnout
                          ? 'bg-red-500 text-white font-mono animate-pulse'
                          : user.inProgressCount > 3
                          ? 'bg-amber-500/20 text-amber-300 font-mono'
                          : 'bg-slate-700/80 text-slate-300 font-mono'
                      }`}
                    >
                      {user.inProgressCount} in prog
                    </span>
                  </div>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none whitespace-nowrap">
                  <div className="px-2 py-1 rounded bg-slate-950 text-[11px] font-medium text-slate-200 border border-slate-700 shadow-xl">
                    {user.name}: {user.inProgressCount} In Progress
                    {isBurnout && <span className="text-red-400 font-bold ml-1">🔥 BURNOUT WARNING (&gt;5)!</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Evaluation Action Buttons */}
        <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800 w-full lg:w-auto justify-end">
          <button
            onClick={() => onTriggerBurnoutDemo(2)}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/80 transition-all shadow-sm hover:shadow-red-900/30 active:scale-95 disabled:opacity-50"
            title="Adds tasks to Sarah Chen so In Progress count exceeds 5 and triggers the red pulse effect"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Simulate Burnout (&gt;5)</span>
          </button>

          <button
            onClick={() => onResetBurnoutDemo(2)}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="Reset Sarah Chen tasks to normal workload"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </div>
  );
}
