import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiHome, FiUser, FiHeart, FiSettings } from 'react-icons/fi';

function Sidebar() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.is_admin === 1;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>
                        <span>Q</span>ara<span>O</span>ke
                    </h1>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FiHome size={20} />
                        <span>{t('main') || 'Main'}</span>
                    </NavLink>
                    <NavLink to={`/user/${user.username}`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FiUser size={20} />
                        <span>{t('profile') || 'Profile'}</span>
                    </NavLink>
                    <NavLink to="/liked-projects" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FiHeart size={20} />
                        <span>{t('liked_projects')}</span>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FiSettings size={20} />
                        <span>{t('settings')}</span>
                    </NavLink>
                </nav>

                <div className="separator"></div>

                <div className="sidebar-footer">
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className="admin-btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#134e28',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.25rem',
                                marginBottom: '1rem',
                                textDecoration: 'none',
                                transition: 'background-color 0.2s',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {t('admin_dashboard')}
                        </NavLink>
                    )}
                    <button onClick={handleLogout} className="logout-btn">
                        {t('logout')}
                    </button>
                </div>
            </aside>

            <style>{`
                /* Sidebar Styles from test.css */
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    background-color: #121212;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    top: 0;
                    left: 0;
                    overflow: hidden;
                    z-index: 1000;
                    font-family: 'Montserrat', sans-serif;
                    border: none;
                    border-radius: 0;
                    box-shadow: none;
                }

                .sidebar-header {
                    margin-bottom: 2rem;
                    text-align: center;
                }

                .sidebar-header h1 {
                    font-size: 3rem;
                    font-weight: bold;
                    margin: 0;
                }

                .sidebar-header span {
                    color: #22c55e;
                }

                .sidebar-nav {
                    flex: 1;
                    gap: 0.5rem;
                    padding: 0 10px;
                }

                .sidebar .nav-item {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    border-radius: 0.25rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: background-color 0.2s, color 0.2s;
                    color: #d1d5db;
                    font-size: .875em;
                    padding: 0.75rem 1rem;
                    flex-direction: row;
                }

                .sidebar .nav-item span {
                    margin-left: 12px;
                }

                .sidebar .nav-item:hover {
                    color: white;
                    background-color: rgba(255, 255, 255, 0.05);
                }

                .sidebar .nav-item.active {
                    background-color: #1a2e22;
                    color: #2ebd65;
                }

                .sidebar .nav-item.active:hover {
                    background-color: #1f3a2b;
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding: 0 10px 10px 10px;
                }

                .separator {
                    height: 1px;
                    width: 100%;
                    background-color: #4b5563;
                    margin-bottom: 1.5rem;
                }

                .logout-btn {
                    background-color: transparent;
                    border: 2px solid #bb0000;
                    color: #bb0000;
                    font-weight: bold;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                    transition: border-color 0.2s, color 0.2s;
                    cursor: pointer;
                    box-sizing: border-box;
                    width: 100%;
                }

                .logout-btn:hover {
                    border-color: #d1d5db;
                    color: white;
                }

                @media (max-width: 768px) {
                    .sidebar {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}

export default Sidebar;
