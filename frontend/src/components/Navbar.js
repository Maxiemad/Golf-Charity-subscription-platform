import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { User, LogOut, LayoutDashboard, Shield, ArrowLeft, ArrowUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const showBackButton = !['/','/ login', '/register'].includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="hover:bg-white/5"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink-600 rounded-lg blur opacity-75"></div>
                <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-pink-600 rounded-lg flex items-center justify-center shadow-xl">
                  <ArrowUp className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xl font-outfit font-bold tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Uplift</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/charities"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
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
