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
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Hero Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#333',
                        backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: '#888'
                    }}>
                        {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>{user.nickname || user.username}</h1>
                        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>@{user.username}</p>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <span><strong style={{ color: 'var(--text-main)' }}>{followersCount}</strong> {t('followers')}</span>
                            <span><strong style={{ color: 'var(--text-main)' }}>{followingCount}</strong> {t('following')}</span>
                            <span><strong style={{ color: 'var(--text-main)' }}>{projects.length}</strong> {t('projects')}</span>
                        </div>
                    </div>
                </div>

                {currentUser.id !== user.id ? (
                    <button
                        onClick={handleFollow}
                        className={isFollowing ? 'danger' : 'primary'}
                        style={{ borderRadius: '20px', padding: '8px 24px' }}
                    >
                        {isFollowing ? t('unfollow') : t('follow')}
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="primary"
                        style={{ borderRadius: '20px', padding: '8px 24px' }}
                    >
                        {t('my_dashboard')}
                    </button>
                )}
            </div>

            <div className="grid-3">
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
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '50px' }}>
                    <p>{t('no_public_projects')}</p>
                </div>
            )}
        </div>
    );
}

export default UserProfile;
