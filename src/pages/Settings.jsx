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
        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}`, { // Assuming self-delete endpoint exists or admin endpoint works for self if authorized
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
                {/* Profile Info (Read Only) */}
                <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('profile')}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#333',
                            backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: '#888'
                        }}>
                            {!user.avatar_url && (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{user.nickname || user.username}</div>
                            <div style={{ color: 'var(--text-muted)' }}>@{user.username}</div>
                        </div>
                        <button
                            onClick={() => navigate(`/user/${user.username}`)}
                            className="secondary"
                            style={{ marginLeft: 'auto', fontSize: '0.9rem', padding: '6px 12px' }}
                        >
                            {t('edit_profile')}
                        </button>
                    </div>
                </div>

                {/* Language */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('language')}</h3>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#181818',
                            color: 'white',
                            marginTop: '10px',
                            fontSize: '1rem'
                        }}
                    >
                        <option value="en">English</option>
                        <option value="ru">Russian (Русский)</option>
                        <option value="kk">Kazakh (Қазақша)</option>
                    </select>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('change_password')}</h3>
                    <input
                        type="password"
                        placeholder={t('new_password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#181818',
                            color: 'white',
                            marginTop: '10px',
                            fontSize: '1rem'
                        }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {t('password_requirements')}
                    </p>
                </div>

                {/* Save Button */}
                {message && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '20px',
                        backgroundColor: message.includes('Error') ? 'rgba(255, 68, 68, 0.1)' : 'rgba(29, 185, 84, 0.1)',
                        border: `1px solid ${message.includes('Error') ? '#ff4444' : '#1db954'}`,
                        borderRadius: '8px',
                        color: message.includes('Error') ? '#ff4444' : '#1db954',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    className="primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1.1rem', borderRadius: '30px' }}
                >
                    {t('save_changes') || 'Save Changes'}
                </button>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ff4444', borderRadius: '12px', opacity: 0.7 }}>
                <h3 style={{ marginTop: 0, color: '#ff4444', fontSize: '1rem' }}>Danger Zone</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#ff4444',
                        border: '1px solid #ff4444',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
}

export default Settings;
