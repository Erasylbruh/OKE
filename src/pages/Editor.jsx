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

    // Refactor State
    const [activePhase, setActivePhase] = useState(1); // 1: Lyrics/Audio, 2: Style, 3: Publishing
    const [viewTab, setViewTab] = useState('lyrics'); // 'lyrics' (animation), 'info'
    const [description, setDescription] = useState('');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [projectOwner, setProjectOwner] = useState(null);

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

                    setProjectOwner({
                        id: project.user_id,
                        username: project.username,
                        nickname: project.nickname,
                        avatar_url: project.avatar_url
                    });

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
                    setDescription(data.description || '');
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
            data: { lyrics, styles, description }
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
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#121212',
            color: 'white',
            overflow: 'hidden'
        }}>
            {/* Toolbar */}
            <div className="editor-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>
                        &larr;
                    </button>
                    <h1 className="project-title">
                        {projectName || 'Untitled Project'}
                    </h1>
                </div>

                {/* Phase Navigation (Owner Only) */}
                {isOwner && (
                    <div className="phase-nav mobile-hidden" style={{ margin: 0, border: 'none', background: 'none' }}>
                        <div className={`phase-step ${activePhase === 1 ? 'active' : ''}`} onClick={() => setActivePhase(1)}>
                            1. {t('lyrics_and_audio')}
                        </div>
                        <div className={`phase-step ${activePhase === 2 ? 'active' : ''}`} onClick={() => setActivePhase(2)}>
                            2. {t('style')}
                        </div>
                        <div className={`phase-step ${activePhase === 3 ? 'active' : ''}`} onClick={() => setActivePhase(3)}>
                            3. {t('publishing')}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {!isOwner && <LikeButton projectId={id} />}
                    {isOwner && (
                        <button
                            id="save-btn"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="primary save-btn"
                            style={{ padding: '8px 24px', borderRadius: '20px' }}
                        >
                            {isSaving ? 'Saving...' : t('save')}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>

                {isOwner ? (
                    /* --- EDITOR MODE (3 Phases) --- */
                    <>
                        {/* Phase 1: Lyrics & Audio (Left Panel) */}
                        {activePhase === 1 && (
                            <div className="editor-panel left-panel" style={{
                                width: '450px',
                                borderRight: '1px solid #333',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#181818',
                                height: '100%'
                            }}>
                                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                    {/* Audio Upload Section */}
                                    <section style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#222', borderRadius: '8px' }}>
                                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>Audio</h3>
                                        {!isUploading ? (
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <label className="primary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '20px', display: 'inline-block' }}>
                                                    {audioUrl ? t('change_track') : t('upload_audio')}
                                                    <input type="file" accept=".mp3,audio/mpeg" onChange={handleAudioUpload} style={{ display: 'none' }} />
                                                </label>
                                                {audioUrl && (
                                                    <button onClick={handleDeleteAudio} style={{ background: 'none', border: '1px solid #ff5555', color: '#ff5555', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ color: '#1db954' }}>Uploading... {uploadProgress}%</div>
                                        )}
                                    </section>

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

                        {/* Center Panel: Preview (Always visible in Editor Mode) */}
                        <div className="editor-panel center-panel" style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#121212',
                            position: 'relative',
                            height: '100%'
                        }}>
                            <Preview lyrics={lyrics} styles={styles} resetTrigger={resetTrigger} audioUrl={audioUrl} backgroundImageUrl={previewUrls[0]} />
                        </div>

                        {/* Phase 2: Style (Right Panel) */}
                        {activePhase === 2 && (
                            <div className="editor-panel right-panel" style={{
                                width: '450px',
                                borderLeft: '1px solid #333',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#181818',
                                height: '100%'
                            }}>
                                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('style')}</h3>
                                    <StyleControls styles={styles} onUpdate={setStyles} />
                                </div>
                            </div>
                        )}

                        {/* Phase 3: Publishing (Right Panel) */}
                        {activePhase === 3 && (
                            <div className="editor-panel right-panel" style={{
                                width: '450px',
                                borderLeft: '1px solid #333',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#181818',
                                height: '100%'
                            }}>
                                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('publishing')}</h3>

                                    {/* Title Input */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>{t('project_name')}</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', background: '#222', color: 'white' }}
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>{t('description')}</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={5}
                                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', background: '#222', color: 'white', resize: 'vertical' }}
                                        />
                                    </div>

                                    {/* Preview Uploads */}
                                    <section style={{ marginBottom: '20px' }}>
                                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('preview')}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                            {previewUrls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'relative',
                                                        aspectRatio: '1',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        border: index === 0 ? '2px solid #1db954' : '1px solid #333',
                                                        cursor: 'pointer',
                                                        backgroundColor: '#282828',
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                                                    }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleSlotDrop(e, index)}
                                                    onClick={() => document.getElementById(`preview-upload-${index}`).click()}
                                                >
                                                    {url ? (
                                                        <img src={url} alt={`Slot ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '2rem' }}>+</div>
                                                    )}
                                                    {url && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeletePreview(index); }}
                                                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                                                        >✕</button>
                                                    )}
                                                    {url && index !== 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSetMainPreview(index); }}
                                                            style={{ position: 'absolute', bottom: '5px', right: '50%', transform: 'translateX(50%)', background: 'rgba(0,0,0,0.8)', color: '#1db954', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                                                        >★</button>
                                                    )}
                                                    <input type="file" id={`preview-upload-${index}`} style={{ display: 'none' }} accept="image/*" onChange={(e) => handlePreviewUpload(index, e.target.files[0])} />
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>{t('drag_drop_images')}</p>
                                    </section>

                                    {/* Visibility Toggle */}
                                    <div
                                        onClick={() => setIsPublic(!isPublic)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: '#333',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            marginBottom: '20px'
                                        }}
                                    >
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isPublic ? '#1db954' : '#888' }} />
                                        <span>{isPublic ? t('public') : t('private')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* --- VIEWER MODE (2 Tabs) --- */
                    <>
                        {/* Tab 1: Lyrics (Animation) */}
                        {viewTab === 'lyrics' && (
                            <div className="editor-panel center-panel" style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#121212',
                                position: 'relative',
                                height: '100%'
                            }}>
                                <Preview lyrics={lyrics} styles={styles} resetTrigger={resetTrigger} audioUrl={audioUrl} backgroundImageUrl={previewUrls[0]} />
                            </div>
                        )}

                        {/* Tab 2: Information */}
                        {viewTab === 'info' && (
                            <div className="editor-panel right-panel" style={{
                                width: '100%', // Full width on mobile/viewer
                                maxWidth: '600px',
                                margin: '0 auto',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#181818',
                                height: '100%'
                            }}>
                                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>{projectName}</h1>

                                    {/* User Profile */}
                                    {projectOwner && (
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}
                                            onClick={() => navigate(`/user/${projectOwner.username}`)}
                                        >
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333' }}>
                                                {projectOwner.avatar_url ? (
                                                    <img src={projectOwner.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                        {projectOwner.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{projectOwner.nickname || projectOwner.username}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>@{projectOwner.username}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className={`description-expander ${isDescriptionExpanded ? 'expanded' : ''}`} style={{ maxHeight: isDescriptionExpanded ? 'none' : '100px', marginBottom: '20px' }}>
                                        <p style={{ color: '#ccc', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{description || t('no_description') || 'No description'}</p>
                                        {!isDescriptionExpanded && description && description.length > 100 && <div className="description-gradient" />}
                                    </div>
                                    {description && description.length > 100 && (
                                        <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} style={{ background: 'none', border: 'none', color: '#1db954', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                                            {isDescriptionExpanded ? t('show_less') : t('show_more')}
                                        </button>
                                    )}

                                    {/* Likes */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                        <LikeButton projectId={id} />
                                    </div>

                                    <CommentsSection projectId={id} projectOwnerId={projectOwnerId} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Mobile Tabs for Viewer */}
            {!isOwner && (
                <div className="mobile-tabs">
                    <button
                        className={`tab-btn ${viewTab === 'lyrics' ? 'active' : ''}`}
                        onClick={() => setViewTab('lyrics')}
                    >
                        {t('lyrics')}
                    </button>
                    <button
                        className={`tab-btn ${viewTab === 'info' ? 'active' : ''}`}
                        onClick={() => setViewTab('info')}
                    >
                        {t('information')}
                    </button>
                </div>
            )}

            {/* Mobile Tabs for Editor (Phases) - Optional, if we want bottom nav for phases on mobile */}
            {isOwner && (
                <div className="mobile-tabs">
                    <button className={`tab-btn ${activePhase === 1 ? 'active' : ''}`} onClick={() => setActivePhase(1)}>1. {t('lyrics')}</button>
                    <button className={`tab-btn ${activePhase === 2 ? 'active' : ''}`} onClick={() => setActivePhase(2)}>2. {t('style')}</button>
                    <button className={`tab-btn ${activePhase === 3 ? 'active' : ''}`} onClick={() => setActivePhase(3)}>3. {t('publishing')}</button>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: '#181818', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', border: '1px solid #333' }}>
                        <h2 style={{ marginTop: 0, color: '#1db954', marginBottom: '20px' }}>{t('how_it_works')}</h2>
                        <button onClick={() => setShowHelp(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#1db954', border: 'none', borderRadius: '25px', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Editor;
