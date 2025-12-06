import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorData } from '../hooks/useEditorData';
import { useLanguage } from '../context/LanguageContext';
import { FaArrowLeft } from 'react-icons/fa';

import EditorPhases from '../components/editor/EditorPhases';
import AudioUploader from '../components/editor/AudioUploader';
import PublishingSettings from '../components/editor/PublishingSettings';
import LyricInput from '../components/LyricInput';
import TimingEditor from '../components/TimingEditor';
import StyleControls from '../components/StyleControls';
import Preview from '../components/Preview';
import ProjectCard from '../components/ProjectCard';
import CommentsSection from '../components/CommentsSection';

const Editor = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Custom Hook for Logic
    const {
        project, lyrics, setLyrics, styles, setStyles,
        projectName, setProjectName, description, setDescription,
        isPublic, setIsPublic, audioUrl, setAudioUrl,
        previewUrls, setPreviewUrls, isOwner, isSaving, saveProject,
        updateLyric, resetTrigger
    } = useEditorData();

    // UI State
    const [activePhase, setActivePhase] = useState(1);
    const [viewTab, setViewTab] = useState('lyrics'); // 'lyrics' or 'info' (For Viewer)

    // Lyrics Parsing Handler
    const handleLyricsParsed = (parsedInput) => {
        let initializedLyrics;
        if (parsedInput.length > 0 && typeof parsedInput[0] === 'object') {
            initializedLyrics = parsedInput.map((item, index) => {
                // If 'end' is provided (from JSON/Whisper), use it. 
                // Otherwise calculate based on next start or default duration.
                let endTime = item.end;
                if (endTime === undefined || endTime === null) {
                    const nextItem = parsedInput[index + 1];
                    endTime = nextItem ? nextItem.start : (item.start + 2);
                }
                return { id: index, text: item.text, start: item.start, end: endTime };
            });
        } else {
            initializedLyrics = parsedInput.map((text, index) => ({
                id: index, text: text.trim(), start: 0, end: 0,
            }));
        }
        setLyrics(initializedLyrics);
    };

    if (!project) return <div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>;

    // --- VIEWER MODE ---
    if (!isOwner) {
        return (
            <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
                {/* Mobile/Desktop Layout */}
                <div className="flex-1 relative flex flex-col md:flex-row">
                    {/* Visualizer / Lyrics */}
                    <div className={`flex-1 relative flex items-center justify-center ${viewTab === 'lyrics' ? 'flex' : 'hidden md:flex'}`}>
                        <Preview
                            lyrics={lyrics}
                            styles={styles}
                            resetTrigger={resetTrigger}
                            audioUrl={audioUrl}
                            backgroundImageUrl={previewUrls[0]}
                            projectName={projectName}
                        />
                    </div>

                    {/* Info Panel */}
                    <div className={`w-full md:w-[400px] bg-neutral-900 border-l border-neutral-800 flex flex-col ${viewTab === 'info' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="p-5 flex-1 overflow-y-auto">
                            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6">
                                <FaArrowLeft /> Back
                            </button>

                            <div className="mb-8">
                                <ProjectCard
                                    project={{ ...project, user: { username: project.username, nickname: project.nickname, avatar_url: project.avatar_url } }}
                                    onClick={() => { }}
                                />
                            </div>

                            <div className="mb-8 text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                {description || 'No description provided.'}
                            </div>

                            <CommentsSection projectId={project.id} projectOwnerId={project.user_id} />
                        </div>
                    </div>
                </div>

                {/* Mobile Tabs */}
                <div className="md:hidden flex border-t border-neutral-800 bg-neutral-900">
                    <button
                        className={`flex-1 py-4 font-bold ${viewTab === 'lyrics' ? 'text-green-500' : 'text-neutral-500'}`}
                        onClick={() => setViewTab('lyrics')}
                    >
                        Lyrics
                    </button>
                    <button
                        className={`flex-1 py-4 font-bold ${viewTab === 'info' ? 'text-green-500' : 'text-neutral-500'}`}
                        onClick={() => setViewTab('info')}
                    >
                        Info
                    </button>
                </div>
            </div>
        );
    }

    // --- EDITOR MODE ---
    return (
        <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
            {/* Navigation */}
            <EditorPhases activePhase={activePhase} setActivePhase={setActivePhase} />

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Controls */}
                <div className="w-full md:w-[400px] bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-y-auto z-10">

                    {/* Phase 1: Lyrics & Audio */}
                    {activePhase === 1 && (
                        <div className="p-5 animate-in fade-in slide-in-from-left-4 duration-300">
                            <AudioUploader audioUrl={audioUrl} setAudioUrl={setAudioUrl} setLyrics={setLyrics} />

                            <div className="mb-8">
                                <h3 className="text-neutral-400 text-sm uppercase font-bold mb-4">Lyrics Source</h3>
                                <LyricInput onParse={handleLyricsParsed} />
                            </div>

                            {lyrics.length > 0 && (
                                <div>
                                    <h3 className="text-neutral-400 text-sm uppercase font-bold mb-4">Timing Sync</h3>
                                    <TimingEditor lyrics={lyrics} onUpdate={updateLyric} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phase 2: Style */}
                    {activePhase === 2 && (
                        <div className="p-5 animate-in fade-in slide-in-from-left-4 duration-300">
                            <StyleControls styles={styles} onUpdate={setStyles} />
                        </div>
                    )}

                    {/* Phase 3: Publishing */}
                    {activePhase === 3 && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <PublishingSettings
                                projectName={projectName}
                                setProjectName={setProjectName}
                                description={description}
                                setDescription={setDescription}
                                isPublic={isPublic}
                                setIsPublic={setIsPublic}
                                previewUrls={previewUrls}
                                setPreviewUrls={setPreviewUrls}
                                isSaving={isSaving}
                                onSave={saveProject}
                            />
                            <div className="px-5 pb-5">
                                <button onClick={() => navigate('/dashboard')} className="w-full py-3 text-neutral-400 hover:text-white transition-colors">
                                    Exit Editor
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Panel: Preview */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
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
        </div>
    );
};

export default Editor;
