<<<<<<< HEAD
import { useAudio } from '../context/AudioContext';
import { FaPlay, FaPause, FaHeart, FaComment, FaShare } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
    const { playTrack, currentTrackId, isPlaying } = useAudio();
    const navigate = useNavigate();

    // Check if THIS project is the one playing
    const isCurrent = currentTrackId === project.id;
    const isThisPlaying = isCurrent && isPlaying;

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (project.preview_url) {
            playTrack(project.preview_url, project.id);
        }
    };

    const handleCardClick = () => {
        navigate(`/project/${project.id}`);
    };

    // Fallback image if preview_urls is empty or preview_url is null
    // Use project.preview_url (legacy/main) or first from array
    // Or placeholder
    const imageUrl = project.preview_url || (project.preview_urls && project.preview_urls[0]) || 'https://via.placeholder.com/400x400?text=No+Cover';

    // Check for array to display secondary images if needed, but for card main image is enough.

    return (
        <div
            onClick={handleCardClick}
            className="flex items-center gap-5 p-4 min-h-[120px] bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-all cursor-pointer group hover:border-neutral-700"
        >
            <div className="relative w-24 h-24 shrink-0">
                {/* Vinyl animation container */}
                <div className={`w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-neutral-800 group-hover:border-neutral-600 transition-colors ${isThisPlaying ? 'animate-spin-slow' : ''}`}>
                    <img
                        src={imageUrl}
                        className="w-full h-full object-cover"
                        alt={project.name}
                    />
=======
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (project.audio_url) {
            if (isPlaying) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
            } else {
                if (!audioRef.current) {
                    audioRef.current = new Audio(project.audio_url);
                    audioRef.current.onended = () => setIsPlaying(false);
                }
                // Reset all other audios? For now, just play this one.
                // Ideally we'd use a context to stop others, but let's keep it simple.
                audioRef.current.play().catch(e => console.error("Play error:", e));
                setIsPlaying(true);
            }
        } else {
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
                backgroundColor: '#0f0f0f', // Very dark background
                borderRadius: '8px',
                border: '1px solid #222',
                overflow: 'visible'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f0f0f'}
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
                        <div style={{ width: '100%', height: '100%', background: '#333' }} />
                    )}

                    {/* Center Hole */}
                    <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '20%', height: '20%',
                        backgroundColor: '#181818',
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
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
                </div>

                {/* Play Button Overlay */}
                <button
                    onClick={handlePlayClick}
<<<<<<< HEAD
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10"
                >
                    {isThisPlaying ? <FaPause className="text-white text-xl" /> : <FaPlay className="text-white text-xl ml-1" />}
                </button>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">{project.name}</h3>
                <div className="text-sm text-neutral-400 truncate mt-1">
                    {project.nickname || project.username || 'Unknown Artist'}
                </div>

                <div className="flex items-center gap-4 mt-3 text-neutral-500 text-sm">
                    <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
                        <FaHeart />
                        <span>{project.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <FaComment />
                        <span>{project.comments_count || 0}</span>
=======
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
                    color: 'white'
                }}>
                    {project.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${project.username}`); }}
                        style={{
                            width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#555', cursor: 'pointer'
                        }}
                    >
                        {project.avatar_url ? (
                            <img src={project.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                                {project.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${project.username}`); }}
                        style={{ fontSize: '0.9rem', color: '#b3b3b3', cursor: 'pointer' }}
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
                                color: project.is_public ? '#1db954' : '#888',
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
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, opacity: 0.7 }}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        )}
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
