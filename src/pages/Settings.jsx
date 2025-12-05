import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function Settings() {
    const [user, setUser] = useState(null);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await client.get('/api/users/settings');
                if (data) {
                    setUser(data);
                    if (data.language) setLanguage(data.language);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, [setLanguage]);

    const handleSave = async () => {
        try {
            await client.put('/api/users/settings', { 
                password: password || undefined, 
                language 
            });
            setMessage(t('settings_updated') || 'Settings updated');
            setPassword('');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        try {
            await client.delete(`/api/users/${user.id}`);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/auth');
        } catch (err) {
            alert('Failed to delete account');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
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
                            style={{ background: '#333', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            {t('edit_profile') || 'Edit'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="user-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" />
                            ) : (
                                (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()
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
                        className="dark-input"
                    >
                        <option value="en">English</option>
                        <option value="kk">Қазақша</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>

                {/* Password Change */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('change_password')}</label>
                    <input 
                        type="password"
                        placeholder={t('new_password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="dark-input"
                    />
                </div>

                <button onClick={handleSave} className="primary" style={{ width: '100%', marginBottom: '20px' }}>
                    {t('save_changes')}
                </button>

                {message && <div style={{ color: '#1db954', textAlign: 'center', marginBottom: '20px' }}>{message}</div>}

                {/* Danger Zone */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                    <h3 style={{ color: '#ff5555', marginTop: 0 }}>{t('danger_zone')}</h3>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '15px' }}>{t('delete_account_warning')}</p>
                    <button onClick={handleDeleteAccount} className="delete-btn" style={{ border: '1px solid #ff5555', color: '#ff5555', padding: '10px 20px', borderRadius: '5px', opacity: 1 }}>
                        {t('delete_account')}
                    </button>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>
                    {t('logout')}
                </button>
            </div>
        </div>
    );
}

export default Settings;