import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ForYou from './pages/ForYou';
import AdminDashboard from './pages/AdminDashboard';
import Editor from './pages/Editor';
import './App.css';

import LikedProjects from './pages/LikedProjects';

function App() {
  return (
    <Router>
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
