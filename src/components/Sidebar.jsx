import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { FiHome, FiUser, FiHeart, FiSettings, FiSun, FiMoon } from 'react-icons/fi';
import API_URL from '../config';

function Sidebar() {
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.is_admin === 1;
    const isLoggedIn = !!localStorage.getItem('token');

    const [followedUsers, setFollowedUsers] = useState([]);

    useEffect(() => {
        if (isLoggedIn) {
            const fetchFollowing = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const headers = { 'Authorization': `Bearer ${token}` };
                    const res = await fetch(`${API_URL}/api/users/me/following`, { headers });
                    if (res.ok) {
                        setFollowedUsers(await res.json());
                    }
                } catch (err) {
                    console.error("Failed to fetch following", err);
                }
            };
            fetchFollowing();
        }
    }, [isLoggedIn]);

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
                    {isLoggedIn && (
                        <>
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
                        </>
                    )}
                </nav>

                {isLoggedIn && (
                    <div className="following-section">
                        <h3 className="section-header">{t('following') || 'Following'}</h3>
                        <div className="following-list">
                            {followedUsers.map(u => (
                                <NavLink key={u.id} to={`/user/${u.username}`} className="following-item">
                                    <div
                                        className="following-avatar"
                                        style={{ backgroundImage: u.avatar_url ? `url(${u.avatar_url})` : 'none' }}
                                    >
                                        {!u.avatar_url && (u.nickname?.[0] || u.username?.[0] || '?').toUpperCase()}
                                    </div>
                                    <span className="following-name">{u.nickname || u.username}</span>
                                </NavLink>
                            ))}
                            {followedUsers.length === 0 && (
                                <p className="no-following-msg">{t('no_following') || 'No followed users'}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="sidebar-footer">
                    <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
                        {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                        <span style={{ marginLeft: '10px' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

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

            <style>{`
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    background-color: var(--bg-glass);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    color: var(--text-primary);
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    top: 0;
                    left: 0;
                    overflow: hidden;
                    z-index: 1000;
                    font-family: 'Montserrat', sans-serif;
                    border-right: 1px solid var(--border-color);
                    transition: background-color 0.3s, border-color 0.3s;
                }

                .sidebar-header {
                    margin-bottom: 2rem;
                    text-align: center;
                    padding-top: 1rem;
                }

                .sidebar-header h1 {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin: 0;
                    color: var(--text-primary);
                }

                .sidebar-header span {
                    color: var(--brand-primary);
                }

                .sidebar-nav {
                    gap: 0.5rem;
                    padding: 0 10px;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar .nav-item {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    flex-direction: row;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                    color: var(--text-secondary);
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                }

                .sidebar .nav-item span {
                    margin-left: 12px;
                }

                .sidebar .nav-item:hover {
                    background-color: var(--bg-hover);
                    color: var(--text-primary);
                }

                .sidebar .nav-item.active {
                    background-color: var(--brand-bg);
                    color: var(--brand-primary);
                }
                
                /* Following Section */
                .following-section {
                    margin-top: 2rem;
                    padding: 0 1.5rem;
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0; /* Enable scrolling */
                }

                .section-header {
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }

                .following-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .following-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                    color: var(--text-secondary);
                    padding: 5px 0;
                    transition: color 0.2s;
                }

                .following-item:hover {
                    color: var(--text-primary);
                }

                .following-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: var(--bg-hover);
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }

                .following-name {
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .no-following-msg {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-style: italic;
                }

                .sidebar-footer {
                    padding: 1rem;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background-color: var(--bg-surface);
                }
                
                .theme-toggle-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    width: 100%;
                    transition: background 0.2s;
                }
                
                .theme-toggle-btn:hover {
                    background-color: var(--bg-hover);
                }

                .logout-btn {
                    background-color: transparent;
                    border: 1px solid var(--danger);
                    color: var(--danger);
                    font-weight: bold;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background-color: var(--danger);
                    color: white;
                }

                .login-btn, .admin-btn {
                    background-color: var(--brand-primary);
                    border: none;
                    color: white;
                    font-weight: bold;
                    padding: 0.75rem 0;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    width: 100%;
                    text-decoration: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .login-btn:hover, .admin-btn:hover {
                    opacity: 0.9;
                }

                @media (max-width: 877px) {
                    .sidebar {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}

export default Sidebar;
