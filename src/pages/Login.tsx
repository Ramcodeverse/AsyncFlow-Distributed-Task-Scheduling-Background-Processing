import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Radio, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@asyncflow.io');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/20 mb-2">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign In to AsyncFlow</h1>
          <p className="text-xs text-slate-400">
            Distributed Task Scheduling &amp; Background Processing Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider text-center">
            Instant Demo Credentials
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@asyncflow.io', 'admin123')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-indigo-300 border border-slate-700 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('operator@asyncflow.io', 'operator123')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 border border-slate-700 transition-colors"
            >
              Operator
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('user@asyncflow.io', 'user123')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-300 border border-slate-700 transition-colors"
            >
              User
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
