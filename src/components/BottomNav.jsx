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
                className={`nav-item ${isActive('/foryou') || isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
            >
                <i className="fas fa-home"></i>
                <span>{t('home')}</span>
            </button>

            <button
                className={`nav-item ${isActive('/following') ? 'active' : ''}`}
                onClick={() => navigate('/following')}
            >
                <i className="fas fa-user-friends"></i>
                <span>{t('following')}</span>
            </button>

            <button
                className={`nav-item ${isActive('/liked-projects') ? 'active' : ''}`}
                onClick={() => navigate('/liked-projects')}
            >
                <i className="fas fa-heart"></i>
                <span>{t('liked')}</span>
            </button>

            <button
                className={`nav-item ${isActive(`/user/${currentUser.username}`) ? 'active' : ''}`}
                onClick={() => navigate(currentUser.username ? `/user/${currentUser.username}` : '/auth')}
            >
                <i className="fas fa-user"></i>
                <span>{t('profile')}</span>
            </button>
        </div>
    );
};

export default BottomNav;
