import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Clock,
  Cpu,
  Activity,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  User as UserIcon,
  RefreshCw,
  Menu,
  X,
  Radio,
  FileText,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { NotificationItem, UserRole } from '../../types';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout, switchPersona } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [recoveringOutbox, setRecoveringOutbox] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch notifications periodically
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications);
      } catch {
        // silent fail
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecoverOutbox = async () => {
    setRecoveringOutbox(true);
    try {
      await api.triggerOutboxRecovery();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRecoveringOutbox(false), 800);
    }
  };

  const navItems = [
    { label: 'Website & Showcase', path: '/', icon: Globe },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Task Queue', path: '/tasks', icon: Layers },
    { label: 'Submit Job', path: '/tasks/new', icon: PlusCircle },
    { label: 'Schedules', path: '/schedules', icon: Clock },
    { label: 'Worker Pool', path: '/workers', icon: Cpu },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
    { label: 'Activity Logs', path: '/activity', icon: FileText },
    ...(user?.role === 'admin'
      ? [{ label: 'User Admin', path: '/admin/users', icon: ShieldCheck }]
      : []),
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Product Showcase';
    if (path.startsWith('/tasks/new')) return 'Submit New Task';
    if (path.startsWith('/tasks/')) return 'Task Execution Details';
    if (path === '/tasks') return 'Distributed Tasks';
    if (path.startsWith('/schedules/new')) return 'Create Schedule';
    if (path === '/schedules') return 'Scheduled Periodic Jobs';
    if (path === '/workers') return 'Celery Worker Nodes';
    if (path === '/monitoring') return 'System Infrastructure Health';
    if (path === '/activity') return 'Operational Audit Trail';
    if (path === '/admin/users') return 'User & Role Administration';
    if (path === '/settings') return 'System Configuration';
    return 'Operations Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950 shrink-0">
        {/* Brand */}
        <div 
          onClick={() => navigate('/')} 
          className="h-16 flex items-center px-5 border-b border-slate-800/80 justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">AsyncFlow</span>
              <span className="block text-[10px] font-mono text-slate-400">v1.2.0 · Celery &amp; Redis</span>
            </div>
          </div>
        </div>

        {/* Persona Switcher Quick Widget */}
        <div className="p-3 mx-3 my-3 bg-slate-900 border border-slate-800/90 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span>ACTIVE PERSONA</span>
            <span className="uppercase text-indigo-400 font-semibold">{user?.role || 'Guest'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['admin', 'operator', 'user'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => switchPersona(role)}
                className={`py-1 text-[11px] font-medium rounded transition-colors capitalize ${
                  user?.role === role
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`Switch test persona to ${role}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Worker Pool Status Kicker */}
        <div className="p-3 m-3 bg-slate-900/70 border border-slate-800/80 rounded-lg text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>3 Nodes Online</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400">14 Qs OK</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Transactional outbox &amp; beat scheduler active
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 hidden sm:inline">AsyncFlow</span>
              <span className="text-slate-700 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-100 text-sm sm:text-base">{getBreadcrumbTitle()}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Website Button */}
            <button
              onClick={() => navigate('/')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 text-xs text-indigo-300 font-medium transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Showcase</span>
            </button>

            {/* Quick Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quick search tasks...</span>
              <kbd className="hidden md:inline font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Recover Outbox Button */}
            <button
              onClick={handleRecoverOutbox}
              disabled={recoveringOutbox}
              title="Trigger transactional outbox check & recovery sweep"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${recoveringOutbox ? 'animate-spin' : ''}`} />
              <span>Sweep Outbox</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                    <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider font-mono">
                      Notifications ({notifications.length})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-800/40 ${
                            !n.isRead ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium text-slate-200 mb-1">
                            <span className="truncate">{n.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
                          {n.taskId && (
                            <button
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate(`/tasks/${n.taskId}`);
                              }}
                              className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                              Inspect Task →
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-slate-200 truncate max-w-[120px]">{user?.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 capitalize">{user?.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-medium text-slate-200">{user?.name}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[10px] font-mono text-indigo-400 uppercase mt-0.5">{user?.department}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors text-left"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Profile &amp; Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-slate-950 border-r border-slate-800 flex flex-col p-4">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-base text-white">AsyncFlow</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-900"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
