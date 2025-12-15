import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import LikeButton from './LikeButton';
import { useLanguage } from '../context/LanguageContext';

const ProjectCard = ({ project, onClick, isOwner, onToggleVisibility, onDelete }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    const showVisibilityStatus = location.pathname === '/dashboard' || location.pathname === '/admin';

    useEffect(() => {
        const handleOtherPlay = (e) => {
            if (e.detail.id !== project.id && isPlaying) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
            }
        };

        window.addEventListener('project-play-started', handleOtherPlay);

        return () => {
            window.removeEventListener('project-play-started', handleOtherPlay);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';  // Release media resources
                audioRef.current.load();     // Reset the audio element
                audioRef.current = null;
            }
        };
    }, [project.id, isPlaying]);

    const handlePlayClick = (e) => {
        e.stopPropagation();
        const audioUrl = project.audio_url || project.audioUrl;

        if (audioUrl) {
            if (isPlaying) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
            } else {
                // Dispatch event BEFORE playing to stop others
                window.dispatchEvent(new CustomEvent('project-play-started', { detail: { id: project.id } }));

                if (!audioRef.current) {
                    audioRef.current = new Audio(audioUrl);
                    audioRef.current.onended = () => setIsPlaying(false);
                    audioRef.current.onerror = (err) => {
                        console.error("Audio playback error:", err);
                        setIsPlaying(false);
                    };
                }
                audioRef.current.play().catch(e => {
                    console.error("Play error:", e);
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        } else {
            console.warn("No audio URL found for project:", project);
            onClick();
        }
    };

    const previewUrl = project.preview_urls?.[0] || project.preview_url;

    return (
        <div
            className="card"
            onClick={onClick}
            style={{
                padding: '10px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                height: 'auto',
                minHeight: '100px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: 'var(--bg-surface)', // Very dark background
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflow: 'visible'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
        >
            {/* Vinyl Section */}
            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                {/* Vinyl Disc */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'rotate 4s linear infinite',
                    animationPlayState: isPlaying ? 'running' : 'paused',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                }}>
                    <style>
                        {`
                            @keyframes rotate {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={project.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--bg-hover)' }} />
                    )}

                    {/* Center Hole */}
                    <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '20%', height: '20%',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '50%',
                        zIndex: 2
                    }} />

                    {/* Grooves Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        background: 'repeating-radial-gradient(#000 0, #000 2px, transparent 3px, transparent 4px)',
                        opacity: 0.1,
                        pointerEvents: 'none',
                        zIndex: 1
                    }} />
                </div>

                {/* Play Button Overlay */}
                <button
                    onClick={handlePlayClick}
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px', height: '40px', // Smaller than preview player
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        border: '2px solid white',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        padding: 0
                    }}
                >
                    {isPlaying ? (
                        <div style={{ width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '2px' }} />
                    ) : (
                        <div style={{
                            width: 0, height: 0,
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent',
                            borderLeft: '10px solid white',
                            marginLeft: '2px'
                        }} />
                    )}
                </button>
            </div>

            {/* Info Section */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{
                    margin: '0 0 5px 0',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'var(--text-primary)'
                }}>
                    {project.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${project.username}`); }}
                        style={{
                            width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-hover)', cursor: 'pointer'
                        }}
                    >
                        {project.avatar_url ? (
                            <img src={project.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-primary)' }}>
                                {project.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${project.username}`); }}
                        style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        {project.nickname || project.username}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {showVisibilityStatus && (
                        <div
                            onClick={(e) => onToggleVisibility && onToggleVisibility(e, project)}
                            style={{
                                fontSize: '0.8rem',
                                color: project.is_public ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                cursor: onToggleVisibility ? 'pointer' : 'default',
                                userSelect: 'none'
                            }}
                            title={onToggleVisibility ? "Click to toggle visibility" : ""}
                        >
                            {project.is_public ? t('public') : t('private')}
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div onClick={(e) => e.stopPropagation()}>
                            <LikeButton projectId={project.id} initialCount={project.likes_count || 0} />
                        </div>
                        {isOwner && (
                            <button
                                onClick={(e) => onDelete(e, project)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    padding: '5px',
                                    opacity: 0.7,
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#E53935'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                title="Delete"
                            >
                                <FaTrash />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
