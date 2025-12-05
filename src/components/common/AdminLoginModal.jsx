import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

function AdminLoginModal({ onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await client.post('/api/auth/login', { username, password });
            if (data && data.user.is_admin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/admin');
                onClose();
            } else {
                setError('Not an admin account or invalid credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card" style={{ width: '300px', padding: '30px' }}>
                <h2 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>Admin Access</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input className="dark-input" type="text" placeholder="ID" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
                    <input className="dark-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <p style={{ color: '#ff4444', fontSize: '0.9em', textAlign: 'center' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" className="primary" style={{ flex: 1, borderRadius: '4px' }}>Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginModal;