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
    const location = useLocation(); // Add useLocation hook
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

                    // Check ownership
                    // Check ownership
                    if (token) {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        // Ensure strict type comparison handles string/number differences
                        const isUserOwner = Number(user.id) === Number(project.user_id);

                        // If coming from 'main' (For You page), force read-only mode even for owners
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
                // Immutable update for the next line
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
                // Optional: show a small toast instead of alert
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
                            <CommentsSection projectId={id} />
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
