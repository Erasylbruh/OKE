import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import LyricInput from '../components/features/LyricInput';
import TimingEditor from '../components/features/TimingEditor';
import StyleControls from '../components/features/StyleControls';
import Preview from '../components/features/Preview';
import CommentsSection from '../components/features/CommentsSection';
import ProjectCard from '../components/features/ProjectCard';
import client from '../api/client';

import { useAudioPlayer } from '../context/AudioPlayerContext';

function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { stop } = useAudioPlayer(); // Глобальный плеер

    // State
    const [lyrics, setLyrics] = useState([]);
    const [styles, setStyles] = useState({
        fontSize: 24, activeFontSize: 32, color: '#ffffff', fillColor: '#1db954',
        backgroundColor: '#121212', fontFamily: 'Inter, sans-serif', fontUrl: '', headerText: ''
    });
    const [projectName, setProjectName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [description, setDescription] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [previewUrls, setPreviewUrls] = useState([null, null, null]);
    const [isOwner, setIsOwner] = useState(false);
    const [activePhase, setActivePhase] = useState(1);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Stop global player on mount
    useEffect(() => {
        stop();
    }, [stop]);

    // Load Project
    useEffect(() => {
        if (!id) return;
        const loadProject = async () => {
            try {
                const project = await client.get(`/api/projects/${id}`);
                if (!project) return navigate('/dashboard');

                setProjectName(project.name);
                setIsPublic(!!project.is_public);
                setAudioUrl(project.audio_url);

                const urls = project.preview_urls || [];
                while (urls.length < 3) urls.push(null);
                setPreviewUrls(urls);

                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                setIsOwner(Number(currentUser.id) === Number(project.user_id));

                let data = project.data || {};
                if (typeof data === 'string') data = JSON.parse(data);

                setLyrics(data.lyrics || []);
                setStyles(prev => ({ ...prev, ...(data.styles || {}) }));
                setDescription(data.description || '');
            } catch (err) {
                console.error(err);
                navigate('/dashboard');
            }
        };
        loadProject();
    }, [id, navigate]);

    useEffect(() => setResetTrigger(p => p + 1), [lyrics, styles]);

    // Handlers
    const handleAudioUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('audio', file);

        try {
            const res = await client.upload(`/api/projects/${id}/audio`, formData);
            if (res) setAudioUrl(res.audio_url);
        } catch (err) {
            console.error(err);
            alert('Audio upload failed');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await client.put(`/api/projects/${id}`, {
                name: projectName,
                is_public: isPublic,
                data: { lyrics, styles, description }
            });
            alert('Saved!');
        } catch (err) {
            console.error(err);
            alert('Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreviewUpload = async (slot, file) => {
        const formData = new FormData();
        formData.append('preview', file);
        formData.append('slot', slot);
        const res = await client.upload(`/api/projects/${id}/preview`, formData);
        if (res) {
            const newUrls = [...previewUrls];
            newUrls[slot] = res.preview_urls[slot]; // Assuming API returns updated list
            // For simplicity, reload or update state correctly based on API response structure
            window.location.reload();
        }
    };

    // Render Logic (Simplified for brevity, use classes from App.css)
    return (
        <div className="editor-container" style={{ display: 'flex', height: '100vh', backgroundColor: '#121212', color: 'white' }}>
            {isOwner && (
                <div className="editor-sidebar" style={{ width: '350px', borderRight: '1px solid #333', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Phase Navigation */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        {[1, 2, 3].map(p => (
                            <button
                                key={p}
                                onClick={() => setActivePhase(p)}
                                className={`phase-btn ${activePhase === p ? 'active' : ''}`}
                                style={{ flex: 1, padding: '8px', backgroundColor: activePhase === p ? '#1db954' : '#333', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                            >
                                {p === 1 ? 'Content' : p === 2 ? 'Style' : 'Publish'}
                            </button>
                        ))}
                    </div>

                    {activePhase === 1 && (
                        <>
                            <div className="upload-section card" style={{ padding: '20px', textAlign: 'center' }}>
                                <label className="primary" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', backgroundColor: '#333' }}>
                                    {audioUrl ? 'Change Audio' : 'Upload Audio (.mp3)'}
                                    <input type="file" hidden accept=".mp3" onChange={handleAudioUpload} />
                                </label>
                            </div>
                            <LyricInput onParse={(parsed) => setLyrics(parsed)} />
                            <TimingEditor lyrics={lyrics} onUpdate={(idx, field, val) => {
                                const newLyrics = [...lyrics];
                                if (field === 'remove') newLyrics.splice(idx, 1);
                                else newLyrics[idx] = { ...newLyrics[idx], [field]: val };
                                setLyrics(newLyrics);
                            }} />
                        </>
                    )}

                    {activePhase === 2 && (
                        <StyleControls styles={styles} onUpdate={setStyles} />
                    )}

                    {activePhase === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input className="dark-input" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project Name" />
                            <textarea className="dark-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={4} style={{ height: 'auto' }} />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {previewUrls.map((url, i) => (
                                    <label key={i} style={{ flex: 1, aspectRatio: '1', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                                        {url ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</div>}
                                        <input type="file" hidden accept="image/*" onChange={e => handlePreviewUpload(i, e.target.files[0])} />
                                    </label>
                                ))}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                                Public Project
                            </label>

                            <button onClick={handleSave} className="primary" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="preview-area" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                <Preview
                    lyrics={lyrics}
                    styles={styles}
                    resetTrigger={resetTrigger}
                    audioUrl={audioUrl}
                    backgroundImageUrl={previewUrls[0]}
                    projectName={projectName}
                />
            </div>
        </div>
    );
}

export default Editor;