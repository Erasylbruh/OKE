import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const isActive = (path) => location.pathname === path;

    return (
        <div className="bottom-nav">
            <button
                className={`nav-item ${isActive('/') && (!location.state?.tab || location.state?.tab === 'foryou') ? 'active' : ''}`}
                onClick={() => navigate('/', { state: { tab: 'foryou' } })}
            >
                <span>{t('home') || 'home'}</span>
            </button>



            <button
                className={`nav-item ${isActive('/liked-projects') ? 'active' : ''}`}
                onClick={() => navigate('/liked-projects')}
            >
                <span>{t('liked') || 'liked'}</span>
            </button>

            <button
                className={`nav-item ${isActive(`/user/${currentUser.username}`) ? 'active' : ''}`}
                onClick={() => navigate(currentUser.username ? `/user/${currentUser.username}` : '/auth')}
            >
                <span>{t('profile') || 'profile'}</span>
            </button>

            <button
                className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
            >
                <span>{t('settings') || 'settings'}</span>
            </button>
        </div>
    );
};

export default BottomNav;
