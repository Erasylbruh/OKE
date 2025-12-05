import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FiHome, FiHeart, FiUser, FiSettings } from 'react-icons/fi';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const isActive = (path) => location.pathname === path;

    return (
        <div className="bottom-nav">
            <button
                className={`nav-item ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
            >
                <FiHome size={20} />
                <span>{t('home')}</span>
            </button>

            <button
                className={`nav-item ${isActive('/liked-projects') ? 'active' : ''}`}
                onClick={() => navigate('/liked-projects')}
            >
                <FiHeart size={20} />
                <span>{t('liked')}</span>
            </button>

            <button
                className={`nav-item ${isActive(`/user/${currentUser.username}`) ? 'active' : ''}`}
                onClick={() => navigate(currentUser.username ? `/user/${currentUser.username}` : '/auth')}
            >
                <FiUser size={20} />
                <span>{t('profile')}</span>
            </button>

            <button
                className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
            >
                <FiSettings size={20} />
                <span>{t('settings')}</span>
            </button>
        </div>
    );
};

export default BottomNav;