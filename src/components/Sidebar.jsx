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
                {/* Logo Section */}
                <div className="sidebar-header">
                    <h1>
                        <span style={{ color: '#22c55e' }}>Q</span>ara<span style={{ color: '#22c55e' }}>O</span>ke
                    </h1>
                </div>

                {/* Navigation Menu */}
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

                {/* Bottom Section */}
                <div className="sidebar-footer">
                    {/* Separator Line */}
                    <div style={{ height: '1px', width: '100%', backgroundColor: '#4b5563', marginBottom: '1.5rem' }}></div>

                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className="admin-btn"
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
                .sidebar {
                    width: 280px;
                    height: 100vh;
                    background-color: #121212;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    position: fixed;
                    top: 0;
                    left: 0;
                    overflow: hidden;
                    z-index: 1000;
                    font-family: 'Montserrat', sans-serif;
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

                .admin-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    background-color: #134e28;
                    color: white;
                    font-weight: bold;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                    margin-bottom: 1rem;
                    text-decoration: none;
                    transition: background-color 0.2s;
                    border: none;
                    cursor: pointer;
                }

                .admin-btn:hover {
                    background-color: #186032;
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
