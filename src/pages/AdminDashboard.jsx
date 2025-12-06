import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'projects'
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const { t } = useLanguage();

    const fetchData = React.useCallback(async (query = '') => {
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
    }, [activeTab]);

    useEffect(() => {
        if (!currentUser.is_admin) {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [navigate, currentUser.is_admin, fetchData]);

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

    const handleToggleVisibility = async (e, project) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        const newStatus = !project.is_public;

        try {
            const res = await fetch(`${API_URL}/api/projects/${project.id}/visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_public: newStatus })
            });

            if (res.ok) {
                setProjects(projects.map(p =>
                    p.id === project.id ? { ...p, is_public: newStatus } : p
                ));
            } else {
                alert('Failed to update visibility');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating visibility');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0 }}>{t('admin_dashboard')}</h1>
            </div>

            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    className={activeTab === 'users' ? 'primary' : 'secondary'}
                    style={{ borderRadius: '20px', padding: '10px 24px' }}
                >
                    {t('users') || 'Users'}
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    className={activeTab === 'projects' ? 'primary' : 'secondary'}
                    style={{ borderRadius: '20px', padding: '10px 24px' }}
                >
                    {t('projects') || 'Projects'}
                </button>
            </div>

            <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={handleSearch}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '48px',
                    padding: '0 20px',
                    marginBottom: '30px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '16px'
                }}
            />

            {activeTab === 'users' ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>ID</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>{t('username')}</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>Nickname</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>Admin</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '20px' }}>{user.id}</td>
                                    <td style={{ padding: '20px', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '20px' }}>{user.nickname || '-'}</td>
                                    <td style={{ padding: '20px' }}>
                                        {user.is_admin ? (
                                            <span style={{ color: '#1db954', fontWeight: 'bold' }}>Yes</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>No</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        {!user.is_admin && (
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="danger"
                                                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                                            >
                                                {t('delete')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid-3">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => navigate(`/editor/${project.id}`)}
                            isOwner={true}
                            onToggleVisibility={handleToggleVisibility}
                            onDelete={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                            }}
                        />
                    ))}
                    {projects.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No projects found.</p>}
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
