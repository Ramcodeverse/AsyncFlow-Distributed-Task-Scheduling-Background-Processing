import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Filter, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export const Activity: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.auditLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => (actionFilter === 'all' ? true : l.action.startsWith(actionFilter)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Activity &amp; Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all user authentication events, task submissions, retries, and administrator actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Action Categories</option>
            <option value="auth">Authentication Events</option>
            <option value="task">Task Lifecycle Events</option>
            <option value="schedule">Schedule Events</option>
            <option value="admin">Admin Interventions</option>
          </select>

          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-sans">
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-200">{log.actorEmail}</td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-indigo-400 font-semibold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-400">{log.targetId}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs">{log.details}</td>
                    <td className="py-3 px-4 text-slate-500">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
