import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, UserX, RefreshCw, Key, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<(User & { taskCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setUpdatingId(user.id);
    try {
      await api.updateUserRole(user.id, user.role, !user.isActive);
      loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">User &amp; Role Administration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Access Control (RBAC): Admin, Operator, and User permission boundaries
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* RBAC Rules Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
          <div className="text-xs font-mono font-semibold text-indigo-400 uppercase">ADMIN ROLE</div>
          <p className="text-xs text-slate-400 mt-1">
            Full system control: Manage users, reconfigure workers, wipe stuck queues, inspect global audit logs.
          </p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
          <div className="text-xs font-mono font-semibold text-amber-400 uppercase">OPERATOR ROLE</div>
          <p className="text-xs text-slate-400 mt-1">
            Operational reliability: Manage all schedules, trigger outbox sweeps, and retry or cancel any cluster task.
          </p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
          <div className="text-xs font-mono font-semibold text-emerald-400 uppercase">USER ROLE</div>
          <p className="text-xs text-slate-400 mt-1">
            Standard tenant: Submit jobs, monitor own execution progress, download personal artifacts.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Tasks Owned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{u.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{u.department || 'General'}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono font-semibold text-slate-200 focus:outline-none"
                    >
                      <option value="admin">ADMIN</option>
                      <option value="operator">OPERATOR</option>
                      <option value="user">USER</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">{u.taskCount} tasks</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        u.isActive
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span>{u.isActive ? 'Active' : 'Disabled'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={updatingId === u.id}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
