import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera } from 'react-icons/fa';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function EditProfile() {
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await client.get('/api/users/settings');
                if (data) {
                    setUser(data);
                    setNickname(data.nickname || '');
                    setAvatarUrl(data.avatar_url || '');
                }
            } catch (err) {
                setError('Failed to load profile');
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Предварительно показываем превью (опционально)
        setAvatarUrl(URL.createObjectURL(file)); 
        // Но реально грузить будем при сохранении, или можно сразу
        // В текущей логике контроллера updateProfile принимает и файл и поля
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSaving(true);

        const formData = new FormData();
        formData.append('nickname', nickname);
        
        // Получаем файл из инпута, если он был выбран
        const fileInput = document.getElementById('avatar-upload');
        if (fileInput && fileInput.files[0]) {
            formData.append('avatar', fileInput.files[0]);
        }
        // Если файл не выбран, аватар не меняется (или можно отправить старый URL, но контроллер ждет файл)
        // В текущем контроллере updateProfile, если файла нет, он берет req.body.avatar_url.
        if (!fileInput?.files[0]) {
             formData.append('avatar_url', avatarUrl);
        }

        try {
            const data = await client.upload('/api/users/profile', formData);
            if (data) {
                setMessage('Profile updated successfully');
                // Update local storage
                const storedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, nickname, avatar_url: data.avatar_url }));
                setTimeout(() => navigate('/settings'), 1500);
            }
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem', marginRight: '15px' }}>&larr;</button>
                <h1 style={{ margin: 0 }}>{t('edit_profile')}</h1>
            </div>

            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '15px' }}>
                        <div className="user-avatar" style={{ width: '100%', height: '100%', fontSize: '2rem', border: '2px solid var(--primary)' }}>
                            {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : (user.username?.[0]?.toUpperCase())}
                        </div>
                        <label htmlFor="avatar-upload" style={{
                            position: 'absolute', bottom: '0', right: '0',
                            backgroundColor: 'var(--primary)', color: 'white',
                            borderRadius: '50%', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '2px solid #121212'
                        }}>
                            <FaCamera size={14} />
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="dark-input"
                            placeholder="Display Name"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Username</label>
                        <input
                            type="text"
                            value={user.username}
                            disabled
                            className="dark-input"
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        />
                    </div>

                    {error && <div style={{ color: '#ff5555', textAlign: 'center' }}>{error}</div>}
                    {message && <div style={{ color: '#1db954', textAlign: 'center' }}>{message}</div>}

                    <button type="submit" className="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : t('save')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;