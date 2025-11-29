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

    // Mock trending logic: just take the first 5 projects for now
    const trendingProjects = projects.slice(0, 5);
    const recentProjects = projects;

    return (
        <div className="foryou-container" style={{ paddingBottom: '80px' }}>
            {/* Hero Section */}
            <div className="hero-section">
                <h1>{t('welcome_message') || 'Welcome to Gravity'}</h1>
                <p>{t('hero_subtitle') || 'Discover, create, and share amazing music projects.'}</p>
                {!localStorage.getItem('token') && (
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            marginTop: '20px',
                            backgroundColor: 'white',
                            color: 'black',
                            fontWeight: 'bold',
                            padding: '12px 30px',
                            borderRadius: '30px',
                            border: 'none'
                        }}
                    >
                        {t('get_started') || 'Get Started'}
                    </button>
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Trending Section */}
                {trendingProjects.length > 0 && (
                    <section>
                        <div className="section-title">
                            <i className="fas fa-fire" style={{ color: '#ff5500' }}></i>
                            {t('trending') || 'Trending Now'}
                        </div>
                        <div className="trending-scroll-container">
                            {trendingProjects.map((project) => (
                                <div key={project.id} className="trending-card">
                                    <ProjectCard
                                        project={project}
                                        onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                                        isOwner={false}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recent Projects Section */}
                <section>
                    <div className="section-title">
                        <i className="fas fa-clock" style={{ color: '#1db954' }}></i>
                        {t('recent_projects') || 'Recent Projects'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {recentProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                                isOwner={false}
                            />
                        ))}
                        {recentProjects.length === 0 && <p className="no-content-message">{t('no_public_projects')}</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ForYou;
