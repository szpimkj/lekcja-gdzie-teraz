import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, CalendarDays, Settings } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  const navItems = [
    { path: '/', icon: Home, label: 'Główna' },
    { path: '/today', icon: Calendar, label: t.showDayPlan },
    { path: '/week', icon: CalendarDays, label: t.showWeekPlan },
    { path: '/settings', icon: Settings, label: t.settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-large z-50">
      <div className="container max-w-2xl mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-smooth min-w-[70px]',
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
