import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Validation States
    const hasLength = password.length >= 8;
    const hasNum = /\d/.test(password);
    const hasSpecial = /[@#$%&]/.test(password);
    const hasLetters = /[a-zA-Z]/.test(password); // Implied requirement

    const isPasswordValid = hasLength && hasNum && hasSpecial && hasLetters;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin) {
            // Username validation
            const usernameRegex = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,}$/;
            if (!usernameRegex.test(username)) {
                setError('Invalid username format');
                return;
            }

            if (!isPasswordValid) {
                setError('Please meet all password requirements');
                return;
            }
        }

        const endpoint = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;

        try {
            const response = await fetch(endpoint, {
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
                const loginRes = await fetch(`${API_URL}/api/auth/login`, {
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

    const containerStyle = {
        width: '440px',
        height: isLogin ? '280px' : '380px', // Increased slightly to fit validation text comfortably
        margin: '100px auto',
        padding: '20px',
        backgroundColor: '#282828',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Center content vertically
        boxSizing: 'border-box',
        transition: 'height 0.3s ease'
    };

    const inputStyle = {
        width: '100%', // 400px effectively (440 - 40 padding)
        height: '35px',
        padding: '0 10px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #444',
        backgroundColor: '#121212',
        color: 'white',
        fontSize: '14px'
    };

    const buttonStyle = {
        width: '100%',
        height: '40px',
        backgroundColor: '#1db954',
        border: 'none',
        borderRadius: '4px',
        color: 'black',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '10px'
    };

    const ValidationItem = ({ satisfied, text }) => (
        <div style={{
            color: satisfied ? '#1db954' : '#ff4444',
            fontSize: '12px',
            transition: 'color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        }}>
            <span>{satisfied ? '✓' : '•'}</span>
            {text}
        </div>
    );

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', marginTop: 0 }}>{isLogin ? t('login') : t('register')}</h2>
            {error && <div style={{ color: '#ff4444', marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="text"
                    placeholder={t('username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    required
                    style={inputStyle}
                />

                <div>
                    <input
                        type="password"
                        placeholder={t('password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                    {!isLogin && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <ValidationItem satisfied={hasLength} text="At least 8 characters" />
                            <ValidationItem satisfied={hasNum} text="Contains a number" />
                            <ValidationItem satisfied={hasSpecial} text="Contains special char (@, #, $, %, &)" />
                        </div>
                    )}
                </div>

                <button type="submit" style={{ ...buttonStyle, opacity: (!isLogin && !isPasswordValid) ? 0.5 : 1, cursor: (!isLogin && !isPasswordValid) ? 'not-allowed' : 'pointer' }} disabled={!isLogin && !isPasswordValid}>
                    {isLogin ? t('login') : t('register')}
                </button>
            </form>

            <p style={{ marginTop: '15px', fontSize: '14px', textAlign: 'center', color: '#888' }}>
                {isLogin ? t('dont_have_account') : t('already_have_account')}{' '}
                <span
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    style={{ color: '#1db954', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isLogin ? t('register') : t('login')}
                </span>
            </p>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                    Back to Main
                </button>
            </div>
        </div>
    );
}

export default Auth;
