import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Save, Check, Shield, Database, Radio, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [settings, setSettings] = useState({
    defaultTimeoutSec: 300,
    maxRetries: 3,
    taskRetentionDays: 30,
    storageBackend: 'local_storage',
    localStoragePath: '/storage/results',
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXX',
    notifyOnFailure: true,
    notifyOnCompletion: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText('af_live_948f2190c1e8470a82bcf921');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Platform Settings &amp; Configuration</h2>
        <p className="text-xs text-slate-400 mt-1">
          Cluster runtime parameters, queue backpressure tolerances, retention rules, and API credentials
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Credentials */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>API Authorization Credentials</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">Production Key</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value="af_live_948f2190c1e8470a82bcf921"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyKey}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              {copiedKey ? 'Copied' : 'Copy Key'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Use this token in the <code className="text-indigo-400">Authorization: Bearer</code> header for automated CLI and SDK dispatch.
          </p>
        </div>

        {/* Worker & Task Policies */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Task Execution &amp; Retention Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Default Task Timeout (seconds)</label>
              <input
                type="number"
                value={settings.defaultTimeoutSec}
                onChange={e => setSettings({ ...settings, defaultTimeoutSec: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Max Auto-Retries</label>
              <input
                type="number"
                value={settings.maxRetries}
                onChange={e => setSettings({ ...settings, maxRetries: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Task Log Retention (days)</label>
              <input
                type="number"
                value={settings.taskRetentionDays}
                onChange={e => setSettings({ ...settings, taskRetentionDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Artifact Storage */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Artifact Storage Abstraction</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Storage Backend Provider</label>
              <select
                value={settings.storageBackend}
                onChange={e => setSettings({ ...settings, storageBackend: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="local_storage">Local POSIX Filesystem Volume</option>
                <option value="s3">AWS S3 / Cloudflare R2 / GCS Adapter</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Storage Mount Point</label>
              <input
                type="text"
                value={settings.localStoragePath}
                onChange={e => setSettings({ ...settings, localStoragePath: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings saved cleanly!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
