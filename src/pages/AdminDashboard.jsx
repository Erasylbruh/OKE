import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'projects'
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!currentUser.is_admin) {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [navigate, activeTab]);

    const fetchData = async (query = '') => {
        const token = localStorage.getItem('token');
        try {
            if (activeTab === 'users') {
                const res = await fetch(`${API_URL}/api/admin/users?search=${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setUsers(await res.json());
                }
            } else {
                const res = await fetch(`${API_URL}/api/admin/projects?search=${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(Array.isArray(data) ? data : []);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchData(e.target.value);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure? This will delete the user and ALL their projects.')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProjects(projects.filter(p => p.id !== projectId));
            } else {
                alert('Failed to delete project');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Admin Dashboard</h1>
                <button onClick={() => navigate('/dashboard')}>Back to App</button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        backgroundColor: activeTab === 'users' ? '#1db954' : '#444',
                        color: activeTab === 'users' ? 'black' : 'white',
                        border: 'none', padding: '10px 20px', borderRadius: '20px'
                    }}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    style={{
                        backgroundColor: activeTab === 'projects' ? '#1db954' : '#444',
                        color: activeTab === 'projects' ? 'black' : 'white',
                        border: 'none', padding: '10px 20px', borderRadius: '20px'
                    }}
                >
                    Projects
                </button>
            </div>

            <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={handleSearch}
                style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#282828', color: 'white' }}
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#282828', borderRadius: '8px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                        <th style={{ padding: '15px' }}>ID</th>
                        {activeTab === 'users' ? (
                            <>
                                <th style={{ padding: '15px' }}>Username</th>
                                <th style={{ padding: '15px' }}>Nickname</th>
                                <th style={{ padding: '15px' }}>Admin</th>
                            </>
                        ) : (
                            <>
                                <th style={{ padding: '15px' }}>Project Name</th>
                                <th style={{ padding: '15px' }}>Owner</th>
                                <th style={{ padding: '15px' }}>Created At</th>
                            </>
                        )}
                        <th style={{ padding: '15px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {activeTab === 'users' ? users.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '15px' }}>{user.id}</td>
                            <td style={{ padding: '15px' }}>{user.username}</td>
                            <td style={{ padding: '15px' }}>{user.nickname || '-'}</td>
                            <td style={{ padding: '15px' }}>{user.is_admin ? 'Yes' : 'No'}</td>
                            <td style={{ padding: '15px' }}>
                                {!user.is_admin && (
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        style={{ backgroundColor: '#ff4444', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    )) : projects.map(project => (
                        <tr key={project.id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '15px' }}>{project.id}</td>
                            <td style={{ padding: '15px' }}>{project.name}</td>
                            <td style={{ padding: '15px' }}>{project.username}</td>
                            <td style={{ padding: '15px' }}>{new Date(project.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '15px' }}>
                                <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    style={{ backgroundColor: '#ff4444', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDashboard;
