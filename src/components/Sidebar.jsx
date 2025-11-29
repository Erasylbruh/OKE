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
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '0.025em', margin: 0 }}>
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
                    height: calc(100vh - 40px);
                    background-color: #121212;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem; /* p-6 */
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    border: 1px solid #1f2937; /* border-gray-800 */
                    border-radius: 0.5rem; /* rounded-lg */
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
                    overflow: hidden;
                    z-index: 1000;
                    font-family: 'Montserrat', sans-serif;
                }

                .sidebar-header {
                    margin-bottom: 2rem; /* mb-8 */
                    text-align: center;
                }

                .sidebar-nav {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem; /* gap-2 */
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 0.75rem 1rem; /* py-3 px-4 */
                    border-radius: 0.25rem; /* rounded */
                    font-weight: 500; /* font-medium */
                    text-decoration: none;
                    transition: background-color 0.2s, color 0.2s;
                    color: #d1d5db; /* text-gray-300 */
                }

                .nav-item:hover {
                    color: white;
                    background-color: rgba(255, 255, 255, 0.05); /* hover:bg-white/5 */
                }

                .nav-item.active {
                    background-color: #1a2e22; /* bg-[#1a2e22] */
                    color: #2ebd65; /* text-[#2ebd65] */
                }

                .nav-item.active:hover {
                    background-color: #1f3a2b; /* hover:bg-[#1f3a2b] */
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 1rem; /* pt-4 */
                }

                .admin-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    background-color: #134e28; /* bg-[#134e28] */
                    color: white;
                    font-weight: bold;
                    padding: 0.75rem 1rem; /* py-3 px-4 */
                    border-radius: 0.25rem; /* rounded */
                    margin-bottom: 1rem; /* mb-4 */
                    text-decoration: none;
                    transition: background-color 0.2s;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* shadow-lg */
                    border: none;
                    cursor: pointer;
                }

                .admin-btn:hover {
                    background-color: #186032; /* hover:bg-[#186032] */
                }

                .logout-btn {
                    width: 100%;
                    background-color: transparent;
                    border: 2px solid #6b7280; /* border-gray-500 */
                    color: #e5e7eb; /* text-gray-200 */
                    font-weight: bold;
                    padding: 0.75rem 1rem; /* py-3 px-4 */
                    border-radius: 0.25rem; /* rounded */
                    transition: border-color 0.2s, color 0.2s;
                    cursor: pointer;
                    box-sizing: border-box;
                }

                .logout-btn:hover {
                    border-color: #d1d5db; /* hover:border-gray-300 */
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
