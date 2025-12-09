import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LikeButton from '../components/LikeButton';
import ProjectCard from '../components/ProjectCard';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function ForYou() {
    const [publicProjects, setPublicProjects] = useState([]);
    const [followedProjects, setFollowedProjects] = useState([]);
    const [followedUsers, setFollowedUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('foryou'); // 'foryou' or 'following'
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const token = localStorage.getItem('token');

    // Handle tab switching from navigation state
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

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

    // Fetch Followed Data (Following)
    useEffect(() => {
        if (activeTab === 'following' && token) {
            const fetchFollowedData = async () => {
                setLoading(true);
                try {
                    const headers = { 'Authorization': `Bearer ${token}` };

                    // Fetch followed users
                    const usersRes = await fetch(`${API_URL}/api/users/me/following`, { headers });
                    if (usersRes.ok) {
                        setFollowedUsers(await usersRes.json());
                    }

                    // Fetch projects from followed users
                    const projectsRes = await fetch(`${API_URL}/api/projects/following`, { headers });
                    if (projectsRes.ok) {
                        setFollowedProjects(await projectsRes.json());
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchFollowedData();
        }
    }, [activeTab, token]);

    // Mock trending logic for Public tab
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
        <div className="foryou-container" style={{ paddingBottom: '80px', maxWidth: '100%', margin: 'auto' }}>
            {/* Hero Section */}
            <div className="hero-section">
                <h1>{t('welcome_message')}</h1>
                <p>{t('hero_subtitle')}</p>
                {!token && (
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

            <div style={{ maxWidth: '1537px', margin: '0 auto' }}>

                {/* Tab Switcher */}
                <div className="tab-switcher">
                    <button
                        className={`tab-button ${activeTab === 'foryou' ? 'active' : ''}`}
                        onClick={() => setActiveTab('foryou')}
                    >
                        {t('for_you') || 'For You'}
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
                        onClick={() => setActiveTab('following')}
                    >
                        {t('following') || 'Following'}
                    </button>
                </div>

                {/* Content based on Active Tab */}
                {activeTab === 'foryou' ? (
                    <>
                        {/* Trending Section */}
                        {trendingProjects.length > 0 && (
                            <section>
                                <div className="section-title">
                                    <i className="fas fa-fire" style={{ color: '#ff5500' }}></i>
                                    {t('trending')}
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
                                {t('recent_projects')}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                    </>
                ) : (
                    /* Following Tab Content */
                    <>
                        {!token ? (
                            <div className="no-content-message">
                                <p>{t('login_to_see_following')}</p>
                                <button
                                    onClick={() => navigate('/auth')}
                                    style={{ marginTop: '10px', padding: '10px 20px' }}
                                >
                                    {t('login')}
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="no-content-message">Loading...</div>
                        ) : (
                            <>
                                {/* Followed Users (Horizontal Scroll) */}
                                {followedUsers.length > 0 && (
                                    <section>
                                        <div className="section-title">
                                            <i className="fas fa-user-friends" style={{ color: '#1db954' }}></i>
                                            {t('creators_you_follow')}
                                        </div>
                                        <div className="profiles-scroll-container">
                                            {followedUsers.map(user => (
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
                                    </section>
                                )}

                                {/* Followed Projects List */}
                                <section>
                                    <div className="section-title">
                                        <i className="fas fa-rss" style={{ color: '#1db954' }}></i>
                                        {t('latest_from_following')}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {followedProjects.map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                                                isOwner={false}
                                            />
                                        ))}
                                    </div>

                                    {followedUsers.length === 0 && (
                                        <div className="no-content-message">
                                            {t('no_following')}
                                        </div>
                                    )}

                                    {followedUsers.length > 0 && followedProjects.length === 0 && (
                                        <div className="no-content-message">
                                            {t('no_posts_yet')}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ForYou;
