import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ForYou from './pages/ForYou';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import UserProfile from './pages/UserProfile';
import LikedProjects from './pages/LikedProjects';
import Editor from './pages/Editor';

import AdminLoginModal from './components/AdminLoginModal';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { LanguageProvider } from './context/LanguageContext';

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
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} />}
          <Layout>
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
          </Layout>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
