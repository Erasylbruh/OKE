import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function UserProfile() {
    const { username } = useParams();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const { t } = useLanguage();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await fetch(`${API_URL}/api/users/${username}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setProjects(data.projects);
                    setIsFollowing(data.isFollowing);
                    setFollowersCount(data.followersCount);
                    setFollowingCount(data.followingCount);
                } else {
                    // Handle 404
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    const handleFollow = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/auth');

        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const res = await fetch(`${API_URL}/api/users/${user.id}/follow`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setIsFollowing(!isFollowing);
                setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;
    if (!user) return <div style={{ color: 'white', padding: '20px' }}>{t('user_not_found')}</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen pb-24 md:pb-10">
            {/* Hero Section */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-800">
                <div className="flex items-center gap-6">
                    <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#333] bg-cover bg-center flex items-center justify-center text-3xl md:text-4xl text-[#888] font-bold shadow-xl border-2 border-neutral-800"
                        style={{
                            backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                        }}
                    >
                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h1 className="m-0 text-3xl md:text-4xl font-black text-white">{user.nickname || user.username}</h1>
                        <p className="text-neutral-400 mt-1">@{user.username}</p>
                        <div className="flex gap-6 mt-3 text-sm text-neutral-400">
                            <span><strong className="text-white">{followersCount}</strong> {t('followers')}</span>
                            <span><strong className="text-white">{followingCount}</strong> {t('following')}</span>
                            <span><strong className="text-white">{projects.length}</strong> {t('projects')}</span>
                        </div>
                    </div>
                </div>

                {currentUser.id !== user.id ? (
                    <button
                        onClick={handleFollow}
                        className={`rounded-full px-6 py-2 font-bold transition-colors border-none ${isFollowing ? 'bg-transparent border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444]/10' : 'bg-[#1DB954] text-white hover:bg-[#1ed760]'}`}
                    >
                        {isFollowing ? t('unfollow') : t('follow')}
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-[#1DB954] text-white font-bold rounded-full px-6 py-2 hover:bg-[#1ed760] transition-colors border-none"
                    >
                        {t('my_dashboard')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={{ ...project, username: user.username, nickname: user.nickname, avatar_url: user.avatar_url }}
                        onClick={() => navigate(`/editor/${project.id}`, { state: { from: 'main' } })}
                        isOwner={false}
                    />
                ))}
            </div>

            {projects.length === 0 && (
                <div className="text-center text-neutral-500 mt-20">
                    <p>{t('no_public_projects')}</p>
                </div>
            )}
        </div>
    );
}

export default UserProfile;
