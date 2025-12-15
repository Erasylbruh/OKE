import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function Settings() {
    const [user, setUser] = useState(null);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/auth');

            try {
                const res = await fetch(`${API_URL}/api/users/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    if (data.language) {
                        setLanguage(data.language);
                    }
                } else {
                    navigate('/auth');
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, [navigate, setLanguage]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/users/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: password || undefined, language })
            });

            if (res.ok) {
                setMessage(t('settings_updated') || 'Settings updated successfully');
                setPassword('');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const msg = await res.text();
                setMessage(`Error: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            setMessage('Error updating settings');
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = storedUser.id || user?.id;

        if (!userId) {
            alert('Cannot determine user ID');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/auth');
            } else {
                alert('Failed to delete account');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting account');
        }
    };

    if (!user) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>{t('settings')}</h1>

            <div className="card">
                {/* Profile Info */}
                <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('profile')}</h3>
                        <button
                            onClick={() => navigate('/settings/profile')}
                            style={{
                                background: '#333',
                                border: 'none',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: 'var(--bg-hover)'
                        }}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem' }}>
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.nickname || user.username}</div>
                            <div style={{ color: 'var(--text-muted)' }}>@{user.username}</div>
                        </div>
                    </div>
                </div>

                {/* Language Settings */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('language')}</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ backgroundColor: 'var(--bg-main)' }}
                    >
                        <option value="en">English</option>
                        <option value="kk">Қазақша</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>

                <button
                    onClick={handleSave}
                    className="primary"
                    style={{ width: '100%', padding: '12px', marginBottom: '20px' }}
                >
                    {t('save_changes') || 'Save Changes'}
                </button>

                {message && <div style={{ color: 'var(--brand-primary)', textAlign: 'center', marginBottom: '20px' }}>{message}</div>}

                {/* Admin Dashboard - Mobile Only */}
                <div className="mobile-visible" style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/admin')}
                        style={{
                            background: 'linear-gradient(45deg, #FF512F, #DD2476)',
                            border: 'none',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            width: '100%',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {t('admin_dashboard') || 'Admin Dashboard'}
                    </button>
                </div>

                {/* Danger Zone */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                    <h3 style={{ color: '#ff5555', marginTop: 0 }}>{t('danger_zone') || 'Danger Zone'}</h3>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '15px' }}>
                        {t('delete_account_warning') || 'Once you delete your account, there is no going back. Please be certain.'}
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #ff5555',
                            color: '#ff5555',
                            padding: '10px 20px',
                            borderRadius: '5px'
                        }}
                    >
                        {t('delete_account') || 'Delete Account'}
                    </button>
                </div>
            </div>

            {/* Logout Button */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/auth');
                    }}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {t('logout') || 'Log Out'}
                </button>
            </div>
        </div>
    );
}

export default Settings;
