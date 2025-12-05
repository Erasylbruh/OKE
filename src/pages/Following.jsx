import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import ProjectCard from '../components/features/ProjectCard';
import { useLanguage } from '../context/LanguageContext';

function Following() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, projectsData] = await Promise.all([
                    client.get('/api/users/me/following'),
                    client.get('/api/projects/following')
                ]);
                
                if (usersData) setUsers(usersData);
                if (projectsData) setProjects(projectsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>←</button>
                <h1 style={{ margin: 0 }}>{t('following')}</h1>
            </div>

            {loading ? <div>Loading...</div> : (
                <>
                    {/* Profiles Horizontal Scroll */}
                    {users.length > 0 && (
                        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '40px' }}>
                            {users.map(user => (
                                <div key={user.id} onClick={() => navigate(`/user/${user.username}`)} style={{ minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <div className="user-avatar" style={{ width: '70px', height: '70px', fontSize: '1.5rem' }}>
                                        {user.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : (user.nickname?.[0] || user.username?.[0] || '?').toUpperCase()}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                        {user.nickname || user.username}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Projects Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => navigate(`/editor/${project.id}`)}
                                isOwner={false}
                            />
                        ))}
                    </div>

                    {users.length === 0 && <div style={{ textAlign: 'center', color: '#888' }}>{t('no_following')}</div>}
                    {users.length > 0 && projects.length === 0 && <div style={{ textAlign: 'center', color: '#888' }}>{t('no_posts_yet')}</div>}
                </>
            )}
        </div>
    );
}

export default Following;