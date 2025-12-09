import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Validation Logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /\d/.test(password);
    const hasSpecial = /[!@#$%&]/.test(password);

    const isPasswordValid = hasLength && hasUpper && hasNum && hasSpecial;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin) {
            // Username validation: 6+ chars, lowercase, letters (numbers optional)
            const usernameRegex = /^[a-z0-9]{6,}$/;
            if (!usernameRegex.test(username)) {
                setError('Username must be 6+ chars, lowercase letters & numbers (optional)');
                return;
            }

            if (!isPasswordValid) {
                setError('Password does not meet requirements');
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

    return (
        <div className="card" style={{
            width: '400px',
            position: 'relative',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
            padding: '40px'
        }}>
            {/* Close Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px'
                }}
            >
                &times;
            </button>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontFamily: 'Quicksand, sans-serif', fontSize: '2rem', color: 'white' }}>
                    <span style={{ color: '#1db954' }}>Q</span>ara<span style={{ color: '#1db954' }}>O</span>ke
                </h1>
                <p style={{ color: '#888', marginTop: '5px' }}>
                    {isLogin ? 'Welcome back' : 'Create your account'}
                </p>
            </div>

            {error && (
                <div style={{
                    backgroundColor: 'rgba(229, 57, 53, 0.1)',
                    color: '#E53935',
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {t('username')}
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        required
                        style={{ height: '48px', backgroundColor: '#121212' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {t('password')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ height: '48px', backgroundColor: '#121212', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ fontSize: '12px', color: hasLength ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {hasLength ? '✓' : '○'} At least 8 characters
                            </div>
                            <div style={{ fontSize: '12px', color: hasUpper ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {hasUpper ? '✓' : '○'} At least one capital letter
                            </div>
                            <div style={{ fontSize: '12px', color: hasNum ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {hasNum ? '✓' : '○'} At least one number
                            </div>
                            <div style={{ fontSize: '12px', color: hasSpecial ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {hasSpecial ? '✓' : '○'} At least one special character (!,@,#,$,%,&)
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="primary"
                    style={{
                        height: '48px',
                        fontSize: '16px',
                        marginTop: '10px',
                        opacity: (!isLogin && !isPasswordValid) ? 0.7 : 1
                    }}
                >
                    {isLogin ? t('login') : t('register')}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span style={{ color: '#888' }}>
                    {isLogin ? t('dont_have_account') : t('already_have_account')}{' '}
                </span>
                <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        padding: 0,
                        marginLeft: '5px'
                    }}
                >
                    {isLogin ? t('register') : t('login')}
                </button>
            </div>
        </div>
    );
}

export default Auth;
