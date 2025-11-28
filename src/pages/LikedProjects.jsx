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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <h1 style={{ margin: 0 }}>{t('liked_projects') || 'Liked Projects'}</h1>
            </div>

            {error && (
                <div style={{ padding: '20px', backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {projects.length === 0 && !error ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '80px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>❤️</div>
                    <h2 style={{ color: 'white', marginBottom: '10px' }}>{t('no_likes_yet') || 'No liked projects yet'}</h2>
                    <p style={{ marginBottom: '30px' }}>{t('no_likes_desc') || 'Projects you like will appear here.'}</p>
                    <button
                        onClick={() => navigate('/foryou')}
                        className="primary"
                        style={{ padding: '12px 30px', borderRadius: '30px', fontSize: '1.1rem' }}
                    >
                        {t('explore_projects') || 'Explore Projects'}
                    </button>
                </div>
            ) : (
                <div className="grid-3">
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
