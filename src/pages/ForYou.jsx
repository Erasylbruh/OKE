import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ForYou() {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPublicProjects = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/projects/public');
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
                <button onClick={() => navigate('/dashboard')}>My Dashboard</button>
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
                        {/* Left Column: Avatar & Nickname */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5em',
                                color: 'white',
                                marginBottom: '5px'
                            }}>
                                {project.avatar_url ? (
                                    <img
                                        src={project.avatar_url}
                                        alt="avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span>{project.username?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#ccc' }}>
                                {project.nickname || project.username}
                            </span>
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
                    </div>
                ))}
                {projects.length === 0 && <p>No public projects yet.</p>}
            </div>
        </div>
    );
}

export default ForYou;
