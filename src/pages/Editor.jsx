import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import LyricInput from '../components/LyricInput';
import TimingEditor from '../components/TimingEditor';
import StyleControls from '../components/StyleControls';
import Preview from '../components/Preview';
import CommentsSection from '../components/CommentsSection';
import LikeButton from '../components/LikeButton';
import ProjectCard from '../components/ProjectCard';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast';
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
        backgroundColor: 'var(--bg-main)',
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
    const [likesCount, setLikesCount] = useState(0);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

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
                    setLikesCount(project.likes_count || 0);
                } else {
                    toast.error('Project not found or unauthorized');
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error(err);
                toast.error('Error loading project');
            }
        };
        fetchProject();
    }, [id, navigate, location.state]);

    // Keyboard Shortcuts
    useKeyboardShortcuts([
        {
            key: 's',
            ctrl: true,
            callback: () => {
                if (isOwner) {
                    handleSave();
                }
            }
        },
        {
            key: '?',
            callback: () => {
                setShowKeyboardHelp(true);
            }
        },
        {
            key: 'Escape',
            callback: () => {
                setShowKeyboardHelp(false);
            }
        }
    ]);

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
            toast.error(t('mp3_only_warning') || 'Please upload MP3 files only');
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
                    toast.success('Audio uploaded and lyrics automatically transcribed!');
                } else {
                    toast.success('Audio uploaded successfully!');
                }
            } else {
                console.error('Audio upload failed:', xhr.responseText);
                toast.error(`Failed to upload audio: ${xhr.responseText}`);
            }
        };

        xhr.onerror = () => {
            setIsUploading(false);
            console.error('Network Error');
            toast.error('Error uploading audio - network issue');
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
                toast.success('Audio removed');
            } else {
                toast.error('Failed to delete audio');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting audio');
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
                // Use existing end time if available (SRT), otherwise calculate default
                let endTime = item.end;

                if (endTime === undefined || endTime === null) {
                    // Default duration 2s if no next line, otherwise up to next line
                    endTime = nextItem ? nextItem.start : (item.start + 2);
                }

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
            if (field === 'remove') {
                return prev.filter((_, i) => i !== index);
            }
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
        if (!token) {
            toast.error('Please login to save');
            return;
        }

        const payload = {
            name: projectName,
            is_public: isPublic,
            data: { lyrics, styles, description }
        };

        const savePromise = (async () => {
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
                    return 'Project saved successfully!';
                } else {
                    const msg = await res.text();
                    throw new Error(msg);
                }
            } catch (err) {
                console.error(err);
                throw new Error(err.message);
            } finally {
                setIsSaving(false);
            }
        })();

        toast.promise(savePromise, {
            loading: 'Saving project...',
            success: (message) => message,
            error: (err) => `Error saving: ${err.message}`
        });
    };

    const handleBack = () => {
        if (isOwner) {
            navigate('/dashboard');
        } else {
            navigate(-1);
        }
    };

    // Update all lyrics text without changing timestamps
    const updateAllLyricsText = (newLyricsText) => {
        const lines = newLyricsText.split('\n').filter(line => line.trim());
        setLyrics(prev => {
            const updated = [...prev];
            lines.forEach((line, index) => {
                if (updated[index]) {
                    updated[index] = { ...updated[index], text: line.trim() };
                }
            });
            return updated;
        });
    };

    // Download lyrics as plain text file
    const downloadLyricsText = () => {
        const text = lyrics.map(l => l.text).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'lyrics'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Download lyrics with SRT timestamps
    const downloadLyricsSRT = () => {
        const formatSRTTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            const ms = Math.floor((seconds % 1) * 1000);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
        };

        const srtContent = lyrics.map((lyric, index) => {
            return `${index + 1}\n${formatSRTTime(lyric.start)} --> ${formatSRTTime(lyric.end)}\n${lyric.text}\n`;
        }).join('\n');

        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'lyrics'}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            maxHeight: 'calc(100% - 60px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            zIndex: 2000 // Ensure it sits on top of everything
        }}>
            {/* Phase Navigation (Owner Only) - Desktop Only */}
            {isOwner && (
                <div className="phase-nav mobile-hidden" style={{
                    margin: 0,
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    padding: '50px 0 15px'
                }}>
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

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '25px' }}>

                {isOwner ? (
                    /* --- EDITOR MODE --- */
                    <div className="editor-desktop-container">
                        {/* Phase 1: Lyrics & Audio (Left Panel) */}
                        <div className={`editor-panel left-panel ${activePhase !== 1 ? 'mobile-hidden' : ''}`} style={{
                            borderRight: '1px solid var(--border-color)',
                            display: activePhase === 1 ? 'flex' : 'none',
                            flexDirection: 'column',
                            backgroundColor: 'var(--bg-surface)',
                            overflowY: 'auto'
                        }}>
                            <div style={{ padding: '20px', flex: 1 }}>
                                {/* Audio Upload Section (Vinyl Style) */}
                                <section className="audio-upload-section" style={{ textAlign: 'center', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                                    <div
                                        onClick={() => document.getElementById('audio-upload').click()}
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--bg-surface)',
                                            border: '2px solid var(--border-color)',
                                            margin: '0 auto 15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        {/* Vinyl Grooves */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                            background: 'repeating-radial-gradient(var(--bg-surface) 0, var(--bg-surface) 2px, var(--bg-input) 3px, var(--bg-input) 4px)',
                                            borderRadius: '50%'
                                        }} />

                                        {/* Center Label */}
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: audioUrl ? '#1db954' : '#333',
                                            zIndex: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-primary)',
                                            fontWeight: 'bold'
                                        }}>
                                            {isUploading ? '...' : (audioUrl ? '♫' : '+')}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {audioUrl ? t('change_track') : t('upload_audio')}
                                        </span>
                                    </div>

                                    <input id="audio-upload" type="file" accept=".mp3,audio/mpeg" onChange={handleAudioUpload} style={{ display: 'none' }} />

                                    {audioUrl && (
                                        <button
                                            onClick={handleDeleteAudio}
                                            style={{
                                                background: 'none',
                                                border: '1px solid #ff5555',
                                                color: '#ff5555',
                                                borderRadius: '20px',
                                                padding: '4px 12px',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {t('remove_audio') || 'Remove Audio'}
                                        </button>
                                    )}
                                </section>

                                <section style={{ marginBottom: '30px' }}>
                                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('lyrics')}</h3>
                                    <LyricInput onParse={handleLyricsParsed} />
                                </section>

                                {lyrics.length > 0 && (
                                    <section>
                                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('timing')}</h3>
                                        {activePhase === 1 && (
                                            <>
                                                {/* Bulk Lyrics Text Editor */}
                                                <div style={{
                                                    marginBottom: '20px',
                                                    padding: '15px',
                                                    backgroundColor: 'var(--bg-card)',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '10px'
                                                    }}>
                                                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                                                            Edit All Lyrics
                                                        </h3>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button
                                                                onClick={downloadLyricsText}
                                                                disabled={lyrics.length === 0}
                                                                style={{
                                                                    background: 'var(--bg-input)',
                                                                    border: '1px solid var(--border-color)',
                                                                    color: 'var(--text-primary)',
                                                                    padding: '8px 16px',
                                                                    borderRadius: '8px',
                                                                    cursor: lyrics.length === 0 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px',
                                                                    opacity: lyrics.length === 0 ? 0.5 : 1,
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                📄 Download TXT
                                                            </button>
                                                            <button
                                                                onClick={downloadLyricsSRT}
                                                                disabled={lyrics.length === 0}
                                                                style={{
                                                                    background: 'var(--bg-input)',
                                                                    border: '1px solid var(--border-color)',
                                                                    color: 'var(--text-primary)',
                                                                    padding: '8px 16px',
                                                                    borderRadius: '8px',
                                                                    cursor: lyrics.length === 0 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px',
                                                                    opacity: lyrics.length === 0 ? 0.5 : 1,
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                🎬 Download SRT
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        value={lyrics.map(l => l.text).join('\n')}
                                                        onChange={(e) => updateAllLyricsText(e.target.value)}
                                                        placeholder="Paste or edit all lyrics here (one per line). Timestamps will be preserved."
                                                        style={{
                                                            width: '100%',
                                                            minHeight: '150px',
                                                            padding: '12px',
                                                            backgroundColor: 'var(--bg-input)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '14px',
                                                            fontFamily: 'Inter, sans-serif',
                                                            resize: 'vertical',
                                                            lineHeight: '1.5'
                                                        }}
                                                    />
                                                    <div style={{
                                                        marginTop: '8px',
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        💡 Edit the lyrics text here. Timing will remain unchanged.
                                                    </div>
                                                </div>

                                                {/* Individual Lyric Timing Editor */}
                                                <TimingEditor lyrics={lyrics} onUpdate={updateLyric} />
                                            </>
                                        )}
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Phase 2: Style (Right Panel) */}
                        <div className={`editor-panel right-panel ${activePhase !== 2 ? 'mobile-hidden' : ''}`} style={{
                            borderRight: '1px solid var(--border-color)',
                            display: activePhase === 2 ? 'flex' : 'none',
                            flexDirection: 'column',
                            backgroundColor: 'var(--bg-surface)',
                            overflowY: 'auto'
                        }}>
                            <div style={{ padding: '20px', flex: 1 }}>
                                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('style')}</h3>
                                <StyleControls styles={styles} onUpdate={setStyles} />
                            </div>
                        </div>

                        {/* Phase 3: Publishing (Right Panel) */}
                        <div className={`editor-panel right-panel ${activePhase !== 3 ? 'mobile-hidden' : ''}`} style={{
                            borderRight: '1px solid var(--border-color)',
                            display: activePhase === 3 ? 'flex' : 'none',
                            flexDirection: 'column',
                            backgroundColor: 'var(--bg-surface)',
                            overflowY: 'auto'
                        }}>
                            <div style={{ padding: '20px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        &larr; {t('back') || 'Back'}
                                    </button>
                                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>{t('publishing')}</h3>
                                </div>

                                {/* Title Input */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>{t('project_name')}</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {/* Description Input */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>{t('description')}</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={5}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', resize: 'vertical' }}
                                    />
                                </div>

                                {/* Preview Uploads */}
                                <section style={{ marginBottom: '20px' }}>
                                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '15px' }}>{t('preview')}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {previewUrls.map((url, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    position: 'relative',
                                                    aspectRatio: '1',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: index === 0 ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'var(--bg-input)',
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
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            background: 'rgba(0,0,0,0.8)',
                                                            color: 'var(--text-primary)',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '32px',
                                                            height: '32px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '16px',
                                                            padding: 0,
                                                            lineHeight: 1,
                                                            boxSizing: 'border-box',
                                                            aspectRatio: '1 / 1'
                                                        }}
                                                    >
                                                        <FaTimes size={14} />
                                                    </button>
                                                )}
                                                {url && index !== 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSetMainPreview(index); }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '10px',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            background: 'rgba(0,0,0,0.8)',
                                                            color: 'var(--brand-primary)',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px',
                                                            padding: 0,
                                                            lineHeight: 1
                                                        }}
                                                    >★</button>
                                                )}
                                                <input type="file" id={`preview-upload-${index}`} style={{ display: 'none' }} accept="image/*" onChange={(e) => handlePreviewUpload(index, e.target.files[0])} />
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>{t('drag_drop_images')}</p>
                                </section>

                                {/* Visibility & Save */}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-input)', padding: '10px 15px', borderRadius: '25px' }}>
                                        <span style={{ fontSize: '0.9rem', color: isPublic ? '#1db954' : '#b3b3b3', fontWeight: 'bold' }}>
                                            {isPublic ? t('public') : t('private')}
                                        </span>
                                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isPublic}
                                                onChange={(e) => setIsPublic(e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span className="slider round" style={{
                                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                backgroundColor: isPublic ? '#1db954' : '#555', transition: '.4s', borderRadius: '20px'
                                            }}>
                                                <span style={{
                                                    position: 'absolute', content: '""', height: '16px', width: '16px',
                                                    left: isPublic ? '22px' : '2px', bottom: '2px', backgroundColor: 'white',
                                                    transition: '.4s', borderRadius: '50%'
                                                }}></span>
                                            </span>
                                        </label>
                                    </div>

                                    <button
                                        id="save-btn"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="primary save-btn"
                                        style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: 'var(--brand-primary)', color: 'black' }}
                                    >
                                        {isSaving ? 'Saving...' : t('save')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Center Panel: Preview */}
                        {/* Always visible on desktop. On mobile, only visible in Phase 4 */}
                        <div className={`editor-panel center-panel ${activePhase !== 4 ? 'mobile-hidden' : ''}`} style={{
                            display: 'flex', // Overridden by mobile-hidden class on mobile
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            height: '100%'
                        }}>
                            <Preview lyrics={lyrics} styles={styles} resetTrigger={resetTrigger} audioUrl={audioUrl} backgroundImageUrl={previewUrls[0]} projectName={projectName} />
                        </div>
                    </div>
                ) : (
                    /* --- VIEWER MODE --- */
                    <div className="viewer-desktop-container">
                        {/* Tab 1: Lyrics (Animation) */}
                        <div className={`editor-panel center-panel ${viewTab === 'lyrics' ? 'mobile-visible' : 'mobile-hidden'}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            height: '100%'
                        }}>
                            <Preview lyrics={lyrics} styles={styles} resetTrigger={resetTrigger} audioUrl={audioUrl} backgroundImageUrl={previewUrls[0]} projectName={projectName} />
                        </div>

                        {/* Tab 2: Information */}
                        <div className={`editor-panel right-panel ${viewTab === 'info' ? 'mobile-visible' : 'mobile-hidden'}`} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'var(--bg-surface)',
                            height: '100%',
                            overflowY: 'auto'
                        }}>
                            <div style={{ padding: '20px', flex: 1 }}>
                                <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    &larr; {t('back') || 'Back'}
                                </button>

                                {/* Project Card Header */}
                                <div style={{ marginBottom: '20px' }}>
                                    <ProjectCard
                                        project={{
                                            id: id,
                                            name: projectName,
                                            username: projectOwner?.username,
                                            nickname: projectOwner?.nickname,
                                            avatar_url: projectOwner?.avatar_url,
                                            preview_url: previewUrls[0],
                                            audio_url: audioUrl,
                                            likes_count: likesCount,
                                            is_public: isPublic
                                        }}
                                        onClick={() => { }} // Disable navigation
                                        isOwner={false} // Hide delete button
                                        onToggleVisibility={null} // Hide visibility toggle if not owner/admin context
                                    />
                                </div>

                                {/* Description */}
                                <div className={`description-expander ${isDescriptionExpanded ? 'expanded' : ''}`} style={{ maxHeight: isDescriptionExpanded ? 'none' : '100px', marginBottom: '20px' }}>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{description || t('no_description') || 'No description'}</p>
                                    {!isDescriptionExpanded && description && description.length > 100 && <div className="description-gradient" />}
                                </div>
                                {description && description.length > 100 && (
                                    <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                                        {isDescriptionExpanded ? t('show_less') : t('show_more')}
                                    </button>
                                )}

                                <CommentsSection projectId={id} projectOwnerId={projectOwnerId} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Tabs for Viewer */}
            {!isOwner && (
                <div className="mobile-nav-viewer">
                    <button
                        className={`nav-item ${viewTab === 'lyrics' ? 'active' : ''}`}
                        onClick={() => setViewTab('lyrics')}
                    >
                        <span>{t('lyrics')}</span>
                    </button>
                    <button
                        className={`nav-item ${viewTab === 'info' ? 'active' : ''}`}
                        onClick={() => setViewTab('info')}
                    >
                        <span>{t('information')}</span>
                    </button>
                </div>
            )}

            {/* Mobile Tabs for Editor (Phases) */}
            {isOwner && (
                <div className="mobile-nav-editor">
                    <button className={`nav-item ${activePhase === 1 ? 'active' : ''}`} onClick={() => setActivePhase(1)}><span>{t('lyrics')}</span></button>
                    <button className={`nav-item ${activePhase === 2 ? 'active' : ''}`} onClick={() => setActivePhase(2)}><span>{t('style')}</span></button>
                    <button className={`nav-item ${activePhase === 3 ? 'active' : ''}`} onClick={() => setActivePhase(3)}><span>{t('publishing')}</span></button>
                    <button className={`nav-item ${activePhase === 4 ? 'active' : ''}`} onClick={() => setActivePhase(4)}><span>Preview</span></button>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ marginTop: 0, color: 'var(--brand-primary)', marginBottom: '20px' }}>{t('how_it_works')}</h2>
                        <button onClick={() => setShowHelp(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--brand-primary)', border: 'none', borderRadius: '25px', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>OK</button>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Help Modal */}
            {showKeyboardHelp && (
                <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
            )}
        </div>
    );
}

export default Editor;
