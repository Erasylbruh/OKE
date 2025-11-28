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
            if (!token) return navigate('/');

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
                    navigate('/');
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
            } else {
                const msg = await res.text();
                setMessage(`Error: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            setMessage('Error updating settings');
        }
    };

    if (!user) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>{t('settings')}</h1>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>{t('my_dashboard')}</button>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>{t('username')} / {t('edit_profile')}</h3>
                <p><strong>{t('username')}:</strong> {user.username}</p>
                <p><strong>Nickname:</strong> {user.nickname || '-'}</p>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>{t('change_password')}</h3>
                <input
                    type="password"
                    placeholder={t('new_password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: 'white' }}
                />
                <p style={{ fontSize: '0.8em', color: '#888' }}>{t('password_requirements')}</p>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>{t('language')}</h3>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: 'white' }}
                >
                    <option value="en">English</option>
                    <option value="ru">Russian (Русский)</option>
                    <option value="kk">Kazakh (Қазақша)</option>
                </select>
            </div>

            {message && <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: message.includes('Error') ? '#ff4444' : '#1db954', borderRadius: '4px', color: 'white' }}>{message}</div>}

            <button
                onClick={handleSave}
                style={{ width: '100%', padding: '12px', backgroundColor: '#1db954', color: 'black', border: 'none', borderRadius: '4px', fontSize: '1.1em', cursor: 'pointer', fontWeight: 'bold' }}
            >
                {t('save')}
            </button>
        </div>
    );
}

export default Settings;
