import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
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
                    data: { lyrics: [], styles: { fontSize: 24, activeFontSize: 32, color: '#ffffff', fillColor: '#1db954', backgroundColor: '#121212', fontFamily: 'Inter, sans-serif' } }
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
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24 md:pb-10 min-h-screen">
            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]">
                    <div className="bg-[#1E1E1E] p-8 rounded-2xl w-[90%] max-w-[400px] flex flex-col gap-6 border border-[#333] shadow-2xl">
                        <h2 className="m-0 text-xl font-bold text-white">{t('create_new_project')}</h2>
                        <input
                            type="text"
                            placeholder={t('project_name')}
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            autoFocus
                            className="bg-[#121212] border border-[#333] rounded-lg p-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="bg-transparent border border-[#555] text-white py-2 px-4 rounded hover:bg-[#333] transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleCreateNew}
                                disabled={isCreating}
                                className="bg-[#1DB954] border-none text-white py-2 px-4 rounded font-bold hover:bg-[#1ed760] transition-colors disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : t('create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="flex items-end justify-between mb-10 pb-6 border-b border-neutral-800">
                <div className="flex items-center gap-6">
                    <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#333] bg-cover bg-center flex items-center justify-center text-3xl md:text-4xl text-[#888] font-bold shadow-xl border-2 border-neutral-800"
                        style={{
                            backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                        }}
                    >
                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h1 className="m-0 text-3xl md:text-4xl font-black text-white">{user.nickname || user.username}</h1>
                        <p className="text-neutral-400 mt-2 font-medium">
                            {projects.length} {t('projects')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/following')}
                        className="bg-transparent border border-neutral-700 text-neutral-300 py-2 px-4 rounded-full text-sm font-bold hover:border-white hover:text-white transition-all"
                    >
                        {t('following') || 'Following'}
                    </button>
                    <button
                        onClick={() => navigate(`/user/${user.username}`)}
                        className="bg-transparent border border-neutral-700 text-neutral-300 py-2 px-4 rounded-full text-sm font-bold hover:border-white hover:text-white transition-all"
                    >
                        {t('profile') || 'Profile'}
                    </button>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="text-center text-neutral-500 mt-20">
                    <p>{t('no_projects')}</p>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-24 right-5 md:bottom-10 md:right-10 w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-3xl shadow-xl hover:scale-110 transition-transform text-black pb-1 z-50 cursor-pointer border-none"
            >
                +
            </button>
        </div>
    );
}

export default Dashboard;
