import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import ProjectCard from '../components/features/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function UserProfile() {
    const { username } = useParams();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await client.get(`/api/users/${username}`);
            if (data) {
                setUser(data);
                setProjects(data.projects);
                setIsFollowing(data.isFollowing);
            }
        };
        fetchProfile();
    }, [username]);

    const handleFollow = async () => {
        if (!currentUser.id) return navigate('/auth');
        const endpoint = `/api/users/${user.id}/follow`;
        try {
            if (isFollowing) await client.delete(endpoint);
            else await client.post(endpoint);
            setIsFollowing(!isFollowing);
        } catch (e) {
            console.error(e);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="user-avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                        {user.avatar_url ? <img src={user.avatar_url} /> : (user.nickname?.[0] || '?')}
                    </div>
                    <div>
                        <h1>{user.nickname || user.username}</h1>
                        <p style={{ color: '#888' }}>@{user.username}</p>
                    </div>
                </div>
                {currentUser.id !== user.id && (
                    <button onClick={handleFollow} className={isFollowing ? '' : 'primary'} style={{ padding: '10px 20px', borderRadius: '20px' }}>
                        {isFollowing ? t('unfollow') : t('follow')}
                    </button>
                )}
            </div>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map(p => (
                    <ProjectCard key={p.id} project={{ ...p, username: user.username, nickname: user.nickname, avatar_url: user.avatar_url }} onClick={() => navigate(`/editor/${p.id}`)} />
                ))}
            </div>
        </div>
    );
}

export default UserProfile;