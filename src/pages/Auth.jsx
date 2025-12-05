import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        
        try {
            const data = await client.post(endpoint, { username, password });
            
            if (data) {
                if (isLogin) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/dashboard');
                } else {
                    // Auto-login after register
                    const loginData = await client.post('/api/auth/login', { username, password });
                    if (loginData) {
                        localStorage.setItem('token', loginData.token);
                        localStorage.setItem('user', JSON.stringify(loginData.user));
                        navigate('/dashboard');
                    } else {
                        setIsLogin(true);
                        alert('Registration successful! Please login.');
                    }
                }
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="card" style={{ width: '400px', maxWidth: '90%', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>
                    <span style={{ color: '#1db954' }}>Q</span>ara<span style={{ color: '#1db954' }}>O</span>ke
                </h1>
                <p style={{ color: '#888', marginTop: '5px' }}>
                    {isLogin ? t('login') : t('register')}
                </p>
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)', color: '#E53935', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>
                        {t('username')}
                    </label>
                    <input
                        type="text"
                        className="dark-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>
                        {t('password')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="dark-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="primary" style={{ marginTop: '10px', width: '100%', borderRadius: '25px' }}>
                    {isLogin ? t('login') : t('register')}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span style={{ color: '#888' }}>
                    {isLogin ? t('dont_have_account') : t('already_have_account')}{' '}
                </span>
                <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {isLogin ? t('register') : t('login')}
                </button>
            </div>
        </div>
    );
}

export default Auth;