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
                    // Load audio if exists (assuming it's saved in data for now, or separate field)
                    // For this implementation, we'll assume it's transient or user uploads it each time
                    // unless we add backend support. The prompt says "Let user upload audio", implying session-based or local for now.
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

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
        }
        // Reset file input
        e.target.value = null;
    };

    const handleDeleteAudio = () => {
        setAudioUrl(null);
    };

    const handleLyricsParsed = (parsedLines) => {
        const initializedLyrics = parsedLines.map((text, index) => ({
            id: index,
            text: text.trim(),
            start: 0,
            end: 0,
        }));
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
            navigate('/foryou');
        } else {
            navigate('/dashboard');
        }
    };

    const handlePreviewUpload = async (slot, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('preview', file);
        formData.append('slot', slot);
        const token = localStorage.getItem('token');

        try {
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
        <div style={{
            height: '100vh',
            width: '100%', // Full width container
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#121212',
            color: 'white',
            overflow: 'hidden' // Prevent page scroll
        }}>
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
                            <label style={{
                                cursor: 'pointer',
                                backgroundColor: '#333',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <span>🎵 {audioUrl ? 'Change Audio' : 'Upload Audio'}</span>
                                <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
                            </label>
                            {audioUrl && (
                                <button
                                    onClick={handleDeleteAudio}
                                    style={{
                                        background: '#333',
                                        border: 'none',
                                        color: '#ff5555',
                                        cursor: 'pointer',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title="Remove Audio"
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
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>

                {/* Left Panel: Lyrics & Timing (Owner Only) */}
                {isOwner && (
                    <div style={{
                        width: '450px', // Fixed width 450px
                        borderRight: '1px solid #333',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#181818',
                        height: '100%' // Full height
                    }}>
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            <section style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>Lyrics</h3>
                                <LyricInput onParse={handleLyricsParsed} />
                            </section>

                            {lyrics.length > 0 && (
                                <section>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>Timing</h3>
                                    <TimingEditor lyrics={lyrics} onUpdate={updateLyric} />
                                </section>
                            )}
                        </div>
                    </div>
                )}

                {/* Center Panel: Preview */}
                <div style={{
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
                <div style={{
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
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>Style</h3>
                                    <StyleControls styles={styles} onUpdate={setStyles} />
                                </section>

                                <section>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>Backgrounds</h3>
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
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '15px',
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
                                        Drag & drop images or click to upload. First slot is the cover.
                                    </p>
                                </section>
                            </>
                        ) : (
                            <CommentsSection projectId={id} projectOwnerId={projectOwnerId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Editor;
