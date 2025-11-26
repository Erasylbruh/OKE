import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin) {
            // Username validation: min 6, letters + digits
            const usernameRegex = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,}$/;
            if (!usernameRegex.test(username)) {
                setError('Username must be at least 6 characters and contain both letters and digits.');
                return;
            }

            // Password validation: min 8, letters + digits + special (@, #, $, %, &)
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&])[a-zA-Z\d@#$%&]{8,}$/;
            if (!passwordRegex.test(password)) {
                setError('Password must be at least 8 characters and contain letters, digits, and a special character (@, #, $, %, &).');
                return;
            }
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg);
            }

            if (isLogin) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                // Auto-login after register
                const loginRes = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                if (loginRes.ok) {
                    const data = await loginRes.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/dashboard');
                } else {
                    setIsLogin(true);
                    alert('Registration successful! Please login.');
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Failed to connect to server');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', backgroundColor: '#282828', borderRadius: '8px' }}>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                    {!isLogin && (
                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
                            Min 6 chars, letters & digits (a-z, 0-9)
                        </div>
                    )}
                </div>

                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                    {!isLogin && (
                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
                            Min 8 chars, letters, digits & special char (@, #, $, %, &)
                        </div>
                    )}
                </div>

                <button type="submit" style={{ padding: '10px', backgroundColor: '#1db954', border: 'none', borderRadius: '4px', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isLogin ? 'Login' : 'Register'}
                </button>
            </form>
            <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ color: '#1db954', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isLogin ? 'Register' : 'Login'}
                </span>
            </p>
        </div>
    );
}

export default Auth;
