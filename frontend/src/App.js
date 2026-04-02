import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GolfYardCanvas } from './components/GolfYardCanvas';
import { GolfPreloader } from './components/GolfPreloader';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CharitiesPage } from './pages/CharitiesPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CelebrationDemo } from './pages/CelebrationDemo';
import { GameDemo } from './pages/GameDemo';
import { Toaster } from './components/ui/sonner';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSeenPreloader = sessionStorage.getItem('hasSeenPreloader');
    if (hasSeenPreloader) {
      setLoading(false);
    }
  }, []);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem('hasSeenPreloader', 'true');
    setLoading(false);
  };

  return (
    <ThemeProvider>
      {loading ? (
        <GolfPreloader onComplete={handlePreloaderComplete} />
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <div className="App min-h-screen bg-background text-foreground relative">
              <GolfYardCanvas />
              <div className="relative z-10">
                <Navbar />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/charities" element={<CharitiesPage />} />
                  <Route path="/celebration-demo" element={<CelebrationDemo />} />
                  <Route path="/game-demo" element={<GameDemo />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster richColors position="top-right" />
              </div>
            </div>
          </AuthProvider>
        </BrowserRouter>
      )}
    </ThemeProvider>
  );
}

export default App;
