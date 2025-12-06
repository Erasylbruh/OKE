import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiHome, FiHeart, FiUser, FiSettings } from 'react-icons/fi';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const isActive = (path) => location.pathname === path;

    const getButtonClass = (isActive) =>
        `flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${isActive ? 'text-green-500' : 'text-neutral-500 hover:text-white'}`;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-neutral-800 flex justify-around p-2 z-50 md:hidden pb-safe">
            <button
                className={getButtonClass(isActive('/') && (!location.state?.tab || location.state?.tab === 'foryou'))}
                onClick={() => navigate('/', { state: { tab: 'foryou' } })}
            >
                <FiHome size={24} />
                <span className="text-xs mt-1">{t('home') || 'home'}</span>
            </button>

            <button
                className={getButtonClass(isActive('/liked-projects'))}
                onClick={() => navigate('/liked-projects')}
            >
                <FiHeart size={24} />
                <span className="text-xs mt-1">{t('liked') || 'liked'}</span>
            </button>

            <button
                className={getButtonClass(isActive(`/user/${currentUser.username}`))}
                onClick={() => navigate(currentUser.username ? `/user/${currentUser.username}` : '/auth')}
            >
                <FiUser size={24} />
                <span className="text-xs mt-1">{t('profile') || 'profile'}</span>
            </button>

            <button
                className={getButtonClass(isActive('/settings'))}
                onClick={() => navigate('/settings')}
            >
                <FiSettings size={24} />
                <span className="text-xs mt-1">{t('settings') || 'settings'}</span>
            </button>
        </div>
    );
};

export default BottomNav;
