import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import ProjectCard from '../components/features/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function ForYou() {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        client.get('/api/projects/public').then(data => {
            if (data) setProjects(data);
        });
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
            <h1 style={{ marginBottom: '30px' }}>{t('for_you')}</h1>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => navigate(`/editor/${project.id}`)}
                    />
                ))}
            </div>
        </div>
    );
}

export default ForYou;