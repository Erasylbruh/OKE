import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function LikedProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchLikedProjects = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/users/likes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                } else {
                    setError('Failed to fetch liked projects');
                }
            } catch (err) {
                console.error('Error fetching liked projects:', err);
                setError('Error connecting to server');
            } finally {
                setLoading(false);
            }
        };

        fetchLikedProjects();
    }, [navigate]);

    if (loading) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen pb-24 md:pb-10">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-800">
                <h1 className="text-3xl font-bold text-white m-0">{t('liked_projects') || 'Liked Projects'}</h1>
            </div>

            {error && (
                <div style={{ padding: '20px', backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {projects.length === 0 && !error ? (
                <div className="text-center text-neutral-500 mt-20">
                    <div className="text-6xl mb-6 opacity-50">❤️</div>
                    <h2 className="text-white text-2xl font-bold mb-3">{t('no_likes_yet') || 'No liked projects yet'}</h2>
                    <p className="mb-8 text-neutral-400">{t('no_likes_desc') || 'Projects you like will appear here.'}</p>
                    <button
                        onClick={() => navigate('/foryou')}
                        className="bg-[#1DB954] text-white font-bold py-3 px-8 rounded-full hover:bg-[#1ed760] transition-colors text-lg"
                    >
                        {t('explore_projects') || 'Explore Projects'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                            isOwner={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default LikedProjects;
