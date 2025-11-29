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
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ margin: 0, fontFamily: 'Quicksand, sans-serif', fontSize: '2.5rem', lineHeight: 1, color: 'white' }}>
                        <span style={{ color: '#1db954' }}>Q</span>ara<span style={{ color: '#1db954' }}>O</span>ke
                    </h2>
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
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                            style={{
                                backgroundColor: '#1db954',
                                color: 'white',
                                marginBottom: '10px',
                                fontWeight: 'bold',
                                justifyContent: 'center',
                                border: 'none'
                            }}
                        >
                            {t('admin_dashboard')}
                        </NavLink>
                    )}
                    <button onClick={handleLogout} className="logout-btn">
                        {t('logout')}
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
                    🏠
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
                    📊
                </NavLink>
                <NavLink to="/following" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
                    👥
                </NavLink>
                <NavLink to={`/user/${user.username}`} className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
                    👤
                </NavLink>
            </div>

            <style>{`
                .sidebar {
                    width: var(--sidebar-width);
                    height: 100vh;
                    background-color: #181818;
                    border-right: 1px solid var(--border-color);
                    position: fixed;
                    top: 0;
                    left: 0;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    box-sizing: border-box;
                    z-index: 1000;
                }

                .sidebar-header {
                    margin-bottom: 0px;
                    padding-left: 10px;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                }

                    width: 200px;
                    height: 50px;
                    color: var(--text-muted);
                    text-decoration: none;
                    padding: 0 16px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .nav-item:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                    color: var(--text-main);
                }

                .nav-item.active {
                    background-color: rgba(29, 185, 84, 0.1);
                    color: var(--primary);
                    font-weight: 600;
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 20px;
                    border-top: 1px solid var(--border-color);
                }

                .logout-btn {
                    width: 200px;
                    height: 50px;
                    background: none;
                    border: 1px solid white;
                    color: white;
                    padding: 0 16px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .logout-btn:hover {
                    border-color: var(--danger);
                    color: var(--danger);
                }

                .bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background-color: #181818;
                    border-top: 1px solid var(--border-color);
                    padding: 10px 0;
                    justify-content: space-around;
                    align-items: center;
                    z-index: 1000;
                }

                .bottom-nav-item {
                    color: var(--text-muted);
                    text-decoration: none;
                    font-size: 24px;
                    padding: 10px;
                    border-radius: 50%;
                }

                .bottom-nav-item.active {
                    color: var(--primary);
                    background-color: rgba(29, 185, 84, 0.1);
                }

                @media (max-width: 768px) {
                    .sidebar {
                        display: none;
                    }
                    .bottom-nav {
                        display: flex;
                    }
                }
            `}</style>
        </>
    );
}

export default Sidebar;
