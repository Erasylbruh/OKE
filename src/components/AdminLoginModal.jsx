import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function AdminLoginModal({ onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user.is_admin) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/admin');
                    onClose();
                } else {
                    setError('Not an admin account');
                }
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '12px', width: '300px', border: '1px solid #333' }}>
                <h2 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>Admin Access</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="ID"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ padding: '10px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: '4px' }}
                        autoFocus
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '10px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: '4px' }}
                    />
                    {error && <p style={{ color: '#ff4444', fontSize: '0.9em', textAlign: 'center' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#e91e63', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginModal;
