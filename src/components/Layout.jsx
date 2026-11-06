import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserSearch, Swords, Trophy, CalendarDays, MapPin, Package, UserCircle,
  ClipboardCheck, Settings2, Building2, BookOpen, Menu, X, LogOut, RotateCcw, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api';
import { Avatar } from './ui';
import { ConfirmDialog } from './Modal';
import toast from 'react-hot-toast';

const STUDENT_NAV = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/teams', label: 'My Teams', icon: Users },
  { to: '/student/players', label: 'Find Players', icon: UserSearch },
  { to: '/student/opponents', label: 'Find Opponents', icon: Swords },
  { to: '/student/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/student/matches', label: 'Matches', icon: CalendarDays },
  { to: '/student/book', label: 'Book a Venue', icon: MapPin },
  { to: '/student/equipment', label: 'Equipment', icon: Package },
  { to: '/student/profile', label: 'My Profile', icon: UserCircle },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/queue', label: 'Approval Queue', icon: ClipboardCheck, badge: 'queue' },
  { to: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/admin/matches', label: 'Matches', icon: CalendarDays },
  { to: '/admin/sports', label: 'Sports & Rules', icon: Settings2 },
  { to: '/admin/venues', label: 'Venues', icon: Building2 },
  { to: '/admin/equipment', label: 'Equipment Desk', icon: Package, badge: 'overdue' },
  { to: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/admin/users', label: 'Users', icon: Shield },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Trophy className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-bold text-slate-900">PlayBook</p>
        <p className="text-[11px] text-slate-500">Players · Teams · Tournaments</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [badges, setBadges] = useState({});
  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isAdmin) return;
    adminApi
      .getStats()
      .then((s) => setBadges({ queue: s.pendingTeams + s.pendingMatches + s.pendingTournaments, overdue: s.overdueLoans }))
      .catch(() => {});
  }, [isAdmin, location.pathname, location.key]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleReset() {
    await adminApi.resetDemoData();
    setConfirmReset(false);
    await refresh();
    toast.success('Demo data restored');
    navigate(0);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button className="btn-ghost p-1.5 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{isAdmin ? 'Sports Office' : 'Student'}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && badges[badge] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${badge === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                {badges[badge]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button className="btn-ghost w-full justify-start text-xs" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <Avatar name={user?.name} />
          <button className="btn-ghost p-2" onClick={handleLogout} title="Log out" aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="This restores the original sample teams, matches, tournaments, bookings and loans. Anything you created will be lost."
        confirmLabel="Reset"
        danger
        onConfirm={handleReset}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
