import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function ForYou() {
    const [publicProjects, setPublicProjects] = useState([]);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const token = localStorage.getItem('token');

    // Fetch Public Projects (For You)
    useEffect(() => {
        const fetchPublicProjects = async () => {
            try {
                const response = await fetch(`${API_URL}/api/projects/public`);
                if (response.ok) {
                    const data = await response.json();
                    setPublicProjects(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPublicProjects();
    }, []);

    // Trending logic: Sort by likes + comments
    const trendingProjects = [...publicProjects]
        .sort((a, b) => {
            const scoreA = (a.likes_count || 0) + (a.comments_count || 0);
            const scoreB = (b.likes_count || 0) + (b.comments_count || 0);
            return scoreB - scoreA;
        })
        .slice(0, 5);
    const recentProjects = publicProjects;

    return (
        <div className="main-feed-container">
            {/* Hero Section */}
            <div className="hero-section">
                <h1>{t('welcome_message') || 'Welcome to QaraOke'}</h1>
                <p>{t('hero_subtitle') || 'Discover, Sing, and Share.'}</p>
                {!token && (
                    <button
                        onClick={() => navigate('/auth')}
                        className="hero-cta-btn"
                    >
                        {t('get_started') || 'Get Started'}
                    </button>
                )}
            </div>

            <div className="feed-content">
                {/* Trending Section */}
                {trendingProjects.length > 0 && (
                    <section className="feed-section">
                        <div className="section-title">
                            <i className="fas fa-fire" style={{ color: '#ef4444' }}></i>
                            {t('trending') || 'Trending'}
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
                <section className="feed-section">
                    <div className="section-title">
                        <i className="fas fa-clock" style={{ color: 'var(--brand-primary)' }}></i>
                        {t('recent_projects') || 'Recent Projects'}
                    </div>
                    <div className="projects-grid">
                        {recentProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                                isOwner={false}
                            />
                        ))}
                        {recentProjects.length === 0 && (
                            <p className="no-content-message">{t('no_public_projects') || 'No projects yet.'}</p>
                        )}
                    </div>
                </section>
            </div>

            <style>{`
                .main-feed-container {
                    padding-bottom: 80px;
                    max-width: 100%;
                    margin: auto;
                    color: var(--text-primary);
                }

                .hero-section {
                    background: linear-gradient(135deg, var(--brand-primary) 0%, var(--bg-main) 90%);
                    border-radius: 16px;
                    padding: 40px;
                    margin-bottom: 40px;
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                }

                .hero-section h1 {
                    font-size: 3rem;
                    margin: 0 0 10px 0;
                    font-weight: 800;
                }

                .hero-section p {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    max-width: 600px;
                    margin: 0;
                }
                
                .hero-cta-btn {
                    margin-top: 20px;
                    background-color: white;
                    color: black;
                    font-weight: bold;
                    padding: 12px 30px;
                    border-radius: 30px;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .hero-cta-btn:hover {
                    transform: scale(1.05);
                }

                .feed-content {
                    max-width: 1537px;
                    margin: 0 auto;
                }

                .feed-section {
                    margin-bottom: 40px;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--text-primary);
                }

                .trending-scroll-container {
                    display: flex;
                    gap: 20px;
                    overflow-x: auto;
                    padding-bottom: 20px;
                    scrollbar-width: thin;
                }

                .trending-card {
                    min-width: 250px;
                    width: 350px;
                    flex-shrink: 0;
                }

                .projects-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .no-content-message {
                    text-align: center;
                    color: var(--text-secondary);
                    margin-top: 20px;
                }

                @media (max-width: 877px) {
                    .hero-section {
                        padding: 20px;
                        margin-bottom: 30px;
                    }

                    .hero-section h1 {
                        font-size: 2rem;
                    }

                    .trending-card {
                        min-width: 200px;
                        width: 300px;
                    }
                }
            `}</style>
        </div>
    );
}

export default ForYou;
