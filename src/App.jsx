import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Lazy load page components for better performance
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ForYou = lazy(() => import('./pages/ForYou'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const LikedProjects = lazy(() => import('./pages/LikedProjects'));
const Editor = lazy(() => import('./pages/Editor'));

import AdminLoginModal from './components/AdminLoginModal';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import { GridSkeleton } from './components/LoadingSkeleton';
import { LanguageProvider } from './context/LanguageContext';
import toast, { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './utils/queryClient';

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)'
  }}>
    <div style={{ maxWidth: '1200px', width: '100%', padding: '20px' }}>
      <GridSkeleton count={6} />
    </div>
  </div>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/auth') {
    return <div className="auth-layout">{children}</div>;
  }

  // Editor takes full width without sidebar or bottom nav
  if (path.startsWith('/editor')) {
    return <>{children}</>;
  }



  // Default: Sidebar + Main Content
  return (
    <>
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
      <BottomNav />
    </>
  );
};

import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const pressedKeys = new Set();

    const handleKeyDown = (e) => {
      pressedKeys.add(e.code);
      if (pressedKeys.has('Numpad6') && pressedKeys.has('Numpad9')) {
        e.preventDefault();
        setShowAdminLogin(true);
        pressedKeys.clear(); // Reset after triggering
      }
    };

    const handleKeyUp = (e) => {
      pressedKeys.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <Router>
              {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} />}

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--brand-primary)',
                      secondary: 'var(--bg-surface)',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--danger)',
                      secondary: 'var(--bg-surface)',
                    },
                    duration: 5000,
                  },
                  loading: {
                    iconTheme: {
                      primary: 'var(--brand-primary)',
                      secondary: 'var(--bg-surface)',
                    },
                  },
                }}
              />

              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ForYou />} />
                    <Route path="/foryou" element={<ForYou />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/profile" element={<EditProfile />} />
                    <Route path="/user/:username" element={<UserProfile />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/editor/:id?" element={<Editor />} />
                    <Route path="/liked-projects" element={<LikedProjects />} />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
