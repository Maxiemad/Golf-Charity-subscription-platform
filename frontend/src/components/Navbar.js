import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { User, LogOut, LayoutDashboard, Shield, ArrowLeft, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const showBackButton = !['/', '/login', '/register'].includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="hover:bg-accent/10"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2.5" data-testid="logo-link">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-pink-500 to-primary rounded-full blur opacity-75 group-hover:opacity-100 transition"></div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-primary to-pink-600 rounded-full flex items-center justify-center shadow-xl">
                  {/* Lively Icon - Energy Burst */}
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="10" cy="12" r="5" fill="currentColor" />
                    <line x1="18" y1="6" x2="21" y2="3" strokeLinecap="round" />
                    <line x1="18" y1="12" x2="22" y2="12" strokeLinecap="round" />
                    <line x1="18" y1="18" x2="21" y2="21" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-outfit font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                Lively
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hover:bg-accent/10"
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </Button>

            <Link
              to="/charities"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-charities-link"
            >
              Charities
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    data-testid="user-menu-button"
                  >
                    <User className="w-4 h-4" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => navigate('/dashboard')}
                    data-testid="nav-dashboard-link"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      data-testid="nav-admin-link"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm" data-testid="login-link">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" data-testid="register-link">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
