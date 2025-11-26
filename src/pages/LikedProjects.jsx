import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../components/LikeButton';

function LikedProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLikedProjects = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                return;
            }

            try {
                const res = await fetch('/api/users/likes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (err) {
                console.error('Error fetching liked projects:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLikedProjects();
    }, [navigate]);

    if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Loading...</div>;

    return (
        <div className="liked-projects-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    ← Back to Dashboard
                </button>
                <h1 style={{ margin: 0, color: '#fff' }}>Liked Projects</h1>
            </div>

            {projects.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                    <p>You haven't liked any projects yet.</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            marginTop: '10px',
                            background: '#1db954',
                            border: 'none',
                            color: '#fff',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Explore Projects
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/editor/${project.id}`)}
                            style={{
                                backgroundColor: '#1e1e1e',
                                borderRadius: '12px',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, background-color 0.2s',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.backgroundColor = '#282828';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.backgroundColor = '#1e1e1e';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>{project.name}</h3>
                                <LikeButton projectId={project.id} initialLiked={true} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#333',
                                    backgroundImage: project.avatar_url ? `url(${project.avatar_url})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }} />
                                <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                                    {project.nickname || project.username}
                                </span>
                            </div>

                            <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                Liked on {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LikedProjects;
