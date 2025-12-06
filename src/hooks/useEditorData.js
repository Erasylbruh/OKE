import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API_URL from '../config';

export const useEditorData = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [project, setProject] = useState(null);
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
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [previewUrls, setPreviewUrls] = useState([null, null, null]);
    const [isOwner, setIsOwner] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [resetTrigger, setResetTrigger] = useState(0);

    // Load Project
    useEffect(() => {
        if (!id) return;

        const fetchProject = async () => {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                const res = await fetch(`${API_URL}/api/projects/${id}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);
                    setProjectName(data.name);
                    setIsPublic(!!data.is_public);

                    const urls = data.preview_urls || [];
                    while (urls.length < 3) urls.push(null);
                    setPreviewUrls(urls);
                    setAudioUrl(data.audio_url);

                    // Parse Data
                    let projectData = data.data;
                    if (typeof projectData === 'string') {
                        try { projectData = JSON.parse(projectData); } catch (e) { projectData = {}; }
                    }
                    setLyrics(projectData.lyrics || []);
                    setStyles(prev => projectData.styles || prev);
                    setDescription(projectData.description || '');

                    // Permission
                    if (token) {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const isUserOwner = Number(user.id) === Number(data.user_id);
                        if (location.state && location.state.from === 'main') {
                            setIsOwner(false);
                        } else {
                            setIsOwner(isUserOwner);
                        }
                    }
                } else {
                    alert('Project not found');
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error(err);
                alert('Error loading project');
            }
        };
        fetchProject();
    }, [id, navigate, location.state]);

    // Save Project
    const saveProject = async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login');

        setIsSaving(true);
        try {
            const payload = {
                name: projectName,
                is_public: isPublic,
                data: { lyrics, styles, description }
            };
            const res = await fetch(`${API_URL}/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Success feedback handled by UI
            } else {
                throw new Error(await res.text());
            }
        } catch (err) {
            console.error(err);
            alert('Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    // Actions
    const updateLyric = (index, field, value) => {
        setLyrics((prev) => {
            if (field === 'remove') return prev.filter((_, i) => i !== index);
            const newLyrics = [...prev];
            newLyrics[index] = { ...newLyrics[index], [field]: value };
            if (field === 'end' && index < newLyrics.length - 1) {
                newLyrics[index + 1] = { ...newLyrics[index + 1], start: value };
            }
            return newLyrics;
        });
    };

    return {
        project, lyrics, setLyrics, styles, setStyles,
        projectName, setProjectName, description, setDescription,
        isPublic, setIsPublic, audioUrl, setAudioUrl,
        previewUrls, setPreviewUrls, isOwner, isSaving, saveProject,
        updateLyric, resetTrigger, setResetTrigger
    };
};
