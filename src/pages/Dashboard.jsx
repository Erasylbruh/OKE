import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/auth');

            try {
                const response = await fetch(`${API_URL}/api/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data);
                } else {
                    localStorage.removeItem('token');
                    navigate('/auth');
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProjects();
    }, [navigate]);

    const handleCreateNew = async () => {
        if (!newProjectName.trim()) return;
        if (isCreating) return;

        const token = localStorage.getItem('token');
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newProjectName,
                    data: { lyrics: [], styles: { fontSize: 24, activeFontSize: 32, color: 'var(--text-primary)', fillColor: 'var(--brand-primary)', backgroundColor: 'var(--bg-main)', fontFamily: 'Inter, sans-serif' } }
                })
            });

            if (res.ok) {
                const data = await res.json();
                navigate(`/editor/${data.id}`);
            } else {
                const msg = await res.text();
                alert(`Failed to create project: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error creating project');
        } finally {
            setIsCreating(false);
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
            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{t('create_new_project')}</h2>
                        <input
                            type="text"
                            placeholder={t('project_name')}
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', padding: '8px 16px' }}>{t('cancel')}</button>
                            <button onClick={handleCreateNew} disabled={isCreating} className="primary">
                                {isCreating ? 'Creating...' : t('create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-hover)',
                        backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: '#888'
                    }}>
                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>{user.nickname || user.username}</h1>
                        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>
                            {projects.length} {t('projects')}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/following')}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            padding: '8px 16px',
                            borderRadius: '20px'
                        }}
                    >
                        {t('following') || 'Following'}
                    </button>
                    <button
                        onClick={() => navigate(`/user/${user.username}`)}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            padding: '8px 16px',
                            borderRadius: '20px'
                        }}
                    >
                        {t('profile') || 'Profile'}
                    </button>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid-3">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={{ ...project, username: user.username, nickname: user.nickname, avatar_url: user.avatar_url }}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        isOwner={true}
                        onToggleVisibility={handleToggleVisibility}
                        onDelete={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t('delete_confirm'))) {
                                const token = localStorage.getItem('token');
                                fetch(`${API_URL}/api/projects/${project.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                }).then(async res => {
                                    if (res.ok) {
                                        setProjects(projects.filter(p => p.id !== project.id));
                                    } else {
                                        const msg = await res.text();
                                        alert(`Failed to delete project: ${msg}`);
                                    }
                                }).catch(err => {
                                    console.error(err);
                                    alert('Error deleting project');
                                });
                            }
                        }}
                    />
                ))}
            </div>

            {projects.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '50px' }}>
                    <p>{t('no_projects')}</p>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fab"
            >
                +
            </button>
        </div>
    );
}

export default Dashboard;
