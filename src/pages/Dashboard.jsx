import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';
import { GridSkeleton } from '../components/LoadingSkeleton';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function Dashboard() {
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    // Fetch projects with React Query
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', 'user'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                throw new Error('No token');
            }

            const response = await fetch(`${API_URL}/api/projects`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                return response.json();
            } else {
                localStorage.removeItem('token');
                navigate('/auth');
                throw new Error('Unauthorized');
            }
        },
        retry: false,
        onError: (err) => {
            toast.error('Failed to load projects');
        }
    });

    // Create project mutation
    const createProjectMutation = useMutation({
        mutationFn: async (name) => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    data: {
                        lyrics: [],
                        styles: {
                            fontSize: 24,
                            activeFontSize: 32,
                            color: 'var(--text-primary)',
                            fillColor: 'var(--brand-primary)',
                            backgroundColor: 'var(--bg-main)',
                            fontFamily: 'Inter, sans-serif'
                        }
                    }
                })
            });

            if (res.ok) {
                return res.json();
            } else {
                const msg = await res.text();
                throw new Error(msg);
            }
        },
        onSuccess: (data) => {
            toast.success('Project created!');
            navigate(`/editor/${data.id}`);
        },
        onError: (err) => {
            toast.error(`Failed to create project: ${err.message}`);
        }
    });

    const handleCreateNew = () => {
        if (!newProjectName.trim()) return;
        createProjectMutation.mutate(newProjectName);
        setShowCreateModal(false);
        setNewProjectName('');
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
                toast.success(newStatus ? 'Project is now public' : 'Project is now private');
            } else {
                toast.error('Failed to update visibility');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating visibility');
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
                {isLoading ? (
                    <GridSkeleton count={6} />
                ) : (
                    projects.map((project) => (
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
                                    const deletePromise = fetch(`${API_URL}/api/projects/${project.id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    }).then(async res => {
                                        if (res.ok) {
                                            setProjects(projects.filter(p => p.id !== project.id));
                                            return 'Project deleted';
                                        } else {
                                            const msg = await res.text();
                                            throw new Error(msg);
                                        }
                                    });

                                    toast.promise(deletePromise, {
                                        loading: 'Deleting...',
                                        success: (msg) => msg,
                                        error: (err) => `Failed: ${err.message}`
                                    });
                                }
                            }}
                        />
                    ))
                )}
            </div>

            {!isLoading && projects.length === 0 && (
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
