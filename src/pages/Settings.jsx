import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function Settings() {
    const [user, setUser] = useState(null);
    const [password, setPassword] = useState('');
    const [language, setLanguage] = useState('en');
    const [message, setMessage] = useState('');
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
                    setLanguage(data.language || 'en');
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, [navigate]);

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
                setMessage('Settings updated successfully');
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
                <h1>Settings</h1>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Account Info</h3>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Nickname:</strong> {user.nickname || '-'}</p>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Change Password</h3>
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: 'white' }}
                />
                <p style={{ fontSize: '0.8em', color: '#888' }}>Leave blank to keep current password.</p>
            </div>

            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>Language</h3>
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
                Save Changes
            </button>
        </div>
    );
}

export default Settings;
