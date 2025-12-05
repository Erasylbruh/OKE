import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FiHome, FiUser, FiHeart, FiSettings } from 'react-icons/fi';

function Sidebar() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.is_admin === 1 || user.is_admin === true;
    const isLoggedIn = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1>
                    <span>Q</span>ara<span>O</span>ke
                </h1>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <FiHome size={20} />
                    <span>{t('main')}</span>
                </NavLink>
                {isLoggedIn && (
                    <>
                        <NavLink to={`/user/${user.username}`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <FiUser size={20} />
                            <span>{t('profile')}</span>
                        </NavLink>
                        <NavLink to="/liked-projects" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <FiHeart size={20} />
                            <span>{t('liked_projects')}</span>
                        </NavLink>
                        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <FiSettings size={20} />
                            <span>{t('settings')}</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="separator"></div>

            <div className="sidebar-footer">
                {isAdmin && isLoggedIn && (
                    <NavLink to="/admin" className="admin-btn">
                        {t('admin_dashboard')}
                    </NavLink>
                )}
                {isLoggedIn ? (
                    <button onClick={handleLogout} className="logout-btn">
                        {t('logout')}
                    </button>
                ) : (
                    <button onClick={() => navigate('/auth')} className="login-btn">
                        {t('login')}
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;