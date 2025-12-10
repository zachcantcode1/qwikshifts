import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, Users, Settings, Clock, Inbox, Sun, Moon, LayoutGrid, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useTheme } from './ThemeProvider';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid, roles: ['manager'] },
    { href: '/schedule', label: 'Schedule', icon: Calendar, roles: ['manager'] },
    { href: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['manager'] },
    { href: '/my-schedule', label: 'My Schedule', icon: User, roles: ['manager', 'employee'] },
    { href: '/time-off', label: 'Time Off', icon: Clock, roles: ['manager', 'employee'] },
    { href: '/time-off-requests', label: 'Requests', icon: Inbox, roles: ['manager'] },
    { href: '/employees', label: 'Employees', icon: Users, roles: ['manager'] },
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['manager'] },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans antialiased selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col transition-all duration-300">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              QwikShifts
            </h1>
          </div>
          {user && user.name && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border/50 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => user && item.roles.includes(user.role)).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon size={18} className={cn("transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wider">Theme</div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-secondary rounded-lg transition-colors text-sm text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>


        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-secondary/20">
        <div className="h-full w-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
