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
        <div className="max-w-[600px] mx-auto pt-10 px-4 pb-24 md:pb-10">
            <h1 className="mb-8 text-center text-3xl font-bold text-white">{t('settings')}</h1>

            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 shadow-lg">
                {/* Profile Info */}
                <div className="mb-8 pb-6 border-b border-[#333]">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="m-0 text-[#B3B3B3] text-sm uppercase tracking-wider">{t('profile')}</h3>
                        <button
                            onClick={() => navigate('/settings/profile')}
                            className="bg-[#333] border-none text-white py-1 px-3 rounded text-sm hover:bg-[#444] transition-colors"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#333] flex items-center justify-center text-white text-2xl font-bold">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div>
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-lg text-white">{user.nickname || user.username}</div>
                            <div className="text-[#B3B3B3]">@{user.username}</div>
                        </div>
                    </div>
                </div>

                {/* Language Settings */}
                <div className="mb-8">
                    <label className="block mb-3 text-[#B3B3B3] text-sm uppercase tracking-wider">{t('language')}</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-[#121212] w-full p-3 rounded border border-[#333] text-white focus:outline-none focus:border-[#1DB954]"
                    >
                        <option value="en">English</option>
                        <option value="kk">Қазақша</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-[#1DB954] text-white font-bold rounded hover:bg-[#1ed760] transition-colors mb-5 shadow-md border-none"
                >
                    {t('save_changes') || 'Save Changes'}
                </button>

                {message && <div style={{ color: '#1db954', textAlign: 'center', marginBottom: '20px' }}>{message}</div>}

                {/* Admin Dashboard - Mobile Only */}
                <div className="md:hidden mb-5">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full py-3 bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white font-bold rounded flex items-center justify-center gap-2 shadow-md border-none"
                    >
                        {t('admin_dashboard') || 'Admin Dashboard'}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 pt-6 border-t border-[#333]">
                    <h3 className="text-[#ff5555] mt-0 mb-2 font-bold">{t('danger_zone') || 'Danger Zone'}</h3>
                    <p className="text-[#888] text-sm mb-4">
                        {t('delete_account_warning') || 'Once you delete your account, there is no going back. Please be certain.'}
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        className="bg-transparent border border-[#ff5555] text-[#ff5555] px-5 py-2 rounded hover:bg-[#ff5555]/10 transition-colors"
                    >
                        {t('delete_account') || 'Delete Account'}
                    </button>
                </div>
            </div>

            {/* Logout Button */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/auth');
                    }}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {t('logout') || 'Log Out'}
                </button>
            </div>
        </div>
    );
}

export default Settings;
