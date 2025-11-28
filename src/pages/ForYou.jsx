import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../components/LikeButton';
import API_URL from '../config';

function ForYou() {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPublicProjects = async () => {
            try {
                const response = await fetch(`${API_URL}/api/projects/public`);
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPublicProjects();
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Main</h1>
                {localStorage.getItem('token') ? (
                    <button onClick={() => navigate('/dashboard')}>My Dashboard</button>
                ) : (
                    <button onClick={() => navigate('/auth')}>Login</button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                        style={{
                            padding: '15px',
                            backgroundColor: '#282828', // Dark Gray
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'row', // Row layout
                            alignItems: 'center',
                            gap: '20px',
                            color: '#fff' // White text
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {/* Left Column: Preview Image & User Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', gap: '10px' }}>
                            {/* Project Preview Image (Large Circle) */}
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5em',
                                color: 'white',
                                border: '2px solid #333'
                            }}>
                                {project.preview_url ? (
                                    <img
                                        src={project.preview_url}
                                        alt="preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1db954, #191414)' }} />
                                )}
                            </div>

                            {/* User Info (Small Avatar + Nickname) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#555'
                                }}>
                                    {project.avatar_url ? (
                                        <img
                                            src={project.avatar_url}
                                            alt="avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6em' }}>
                                            {project.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ccc' }}>
                                    {project.nickname || project.username}
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Project Name */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1.2em',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#fff'
                            }}>
                                {project.name}
                            </h3>
                            <span style={{ fontSize: '0.7em', color: '#888' }}>
                                {new Date(project.updated_at).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Like Button */}
                        {/* Like Button */}
                        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                            {project.id && <LikeButton projectId={project.id} />}
                        </div>
                    </div>
                ))}
                {projects.length === 0 && <p>No public projects yet.</p>}
            </div>

            {/* Debug Info */}
            <div style={{ marginTop: '50px', padding: '10px', background: '#333', color: '#0f0', fontFamily: 'monospace', fontSize: '12px' }}>
                <p>DEBUG INFO:</p>
                <p>API_URL: {API_URL}</p>
                <p>Token Present: {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
            </div>
        </div>
    );
}

export default ForYou;
