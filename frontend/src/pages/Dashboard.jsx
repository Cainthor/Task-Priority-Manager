import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList, Home, Calendar as CalendarIcon, Ticket, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Calendario', href: '/dashboard/calendar', icon: CalendarIcon },
    { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Configuraciones', href: '/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                Task Priority Manager
              </Link>
              <div className="flex gap-4">
                {navigation.map((item) => {
                  const isActive = item.href === '/dashboard'
                    ? location.pathname === '/dashboard'
                    : location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                          ? 'bg-primary/10 text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">Hola, {user?.name}</span>
              <Button onClick={handleLogout} variant="outline">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}