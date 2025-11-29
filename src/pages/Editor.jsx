import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import LyricInput from '../components/LyricInput';
import TimingEditor from '../components/TimingEditor';
import StyleControls from '../components/StyleControls';
import Preview from '../components/Preview';
import CommentsSection from '../components/CommentsSection';
import LikeButton from '../components/LikeButton';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';
import '../App.css';

function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    const [lyrics, setLyrics] = useState([]);
    const [styles, setStyles] = useState({
        fontSize: 24,
        activeFontSize: 32,
        color: '#ffffff',
        fillColor: '#1db954',
        backgroundColor: '#121212',
        fontFamily: 'Inter, sans-serif',
        fontUrl: ''
    });
    const [projectName, setProjectName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [isOwner, setIsOwner] = useState(true);
    const [projectOwnerId, setProjectOwnerId] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [previewUrls, setPreviewUrls] = useState([null, null, null]);
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'controls'
    const [showHelp, setShowHelp] = useState(false);

    // Load project
    useEffect(() => {
        if (!id) return;

        const fetchProject = async () => {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                const res = await fetch(`${API_URL}/api/projects/${id}`, { headers });
                if (res.ok) {
                    const project = await res.json();
                    setProjectName(project.name);
                    setIsPublic(!!project.is_public);
                    setProjectOwnerId(project.user_id);

                    const urls = project.preview_urls || [];
                    while (urls.length < 3) urls.push(null);
                    setPreviewUrls(urls);

                    // Check ownership
                    if (token) {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const isUserOwner = Number(user.id) === Number(project.user_id);

                        if (location.state && location.state.from === 'main') {
                            setIsOwner(false);
                        } else {
                            setIsOwner(isUserOwner);
                        }
                    } else {
                        setIsOwner(false);
                    }

                    let data = project.data;
                    if (typeof data === 'string') {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            console.error('Failed to parse data:', e);
                            data = {};
                        }
                    }
                    setLyrics(data.lyrics || []);
                    setStyles(prev => data.styles || prev);
                    setAudioUrl(project.audio_url);
                } else {
                    alert('Project not found or unauthorized');
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error(err);
                alert('Error loading project');
            }
        };
        fetchProject();
    }, [id, navigate, location.state]);

    // Reset animation on change
    useEffect(() => {
        setResetTrigger(prev => prev + 1);
    }, [lyrics, styles]);

    // Dynamic Font Loading
    useEffect(() => {
        if (styles.fontUrl) {
            const linkId = 'custom-font-link';
            let link = document.getElementById(linkId);
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
            link.href = styles.fontUrl;
        }
    }, [styles.fontUrl]);

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Enforce MP3
        if (!file.name.toLowerCase().endsWith('.mp3')) {
            alert(t('mp3_only_warning'));
            return;
        }

        const formData = new FormData();
        formData.append('audio', file);
        const token = localStorage.getItem('token');

        setIsUploading(true);
        setUploadProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/api/projects/${id}/audio`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = async () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                setAudioUrl(data.audio_url);

                // Auto-set lyrics if returned
                if (data.lyrics && data.lyrics.length > 0) {
                    setLyrics(data.lyrics);
                    // Also update timing editor if needed (it uses the same lyrics state)
                    alert('Audio uploaded and lyrics automatically transcribed!');
                }
            } else {
                console.error('Audio upload failed:', xhr.responseText);
                alert(`Failed to upload audio: ${xhr.responseText}`);
            }
        };

        xhr.onerror = () => {
            setIsUploading(false);
            console.error('Network Error');
            alert('Error uploading audio');
        };

        xhr.send(formData);

        // Reset file input
        e.target.value = null;
    };

    const handleDeleteAudio = async () => {
        if (!confirm('Remove audio?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}/audio`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAudioUrl(null);
            } else {
                alert('Failed to delete audio');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting audio');
        }
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 400, 400);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.9);
            };
        });
    };

    const handleLyricsParsed = (parsedInput) => {
        let initializedLyrics;

        if (parsedInput.length > 0 && typeof parsedInput[0] === 'object') {
            // Handle structured input (from LRC)
            initializedLyrics = parsedInput.map((item, index) => {
                const nextItem = parsedInput[index + 1];
                // Default duration 2s if no next line, otherwise up to next line
                const endTime = nextItem ? nextItem.start : (item.start + 2);

                return {
                    id: index,
                    text: item.text,
                    start: item.start,
                    end: endTime
                };
            });
        } else {
            // Handle legacy string array
            initializedLyrics = parsedInput.map((text, index) => ({
                id: index,
                text: text.trim(),
                start: 0,
                end: 0,
            }));
        }
        setLyrics(initializedLyrics);
    };

    const updateLyric = (index, field, value) => {
        setLyrics((prev) => {
            const newLyrics = [...prev];
            newLyrics[index] = { ...newLyrics[index], [field]: value };
            if (field === 'end' && index < newLyrics.length - 1) {
                newLyrics[index + 1] = { ...newLyrics[index + 1], start: value };
            }
            return newLyrics;
        });
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to save');

        const payload = {
            name: projectName,
            is_public: isPublic,
            data: { lyrics, styles }
        };

        try {
            setIsSaving(true);
            const res = await fetch(`${API_URL}/api/projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const btn = document.getElementById('save-btn');
                if (btn) {
                    const originalText = btn.innerText;
                    btn.innerText = 'Saved!';
                    setTimeout(() => btn.innerText = originalText, 2000);
                }
            } else {
                const msg = await res.text();
                alert(`Error saving project: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error saving project: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (location.state && location.state.from === 'main') {
            navigate('/');
        } else {
            navigate('/dashboard');
        }
    };

    const handlePreviewUpload = async (slot, file) => {
        if (!file) return;

        try {
            const resizedFile = await resizeImage(file);
            const formData = new FormData();
            formData.append('preview', resizedFile);
            formData.append('slot', slot);
            const token = localStorage.getItem('token');

            const res = await fetch(`${API_URL}/api/projects/${id}/preview`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                const newUrls = data.preview_urls || [];
                while (newUrls.length < 3) newUrls.push(null);
                setPreviewUrls(newUrls);
            } else {
                alert('Failed to upload preview');
            }
        } catch (err) {
            console.error(err);
            alert('Error uploading preview');
        }
    };

    const handleDeletePreview = async (slot) => {
        if (!confirm('Delete this preview image?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}/preview/${slot}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const newUrls = data.preview_urls || [];
                while (newUrls.length < 3) newUrls.push(null);
                setPreviewUrls(newUrls);
            } else {
                alert('Failed to delete preview');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting preview');
        }
    };

    const handleSetMainPreview = async (slot) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}/preview/main`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ slot })
            });
            if (res.ok) {
                const data = await res.json();
                const newUrls = data.preview_urls || [];
                while (newUrls.length < 3) newUrls.push(null);
                setPreviewUrls(newUrls);
            } else {
                alert('Failed to update main preview');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating main preview');
        }
    };

    const handleSlotDrop = (e, slot) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handlePreviewUpload(slot, file);
        }
    };

    return (
        <div className="editor-container" style={{
            height: '100vh',
            width: '100%', // Full width container
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#121212',
            color: 'white',
            overflow: 'hidden' // Prevent page scroll
        }}>
            {/* Mobile Tab Switcher */}
            <div className="mobile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                >
                    {t('preview')}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
                    onClick={() => setActiveTab('controls')}
                >
                    {t('controls')}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'style' ? 'active' : ''}`}
                    onClick={() => setActiveTab('style')}
                >
                    {t('style')}
                </button>
            </div>

            <style>{`
                .mobile-tabs {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background-color: #181818;
                    border-top: 1px solid #333;
                    z-index: 100;
                    height: 50px;
                }

                .tab-btn {
                    flex: 1;
                    background: none;
                    border: none;
                    color: #888;
                    font-weight: bold;
                    text-transform: uppercase;
                    cursor: pointer;
                    font-size: 14px;
                }

                .tab-btn.active {
                    color: #1db954;
                    border-top: 2px solid #1db954;
                }

                @media (max-width: 768px) {
                    .mobile-tabs {
                        display: flex;
                    }

                    .editor-panel {
                        width: 100% !important;
                        height: calc(100vh - 50px) !important; /* Subtract tab height */
                        position: absolute;
                        top: 0;
                        left: 0;
                        padding-bottom: 50px; /* Space for tabs */
                    }

                    .mobile-hidden {
                        display: none !important;
                    }

                    .mobile-visible {
                        display: flex !important;
                    }
                    
                    /* Hide right panel on mobile unless active */
                    .right-panel {
                        display: none; /* Default hidden on mobile */
                    }
                }
            `}</style>

            {/* Toolbar */}
            <div style={{
                height: '60px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                backgroundColor: '#181818',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>
                        &larr;
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {projectName || 'Untitled Project'}
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Audio Upload Button in Toolbar */}
                    {isOwner && (
                        <>
                            {!isUploading ? (
                                <label style={{
                                    cursor: 'pointer',
                                    backgroundColor: '#1db954',
                                    color: 'black',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'transform 0.2s, background-color 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.backgroundColor = '#1ed760';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.backgroundColor = '#1db954';
                                    }}
                                >
                                    <span>{audioUrl ? `🎵 ${t('change_track')}` : `☁️ ${t('upload_audio')}`}</span>
                                    <input type="file" accept=".mp3,audio/mpeg" onChange={handleAudioUpload} style={{ display: 'none' }} />
                                </label>
                            ) : (
                                <div style={{
                                    width: '150px',
                                    height: '36px',
                                    backgroundColor: '#333',
                                    borderRadius: '18px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: `${uploadProgress}%`,
                                        backgroundColor: '#1db954',
                                        transition: 'width 0.2s ease-out'
                                    }} />
                                    <span style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        {uploadProgress}%
                                    </span>
                                </div>
                            )}

                            {audioUrl && !isUploading && (
                                <button
                                    onClick={handleDeleteAudio}
                                    style={{
                                        background: 'rgba(255, 85, 85, 0.1)',
                                        border: '1px solid #ff5555',
                                        color: '#ff5555',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '50%',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ff5555';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 85, 85, 0.1)';
                                        e.currentTarget.style.color = '#ff5555';
                                    }}
                                    title={t('remove_audio')}
                                >
                                    ✕
                                </button>
                            )}
                        </>
                    )}

                    {!isOwner && <LikeButton projectId={id} />}
                    {isOwner && (
                        <>
                            <div
                                onClick={() => setIsPublic(!isPublic)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: '#333',
                                    padding: '6px 12px',
                                    borderRadius: '20px'
                                }}
                            >
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: isPublic ? '#1db954' : '#888'
                                }} />
                                <span style={{ fontSize: '0.9rem' }}>{isPublic ? t('public') : t('private')}</span>
                            </div>
                            <button
                                id="save-btn"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="primary"
                                style={{ padding: '8px 24px', borderRadius: '20px' }}
                            >
                                {isSaving ? 'Saving...' : t('save')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content - Studio Layout */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>

                {/* Left Panel: Lyrics & Timing (Owner Only) */}
                {isOwner && (
                    <div className={`editor-panel left-panel ${activeTab === 'controls' ? 'mobile-visible' : 'mobile-hidden'}`} style={{
                        width: '450px', // Fixed width 450px
                        borderRight: '1px solid #333',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#181818',
                        height: '100%' // Full height
                    }}>
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            <section style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('lyrics')}</h3>
                                <LyricInput onParse={handleLyricsParsed} />
                            </section>

                            {lyrics.length > 0 && (
                                <section>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('timing')}</h3>
                                    <TimingEditor lyrics={lyrics} onUpdate={updateLyric} />
                                </section>
                            )}
                        </div>
                    </div>
                )}

                {/* Center Panel: Preview */}
                <div className={`editor-panel center-panel ${activeTab === 'preview' ? 'mobile-visible' : 'mobile-hidden'}`} style={{
                    width: '569px', // Fixed width 569px
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#121212',
                    position: 'relative',
                    height: '100%' // Full height
                }}>
                    <Preview lyrics={lyrics} styles={styles} resetTrigger={resetTrigger} audioUrl={audioUrl} backgroundImageUrl={previewUrls[0]} />
                </div>

                {/* Right Panel: Settings (Owner) or Comments (Viewer) */}
                <div className={`editor-panel right-panel ${activeTab === 'style' ? 'mobile-visible' : 'mobile-hidden'}`} style={{
                    width: '450px', // Fixed width 450px
                    borderLeft: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#181818',
                    height: '100%' // Full height
                }}>
                    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                        {isOwner ? (
                            <>
                                <section style={{ marginBottom: '30px' }}>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('style')}</h3>
                                    <StyleControls styles={styles} onUpdate={setStyles} />
                                </section>

                                <section>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('backgrounds')}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {previewUrls.map((url, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    position: 'relative',
                                                    aspectRatio: '1',
                                                    borderRadius: '50%', // Circular for vinyl look
                                                    overflow: 'hidden',
                                                    border: index === 0 ? '2px solid #1db954' : '1px solid #333',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#282828',
                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)', // Shadow for depth
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleSlotDrop(e, index)}
                                                onClick={() => document.getElementById(`preview-upload-${index}`).click()}
                                            >
                                                {/* Vinyl Center Hole Effect */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '15%',
                                                    height: '15%',
                                                    backgroundColor: '#181818',
                                                    borderRadius: '50%',
                                                    zIndex: 2,
                                                    border: '2px solid #333'
                                                }} />

                                                {/* Vinyl Grooves Effect (Subtle overlay) */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'repeating-radial-gradient(#000 0, #000 2px, transparent 3px, transparent 4px)',
                                                    opacity: 0.1,
                                                    zIndex: 1,
                                                    pointerEvents: 'none'
                                                }} />

                                                {url ? (
                                                    <img src={url} alt={`Slot ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1.5rem' }}>+</div>
                                                )}

                                                {url && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePreview(index); }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            background: 'rgba(0,0,0,0.8)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            lineHeight: 1,
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}

                                                {url && index !== 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSetMainPreview(index); }}
                                                        style={{
                                                            position: 'absolute', bottom: '5px', right: '50%',
                                                            transform: 'translateX(50%)',
                                                            background: 'rgba(0,0,0,0.8)', color: '#1db954',
                                                            border: 'none', borderRadius: '4px',
                                                            padding: '2px 6px', fontSize: '10px',
                                                            cursor: 'pointer',
                                                            zIndex: 3
                                                        }}
                                                    >
                                                        ★
                                                    </button>
                                                )}

                                                <input
                                                    type="file"
                                                    id={`preview-upload-${index}`}
                                                    style={{ display: 'none' }}
                                                    accept="image/*"
                                                    onChange={(e) => handlePreviewUpload(index, e.target.files[0])}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                                        {t('drag_drop_images')}
                                    </p>
                                </section>
                            </>
                        ) : (
                            <CommentsSection projectId={id} projectOwnerId={projectOwnerId} />
                        )}
                    </div>
                </div>
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#181818',
                        padding: '30px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        border: '1px solid #333',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ marginTop: 0, color: '#1db954', marginBottom: '20px' }}>{t('how_it_works')}</h2>

                        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: '#333', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                                <span>{t('upload_step')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: '#333', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                                <span>{t('lyrics_step')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: '#333', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                                <span>{t('timing_step')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: '#333', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>4</span>
                                <span>{t('style_step')}</span>
                            </div>
                        </div>

                        <div style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255, 165, 0, 0.3)' }}>
                            <h4 style={{ marginTop: 0, color: 'orange', marginBottom: '10px' }}>{t('important_notes')}</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#ddd' }}>
                                <li>{t('mp3_only_warning')}</li>
                                <li>{t('no_transcription_warning')}</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setShowHelp(false)}
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#1db954',
                                border: 'none',
                                borderRadius: '25px',
                                color: 'black',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
        </div >
    );
}

export default Editor;
