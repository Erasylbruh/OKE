import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import ProjectCard from '../components/features/ProjectCard';
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
            const data = await client.get('/api/projects');
            if (data) setProjects(data);
        };
        fetchProjects();
    }, []);

    const handleCreateNew = async () => {
        if (!newProjectName.trim() || isCreating) return;
        setIsCreating(true);
        try {
            const data = await client.post('/api/projects', {
                name: newProjectName,
                data: { lyrics: [], styles: { fontSize: 24, activeFontSize: 32, color: '#ffffff', fillColor: '#1db954', backgroundColor: '#121212', fontFamily: 'Inter, sans-serif' } }
            });
            if (data) {
                navigate(`/editor/${data.id}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error creating project');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e, project) => {
        e.stopPropagation();
        if (!window.confirm(t('delete_confirm'))) return;

        try {
            await client.delete(`/api/projects/${project.id}`);
            setProjects(projects.filter(p => p.id !== project.id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete project');
        }
    };

    const handleToggleVisibility = async (e, project) => {
        e.stopPropagation();
        try {
            await client.patch(`/api/projects/${project.id}/visibility`, { is_public: !project.is_public });
            setProjects(projects.map(p => p.id === project.id ? { ...p, is_public: !p.is_public } : p));
        } catch (err) {
            console.error(err);
            alert('Failed to update visibility');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Create Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{t('create_new_project')}</h2>
                        <input
                            type="text"
                            className="dark-input"
                            placeholder={t('project_name')}
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', padding: '8px 16px', borderRadius: '4px' }}>{t('cancel')}</button>
                            <button onClick={handleCreateNew} disabled={isCreating} className="primary" style={{ borderRadius: '4px' }}>
                                {isCreating ? '...' : t('create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="user-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                        {user.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>{user.nickname || user.username}</h1>
                        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>{projects.length} {t('projects')}</p>
                    </div>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="primary" style={{ borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>

            {/* Grid */}
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={{ ...project, username: user.username, nickname: user.nickname, avatar_url: user.avatar_url }}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        isOwner={true}
                        onToggleVisibility={handleToggleVisibility}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {projects.length === 0 && <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>{t('no_projects')}</div>}
        </div>
    );
}

export default Dashboard;