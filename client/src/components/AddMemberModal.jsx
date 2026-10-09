import React, { useState } from 'react';
import { X, UserPlus, Shield, Mail, User } from 'lucide-react';

export default function AddMemberModal({
  isOpen,
  onClose,
  onAddMember,
  allUsers = [],
  currentProjectMembers = [],
  projectName
}) {
  const [mode, setMode] = useState('existing'); // 'existing' or 'new'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissionRole, setPermissionRole] = useState('member');

  // New user fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filter out users who are already in the project if adding existing
  const currentMemberIds = new Set(currentProjectMembers.map(m => m.user_id));
  const availableUsers = allUsers.filter(u => !currentMemberIds.has(u.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'existing') {
      if (!selectedUserId) {
        setError('Please select a user to add');
        return;
      }
      onAddMember({
        userId: Number(selectedUserId),
        permissionRole
      });
    } else {
      if (!newUserName.trim() || !newUserEmail.trim()) {
        setError('Please enter name and email');
        return;
      }
      onAddMember({
        isNewUser: true,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        permissionRole
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Member to Project</h2>
              <p className="text-xs text-slate-400">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode('existing'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'existing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Select Existing User
            </button>
            <button
              type="button"
              onClick={() => { setMode('new'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'new' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Invite New User
            </button>
          </div>

          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Select Team User
              </label>
              {availableUsers.length === 0 ? (
                <p className="text-xs text-amber-400/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  All available users are already assigned to this project. Switch to "Invite New User" tab to add someone new.
                </p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose a user --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Lee"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="jordan@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Project Permission Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Permission Role</span>
            </label>
            <select
              value={permissionRole}
              onChange={(e) => setPermissionRole(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="admin">Admin (Manage tasks, members & settings)</option>
              <option value="member">Member (Create, edit, move tasks)</option>
              <option value="viewer">Viewer (Read-only access)</option>
              <option value="owner">Owner (Full access)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'existing' && availableUsers.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              Add to Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
