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
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0 }}>{t('following') || 'Following'}</h1>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {/* Profiles Section - Horizontal Scroll */}
                    {users.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            overflowX: 'auto',
                            paddingBottom: '20px',
                            marginBottom: '40px',
                            scrollbarWidth: 'thin'
                        }}>
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => navigate(`/user/${user.username}`)}
                                    style={{
                                        minWidth: '100px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '50%',
                                        backgroundColor: '#333',
                                        backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        color: '#888',
                                        border: '2px solid var(--primary)'
                                    }}>
                                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                                            {user.nickname || user.username}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Projects Feed */}
                    <div className="grid-3">
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
                        <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                            {t('no_following') || 'You are not following anyone yet.'}
                        </div>
                    )}

                    {users.length > 0 && projects.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                            {t('no_posts_yet') || 'No posts from followed users yet.'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Following;
