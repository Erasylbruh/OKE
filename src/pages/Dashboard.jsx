import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(user.nickname || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.avatar_url || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');

            try {
                const response = await fetch('http://localhost:3000/api/projects', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data);
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProjects();
    }, [navigate]);

    const handleCreateNew = async () => {
        if (!newProjectName.trim()) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newProjectName,
                    data: { lyrics: [], styles: { fontSize: 24, activeFontSize: 32, color: '#ffffff', fillColor: '#1db954', backgroundColor: '#121212', fontFamily: 'Inter, sans-serif' } }
                })
            });

            if (res.ok) {
                const data = await res.json();
                navigate(`/editor/${data.id}`);
            } else {
                alert('Failed to create project');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating project');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async () => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('nickname', nickname);
        if (selectedFile) {
            formData.append('avatar', selectedFile);
        } else {
            formData.append('avatar_url', avatarUrl);
        }

        try {
            const res = await fetch('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                const newUser = { ...user, nickname, avatar_url: data.avatar_url || avatarUrl };
                localStorage.setItem('user', JSON.stringify(newUser));
                setUser(newUser);
                setIsEditing(false);
                setSelectedFile(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleVisibility = async (e, project) => {
        e.stopPropagation(); // Prevent navigation
        const token = localStorage.getItem('token');
        const newStatus = !project.is_public;

        try {
            const res = await fetch(`http://localhost:3000/api/projects/${project.id}/visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_public: newStatus })
            });

            if (res.ok) {
                setProjects(projects.map(p =>
                    p.id === project.id ? { ...p, is_public: newStatus } : p
                ));
            } else {
                alert('Failed to update visibility');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating visibility');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: '#282828', padding: '30px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h2>Create New Project</h2>
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            style={{ padding: '10px', fontSize: '1.1em', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#121212', color: 'white' }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ backgroundColor: 'transparent', border: '1px solid #555' }}>Cancel</button>
                            <button onClick={handleCreateNew} style={{ backgroundColor: '#1db954', color: 'black' }}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Section */}
            <div style={{ backgroundColor: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: isEditing ? 'pointer' : 'default',
                        border: isEditing ? '2px dashed #1db954' : 'none'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={isEditing ? handleDrop : null}
                    onClick={() => isEditing && document.getElementById('fileInput').click()}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em' }}>
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                    {isEditing && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.6em', textAlign: 'center', padding: '2px' }}>
                            Change
                        </div>
                    )}
                    <input
                        type="file"
                        id="fileInput"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                        accept="image/*"
                    />
                </div>

                <div style={{ flex: 1 }}>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                style={{ padding: '5px' }}
                            />
                            <div>
                                <button onClick={handleUpdateProfile} style={{ marginRight: '10px', backgroundColor: '#1db954', color: 'black' }}>Save</button>
                                <button onClick={() => { setIsEditing(false); setPreviewUrl(user.avatar_url); setSelectedFile(null); }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ margin: 0 }}>{user.nickname || user.username}</h2>
                            <p style={{ color: '#888', margin: '5px 0' }}>@{user.username}</p>
                            <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.8em', padding: '5px 10px' }}>Edit Profile</button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => navigate('/foryou')}>Main</button>
                    {!!user.is_admin && (
                        <button onClick={() => navigate('/admin')} style={{ backgroundColor: '#ff4444' }}>Admin Dashboard</button>
                    )}
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>My Projects</h1>
                <button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: '#1db954', color: 'black' }}>New Project</button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        style={{
                            padding: '15px',
                            backgroundColor: '#282828',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div>
                            <span style={{ fontWeight: 'bold', display: 'block' }}>{project.name}</span>
                            <span style={{ fontSize: '0.8em', color: project.is_public ? '#1db954' : '#888' }}>
                                {project.is_public ? 'Public' : 'Private'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                onClick={(e) => handleToggleVisibility(e, project)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: project.is_public ? '#1db954' : '#555',
                                    padding: '5px 10px',
                                    borderRadius: '20px',
                                    transition: 'background-color 0.3s',
                                    userSelect: 'none'
                                }}
                            >
                                <span style={{ marginRight: '8px', fontSize: '0.8em', fontWeight: 'bold', color: 'white' }}>
                                    {project.is_public ? 'Public' : 'Private'}
                                </span>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    transform: project.is_public ? 'translateX(0)' : 'translateX(-2px)',
                                    transition: 'transform 0.3s'
                                }} />
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this project?')) {
                                        const token = localStorage.getItem('token');
                                        fetch(`http://localhost:3000/api/projects/${project.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        }).then(res => {
                                            if (res.ok) {
                                                setProjects(projects.filter(p => p.id !== project.id));
                                            } else {
                                                alert('Failed to delete project');
                                            }
                                        });
                                    }
                                }}
                                style={{
                                    backgroundColor: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && <p>No projects yet. Create one!</p>}
            </div>
        </div>
    );
}

export default Dashboard;
