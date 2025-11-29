import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function Following() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/auth');

            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch followed users
                const usersRes = await fetch(`${API_URL}/api/users/me/following`, { headers });
                if (usersRes.ok) {
                    setUsers(await usersRes.json());
                }

                // Fetch projects from followed users
                const projectsRes = await fetch(`${API_URL}/api/projects/following`, { headers });
                if (projectsRes.ok) {
                    setProjects(await projectsRes.json());
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    return (
        <div className="following-container">
            <div className="following-header">
                <button
                    onClick={() => navigate(-1)}
                    className="back-button"
                >
                    ←
                </button>
                <h1 className="following-title">{t('following') || 'Following'}</h1>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {/* Profiles Section - Horizontal Scroll */}
                    {users.length > 0 && (
                        <div className="profiles-scroll-container">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => navigate(`/user/${user.username}`)}
                                    className="profile-item"
                                >
                                    <div
                                        className="profile-avatar"
                                        style={{
                                            backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                                        }}
                                    >
                                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div className="profile-name-container">
                                        <p className="profile-name">
                                            {user.nickname || user.username}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Projects Feed - Vertical Layout */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'following' } })}
                                isOwner={false}
                            />
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="no-content-message">
                            {t('no_following') || 'You are not following anyone yet.'}
                        </div>
                    )}

                    {users.length > 0 && projects.length === 0 && (
                        <div className="no-content-message">
                            {t('no_posts_yet') || 'No posts from followed users yet.'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Following;
