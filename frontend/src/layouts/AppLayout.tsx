import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, LogOut, Plus, ChevronDown, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/new', label: 'New', icon: Plus },
];

function ProfileDropdown({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
          'hover:bg-accent text-muted-foreground hover:text-foreground'
        )}
        id="profile-dropdown-trigger"
      >
        <img
          src={user.avatar_url}
          alt={user.username}
          className="h-6 w-6 rounded-full ring-1 ring-border"
        />
        <span className="hidden sm:block max-w-[120px] truncate text-xs">
          {user.username}
        </span>
        <ChevronDown className={cn(
          'h-3 w-3 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg z-50"
            id="profile-dropdown-menu"
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground">GitHub Account</p>
            </div>
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              id="logout-button"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppLayout({ user, onLogout, children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo + Nav */}
            <div className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 group"
                id="nav-logo"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
                  <Database className="h-3.5 w-3.5 text-background" strokeWidth={2} />
                </div>
                <span className="font-semibold text-sm tracking-tight">
                  SQLWizard
                </span>
              </Link>

              <div className="h-4 w-px bg-border" />

              <nav className="flex items-center gap-1">
                {navItems.map(({ to, label }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        'relative px-3 py-1.5 text-sm rounded-md transition-colors duration-150',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute -bottom-[calc(0.375rem+1px)] left-0 right-0 h-[2px] bg-foreground rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side: Profile */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ProfileDropdown user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Content ────────────────────────────────────────────── */}
      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
