import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Home, Calendar as CalendarIcon, Ticket, Settings as SettingsIcon, BarChart3, ChevronDown, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useState } from 'react';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState(['reportes']); // Keep Reportes open by default
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = (menuName) => {
    setOpenMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
  };

  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Calendario', href: '/dashboard/calendar', icon: CalendarIcon },
    {
      name: 'Reportes',
      icon: BarChart3,
      submenu: [
        { name: 'Reporte Asignaciones', href: '/dashboard/reports/assignments' },
        { name: 'Reporte Resumido', href: '/dashboard/reports/summary' },
      ]
    },
    { name: 'Configuraciones', href: '/dashboard/settings', icon: SettingsIcon },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => isActive(item.href));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 h-screen bg-card border-r border-border flex flex-col
        fixed lg:sticky inset-y-0 lg:top-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
          <Link to="/dashboard" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
            Task Priority
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 min-h-0">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isMenuOpen = openMenus.includes(item.name.toLowerCase());
              const itemActive = item.href ? isActive(item.href) : isSubmenuActive(item.submenu);

              return (
                <li key={item.name}>
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.name.toLowerCase())}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          itemActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </span>
                        {isMenuOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isMenuOpen && (
                        <ul className="mt-1 ml-4 space-y-1">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                  isActive(subItem.href)
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        itemActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-4 flex-shrink-0 bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <ThemeToggle showLabel={true} />
            <Button onClick={handleLogout} variant="outline" className="w-full" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <h1 className="text-lg lg:text-xl font-semibold text-foreground truncate">
            {navigation.find(item => item.href === location.pathname)?.name ||
             navigation.flatMap(item => item.submenu || []).find(sub => sub.href === location.pathname)?.name ||
             'Dashboard'}
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}