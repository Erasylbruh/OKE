import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ForYou from './pages/ForYou';
import AdminDashboard from './pages/AdminDashboard';
import Editor from './pages/Editor';
import './App.css';

import LikedProjects from './pages/LikedProjects';
import AdminLoginModal from './components/AdminLoginModal';
import { useState, useEffect } from 'react';

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === '7' || e.code === 'Numpad7')) {
        e.preventDefault();
        setShowAdminLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Router>
      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} />}
      <Routes>
        <Route path="/" element={<ForYou />} />
        <Route path="/foryou" element={<ForYou />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/editor/:id?" element={<Editor />} />
        <Route path="/liked-projects" element={<LikedProjects />} />
      </Routes>
    </Router>
  );
}

export default App;
