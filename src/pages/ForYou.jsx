import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../components/LikeButton';
import ProjectCard from '../components/ProjectCard';
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
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                        isOwner={false}
                    />
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
