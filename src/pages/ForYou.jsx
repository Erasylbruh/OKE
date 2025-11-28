import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../components/LikeButton';
import ProjectCard from '../components/ProjectCard';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function ForYou() {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    const { t } = useLanguage();

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
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh' }}>
            <div className="foryou-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>{t('main')}</h1>
                {localStorage.getItem('token') ? (
                    <button onClick={() => navigate('/dashboard')}>{t('my_dashboard')}</button>
                ) : (
                    <button onClick={() => navigate('/auth')}>{t('login')}</button>
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
                {projects.length === 0 && <p>{t('no_public_projects')}</p>}
            </div>


        </div>
    );
}

export default ForYou;
