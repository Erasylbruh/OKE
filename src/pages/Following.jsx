import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function Following() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchFollowing = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/auth');

            try {
                const res = await fetch(`${API_URL}/api/users/me/following`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFollowing();
    }, [navigate]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0 }}>{t('following') || 'Following'}</h1>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => navigate(`/user/${user.username}`)}
                            style={{
                                backgroundColor: '#181818',
                                padding: '20px',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
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
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{user.nickname || user.username}</h3>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>@{user.username}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && users.length === 0 && (
                <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                    You are not following anyone yet.
                </div>
            )}
        </div>
    );
}

export default Following;
