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
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto pb-24 md:pb-10 min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#134e28] to-[#121212] p-10 rounded-3xl mb-10 shadow-lg border border-white/5 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                        {t('welcome_message')}
                    </h1>
                    <p className="text-neutral-300 text-lg md:text-xl max-w-2xl font-medium">
                        {t('hero_subtitle')}
                    </p>
                    {!token && (
                        <button
                            onClick={() => navigate('/auth')}
                            className="mt-8 bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-xl"
                        >
                            {t('get_started') || 'Get Started'}
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full">

                {/* Tab Switcher */}
                {/* Tab Switcher */}
                <div className="flex gap-8 mb-8 border-b border-neutral-800">
                    <button
                        className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === 'foryou' ? 'border-[#1db954] text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}
                        onClick={() => setActiveTab('foryou')}
                    >
                        {t('for_you') || 'For You'}
                    </button>
                    <button
                        className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === 'following' ? 'border-[#1db954] text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}
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
                            <section className="mb-12">
                                <div className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                    <i className="fas fa-fire text-[#ff5500]"></i>
                                    {t('trending')}
                                </div>
                                <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                                    {trendingProjects.map((project) => (
                                        <div key={project.id} className="min-w-[300px] md:min-w-[350px] snap-center">
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
                        <section className="mb-12">
                            <div className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <i className="fas fa-clock text-[#1db954]"></i>
                                {t('recent_projects')}
                            </div>
                            <div className="flex flex-col gap-4">
                                {recentProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                                        isOwner={false}
                                    />
                                ))}
                                {recentProjects.length === 0 && <p className="text-center text-neutral-500 py-10">{t('no_public_projects')}</p>}
                            </div>
                        </section>
                    </>
                ) : (
                    /* Following Tab Content */
                    <>
                        {!token ? (
                            <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-neutral-800">
                                <p className="text-neutral-400 mb-4">{t('login_to_see_following')}</p>
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-6 py-2 bg-[#1DB954] text-white font-bold rounded-full hover:bg-[#1ed760] transition-colors"
                                >
                                    {t('login')}
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-20 text-neutral-500">Loading...</div>
                        ) : (
                            <>
                                {/* Followed Users (Horizontal Scroll) */}
                                {followedUsers.length > 0 && (
                                    <section className="mb-10">
                                        <div className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                            <i className="fas fa-user-friends text-[#1db954]"></i>
                                            {t('creators_you_follow')}
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                            {followedUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => navigate(`/user/${user.username}`)}
                                                    className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
                                                >
                                                    <div
                                                        className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold border-2 border-transparent group-hover:border-[#1db954] transition-all object-cover bg-cover bg-center shadow-md relative overflow-hidden"
                                                        style={{
                                                            backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                                                        }}
                                                    >
                                                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div className="w-full text-center">
                                                        <p className="text-xs text-neutral-400 group-hover:text-white truncate max-w-[80px]">
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
                                    <div className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <i className="fas fa-rss text-[#1db954]"></i>
                                        {t('latest_from_following')}
                                    </div>
                                    <div className="flex flex-col gap-4">
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
                                        <div className="text-center py-20 text-neutral-500">
                                            {t('no_following')}
                                        </div>
                                    )}

                                    {followedUsers.length > 0 && followedProjects.length === 0 && (
                                        <div className="text-center py-20 text-neutral-500">
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
