import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import ProjectCard from '../components/ProjectCard';

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
                    // Handle 404 or other errors
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
    if (!user) return <div style={{ color: 'white', padding: '20px' }}>User not found</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Back</button>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '30px', borderRadius: '12px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #1db954' }}>
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3em' }}>
                            {user.username[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>{user.nickname || user.username}</h1>
                    <p style={{ color: '#888', margin: '0 0 20px 0', fontSize: '1.2em' }}>@{user.username}</p>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div><strong>{followersCount}</strong> Followers</div>
                        <div><strong>{followingCount}</strong> Following</div>
                        <div><strong>{projects.length}</strong> Projects</div>
                    </div>

                    {currentUser.id !== user.id && (
                        <button
                            onClick={handleFollow}
                            style={{
                                padding: '10px 30px',
                                backgroundColor: isFollowing ? 'transparent' : '#1db954',
                                color: isFollowing ? 'white' : 'black',
                                border: isFollowing ? '1px solid white' : 'none',
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1em'
                            }}
                        >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>

            <h2>Public Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={{ ...project, username: user.username, nickname: user.nickname, avatar_url: user.avatar_url }} // Pass user info
                        onClick={() => navigate(`/editor/${project.id}`)}
                        isOwner={false}
                    />
                ))}
                {projects.length === 0 && <p style={{ color: '#888' }}>No public projects yet.</p>}
            </div>
        </div>
    );
}

export default UserProfile;
