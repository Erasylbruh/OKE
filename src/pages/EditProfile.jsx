import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCamera } from 'react-icons/fa';
import API_URL from '../config';


function EditProfile() {
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);


    const navigate = useNavigate();

    // Password Validation Rules
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /\d/.test(password);
    const hasSpecial = /[!@#$%&]/.test(password);

    const isPasswordValid = !password || (hasLength && hasUpper && hasNum && hasSpecial);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/auth');

            try {
                const res = await fetch(`${API_URL}/api/users/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setNickname(data.nickname || '');
                    setUsername(data.username || '');
                    setAvatarUrl(data.avatar_url || '');
                } else {
                    navigate('/auth');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load profile');
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/users/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setAvatarUrl(data.avatar_url);
                // Update local storage user
                const storedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, avatar_url: data.avatar_url }));
            } else {
                setError('Failed to upload avatar');
            }
        } catch (err) {
            console.error(err);
            setError('Error uploading avatar');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSaving(true);

        if (password && !isPasswordValid) {
            setError('Password does not meet requirements');
            setIsSaving(false);
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/users/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nickname,
                    username, // Assuming backend supports username update
                    password: password || undefined
                })
            });

            if (res.ok) {
                await res.json();
                setMessage('Profile updated successfully');
                setPassword('');
                // Update local storage
                const storedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, nickname, username }));
                setTimeout(() => navigate('/settings'), 1500);
            } else {
                const msg = await res.text();
                setError(`Error: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            setError('Error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem', marginRight: '15px' }}>
                    &larr;
                </button>
                <h1 style={{ margin: 0 }}>Edit Profile</h1>
            </div>

            <div className="card">
                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '15px' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#333',
                            border: '2px solid #1db954'
                        }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff' }}>
                                    {username[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <label htmlFor="avatar-upload" style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            backgroundColor: '#1db954',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '2px solid #121212'
                        }}>
                            <FaCamera size={14} />
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </div>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>Tap camera icon to change</div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Nickname */}
                    <div>
                        <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Display Name"
                            style={{ backgroundColor: '#121212' }}
                        />
                    </div>

                    {/* Username (Login) */}
                    <div>
                        <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Login (Username)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ backgroundColor: '#121212' }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                style={{ backgroundColor: '#121212', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        {/* Password Validation Feedback */}
                        {password && (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ fontSize: '12px', color: hasLength ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {hasLength ? '✓' : '○'} At least 8 characters
                                </div>
                                <div style={{ fontSize: '12px', color: hasUpper ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {hasUpper ? '✓' : '○'} At least one capital letter
                                </div>
                                <div style={{ fontSize: '12px', color: hasNum ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {hasNum ? '✓' : '○'} At least one number
                                </div>
                                <div style={{ fontSize: '12px', color: hasSpecial ? '#1db954' : '#ff5555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {hasSpecial ? '✓' : '○'} At least one special character (!,@,#,$,%,&)
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <div style={{ color: '#ff5555', textAlign: 'center' }}>{error}</div>}
                    {message && <div style={{ color: '#1db954', textAlign: 'center' }}>{message}</div>}

                    <button
                        type="submit"
                        className="primary"
                        disabled={isSaving || (password && !isPasswordValid)}
                        style={{ marginTop: '10px', padding: '12px', opacity: (isSaving || (password && !isPasswordValid)) ? 0.7 : 1 }}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;
