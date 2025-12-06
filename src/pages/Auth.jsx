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
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-10 shadow-2xl relative w-[400px]">
            {/* Close Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white text-2xl p-1 transition-colors bg-transparent border-none cursor-pointer"
            >
                &times;
            </button>

            <div className="text-center mb-8">
                <h1 className="m-0 font-quicksand text-3xl text-white font-bold">
                    <span className="text-[#1db954]">Q</span>ara<span className="text-[#1db954]">O</span>ke
                </h1>
                <p className="text-[#888] mt-1">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-5 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <label className="block text-[#888] mb-2 text-xs uppercase tracking-wider">
                        {t('username')}
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        required
                        className="h-12 bg-[#121212] border border-[#333] rounded-lg px-4 text-white w-full focus:outline-none focus:border-[#1DB954] transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-[#888] mb-2 text-xs uppercase tracking-wider">
                        {t('password')}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 bg-[#121212] border border-[#333] rounded-lg pl-4 pr-10 text-white w-full focus:outline-none focus:border-[#1DB954] transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#888] cursor-pointer p-0 flex items-center hover:text-white"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="mt-2 flex flex-col gap-1">
                            <div className={`text-xs flex items-center gap-1 ${hasLength ? 'text-[#1db954]' : 'text-[#ff5555]'}`}>
                                {hasLength ? '✓' : '○'} At least 8 characters
                            </div>
                            <div className={`text-xs flex items-center gap-1 ${hasUpper ? 'text-[#1db954]' : 'text-[#ff5555]'}`}>
                                {hasUpper ? '✓' : '○'} At least one capital letter
                            </div>
                            <div className={`text-xs flex items-center gap-1 ${hasNum ? 'text-[#1db954]' : 'text-[#ff5555]'}`}>
                                {hasNum ? '✓' : '○'} At least one number
                            </div>
                            <div className={`text-xs flex items-center gap-1 ${hasSpecial ? 'text-[#1db954]' : 'text-[#ff5555]'}`}>
                                {hasSpecial ? '✓' : '○'} At least one special character (!,@,#,$,%,&)
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className={`bg-[#1DB954] text-white border-none py-2 px-5 hover:bg-[#1ed760] transition-colors rounded-lg h-12 text-base font-bold mt-2 ${(!isLogin && !isPasswordValid) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isLogin ? t('login') : t('register')}
                </button>
            </form>

            <div className="text-center mt-5">
                <span className="text-[#888]">
                    {isLogin ? t('dont_have_account') : t('already_have_account')}{' '}
                </span>
                <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="bg-transparent border-none text-[#1DB954] cursor-pointer font-bold p-0 ml-1 hover:underline"
                >
                    {isLogin ? t('register') : t('login')}
                </button>
            </div>
        </div>
    );
}

export default Auth;
