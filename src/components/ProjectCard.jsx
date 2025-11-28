import React, { useState, useRef, useEffect } from 'react';
import LikeButton from './LikeButton';
import { useLanguage } from '../context/LanguageContext';

const ProjectCard = ({ project, onClick, isOwner, onToggleVisibility, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const titleRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (titleRef.current) {
            setShouldScroll(titleRef.current.scrollWidth > titleRef.current.clientWidth);
        }
    }, [project.name]);

    const handleShare = (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/editor/${project.id}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        });
    };

    const previewUrl = project.preview_urls?.[0] || project.preview_url;

    return (
        <div
            className="card"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '280px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.4)' : 'none'
            }}
        >
            {/* Cover Image Section (Top Half) */}
            <div style={{
                height: '160px',
                backgroundColor: '#333',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={project.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1db954 0%, #191414 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '3rem', opacity: 0.2 }}>🎵</span>
                    </div>
                )}

                {/* Play Overlay on Hover */}
                {isHovered && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#1db954',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}>
                            <span style={{ color: 'black', fontSize: '24px', marginLeft: '4px' }}>▶</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section (Bottom Half) */}
            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Title */}
                <div style={{ overflow: 'hidden', marginBottom: '5px' }}>
                    <div className={isHovered && shouldScroll ? "marquee-container" : ""} style={{ width: '100%' }}>
                        <h3
                            ref={titleRef}
                            className={isHovered && shouldScroll ? "marquee-content" : ""}
                            style={{
                                margin: 0,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: isHovered && shouldScroll ? 'visible' : 'hidden',
                                textOverflow: isHovered && shouldScroll ? 'clip' : 'ellipsis',
                                color: 'white'
                            }}
                        >
                            {project.name}
                        </h3>
                    </div>
                </div>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'auto' }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#555'
                    }}>
                        {project.avatar_url ? (
                            <img src={project.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                                {project.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {project.nickname || project.username}
                    </span>
                </div>

                {/* Footer Actions */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    {/* Left: Status (Owner only) or Date/Info */}
                    <div style={{ fontSize: '0.8rem' }}>
                        {isOwner ? (
                            <span style={{ color: project.is_public ? '#1db954' : '#888' }}>
                                {project.is_public ? t('public') : t('private')}
                            </span>
                        ) : (
                            <span style={{ color: '#888' }}>{new Date(project.created_at).toLocaleDateString()}</span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div onClick={(e) => e.stopPropagation()}>
                            <LikeButton projectId={project.id} initialCount={project.likes_count || 0} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.9rem' }}>
                            <span>💬</span>
                            <span>{project.comments_count || 0}</span>
                        </div>

                        {isOwner && (
                            <div className="dropdown" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                                <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}>⋮</button>
                                {/* Simple dropdown logic could go here, but for now just buttons if space permits or keep it simple */}
                            </div>
                        )}

                        {isOwner && (
                            <button
                                onClick={(e) => onDelete(e, project)}
                                title="Delete"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, opacity: 0.7 }}
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
