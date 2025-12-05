import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import ProjectCard from '../components/features/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const navigate = useNavigate();
    const { t } = useLanguage();

    const fetchData = React.useCallback(async (query = '') => {
        try {
            if (activeTab === 'users') {
                const data = await client.get(`/api/admin/users?search=${query}`);
                if (data) setUsers(data);
            } else {
                const data = await client.get(`/api/admin/projects?search=${query}`);
                if (data) setProjects(data);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchData(e.target.value);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure? This will delete the user and ALL their projects.')) return;
        try {
            await client.delete(`/api/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await client.delete(`/api/projects/${projectId}`);
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (err) {
            alert('Failed to delete project');
        }
    };

    const handleToggleVisibility = async (e, project) => {
        e.stopPropagation();
        try {
            await client.patch(`/api/projects/${project.id}/visibility`, { is_public: !project.is_public });
            setProjects(projects.map(p => p.id === project.id ? { ...p, is_public: !project.is_public } : p));
        } catch (err) {
            alert('Failed to update visibility');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px' }}>{t('admin_dashboard')}</h1>

            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
                <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'primary' : ''} style={{ borderRadius: '20px', padding: '10px 24px', background: activeTab !== 'users' ? '#333' : '' }}>
                    {t('users')}
                </button>
                <button onClick={() => setActiveTab('projects')} className={activeTab === 'projects' ? 'primary' : ''} style={{ borderRadius: '20px', padding: '10px 24px', background: activeTab !== 'projects' ? '#333' : '' }}>
                    {t('projects')}
                </button>
            </div>

            <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={handleSearch}
                className="dark-input"
                style={{ maxWidth: '400px', marginBottom: '30px', borderRadius: '24px' }}
            />

            {activeTab === 'users' ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>ID</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>Username</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>Admin</th>
                                <th style={{ padding: '20px', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '20px' }}>{user.id}</td>
                                    <td style={{ padding: '20px', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '20px' }}>
                                        {user.is_admin ? <span style={{ color: '#1db954' }}>Yes</span> : <span style={{ color: '#666' }}>No</span>}
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        {!user.is_admin && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="delete-btn" style={{ color: '#ff4444', opacity: 1 }}>
                                                {t('delete')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => navigate(`/editor/${project.id}`)}
                            isOwner={true}
                            onToggleVisibility={handleToggleVisibility}
                            onDelete={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;