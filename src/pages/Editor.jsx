import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import LyricInput from '../components/LyricInput';
import TimingEditor from '../components/TimingEditor';
import StyleControls from '../components/StyleControls';
import Preview from '../components/Preview';
import CommentsSection from '../components/CommentsSection';
import LikeButton from '../components/LikeButton';
import API_URL from '../config';
import '../App.css';

function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
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
        <div className="editor-container">
            <div className="editor-panel" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                <div className="editor-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', borderBottom: '1px solid #282828' }}>
                    <button onClick={handleBack} style={{ backgroundColor: 'transparent', border: '1px solid #555' }}>&larr; Back</button>
                    <h1 style={{ margin: 0, fontSize: '1.5em' }}>Editor {projectName && `- ${projectName}`}</h1>
                    <div className="editor-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {isOwner && (
                            <>
                                <div
                                    onClick={() => setIsPublic(!isPublic)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: isPublic ? '#1db954' : '#555',
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        transition: 'background-color 0.3s',
                                        userSelect: 'none'
                                    }}
                                >
                                    <span style={{ marginRight: '8px', fontSize: '0.9em', fontWeight: 'bold' }}>
                                        {isPublic ? 'Public' : 'Private'}
                                    </span>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transform: isPublic ? 'translateX(0)' : 'translateX(-2px)',
                                        transition: 'transform 0.3s'
                                    }} />
                                </div>

                                <button id="save-btn" onClick={handleSave} disabled={isSaving} style={{ backgroundColor: '#1db954', color: 'black', minWidth: '100px' }}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isOwner ? (
                    <>
                        <section>
                            <h2>1. Input Lyrics</h2>
                            <LyricInput onParse={handleLyricsParsed} />
                        </section>

                        {lyrics.length > 0 && (
                            <>
                                <section>
                                    <h2>2. Edit Timing</h2>
                                    <TimingEditor lyrics={lyrics} onUpdate={updateLyric} />
                                </section>

                                <section>
                                    <h2>3. Style</h2>
                                    <StyleControls styles={styles} onUpdate={setStyles} />
                                </section>

                                <section>
                                    <h2>4. Preview Gallery</h2>
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                        {previewUrls.map((url, index) => (
                                            <div
                                                key={index}
                                                style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleSlotDrop(e, index)}
                                            >
                                                <div
                                                    onClick={() => document.getElementById(`preview-upload-${index}`).click()}
                                                    style={{
                                                        width: '100%', height: '100%',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        backgroundColor: '#333',
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: index === 0 ? '2px solid #1db954' : '2px dashed #555',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {url ? (
                                                        <>
                                                            <img src={url} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeletePreview(index); }}
                                                                style={{
                                                                    position: 'absolute', top: '2px', right: '2px',
                                                                    background: 'rgba(0,0,0,0.7)', color: 'white',
                                                                    border: 'none', borderRadius: '50%',
                                                                    width: '20px', height: '20px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    cursor: 'pointer', fontSize: '12px'
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                            {index !== 0 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleSetMainPreview(index); }}
                                                                    style={{
                                                                        position: 'absolute', bottom: '2px', right: '2px',
                                                                        background: 'rgba(0,0,0,0.7)', color: '#1db954',
                                                                        border: 'none', borderRadius: '4px',
                                                                        padding: '2px 4px', fontSize: '10px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    ★
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span style={{ fontSize: '2em', color: '#555' }}>+</span>
                                                    )}
                                                    {index === 0 && (
                                                        <div style={{
                                                            position: 'absolute', bottom: '0', left: '0', right: '0',
                                                            background: 'rgba(29, 185, 84, 0.8)', color: 'white',
                                                            fontSize: '10px', textAlign: 'center', padding: '2px'
                                                        }}>
                                                            Main
                                                        </div>
                                                    )}
                                                </div>
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
                                </section>
                            </>
                        )}
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <p style={{ margin: 0 }}>You are viewing this post in read-only mode.</p>
                            <LikeButton projectId={id} />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <CommentsSection projectId={id} projectOwnerId={projectOwnerId} />
                        </div>
                    </div>
                )}
            </div>

            <div className="preview-panel" style={{ flex: 1, borderLeft: '1px solid #333', paddingLeft: '20px' }}>
                <Preview lyrics={lyrics} styles={styles} resetTrigger={resetTrigger} />
            </div>
        </div>
    );
}

export default Editor;
