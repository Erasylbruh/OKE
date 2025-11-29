import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

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
                        {t('main') || 'Main'}
                    </NavLink>
                    <NavLink to={`/user/${user.username}`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        {t('profile') || 'Profile'}
                    </NavLink>
                    <NavLink to="/liked-projects" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        {t('liked_projects')}
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        {t('settings')}
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="separator"></div>
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className="admin-btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
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
                    width: 280px;
                    height: 100vh;
                    background-color: #121212; /* var(--surface) */
                    color: white;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    position: fixed;
                    top: 0; /* Reset top */
                    left: 0; /* Reset left */
                    overflow: hidden;
                    z-index: 1000;
                    font-family: 'Montserrat', sans-serif;
                    border: none; /* Reset border */
                    border-radius: 0; /* Reset radius */
                    box-shadow: none; /* Reset shadow */
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
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: background-color 0.2s, color 0.2s;
                    color: #d1d5db;
                }

                .nav-item:hover {
                    color: white;
                    background-color: rgba(255, 255, 255, 0.05);
                }

                .nav-item.active {
                    background-color: #1a2e22;
                    color: #2ebd65;
                }

                .nav-item.active:hover {
                    background-color: #1f3a2b;
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 1rem;
                }

                .separator {
                    height: 1px;
                    width: 100%;
                    background-color: #4b5563;
                    margin-bottom: 1.5rem;
                }

                .logout-btn {
                    width: 100%;
                    background-color: transparent;
                    border: 2px solid #6b7280;
                    color: #e5e7eb;
                    font-weight: bold;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                    transition: border-color 0.2s, color 0.2s;
                    cursor: pointer;
                    box-sizing: border-box;
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
