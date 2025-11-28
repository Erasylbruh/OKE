import React, { useState, useRef, useEffect } from 'react';
import LikeButton from './LikeButton';
import API_URL from '../config';
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

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: '#282828',
                borderRadius: '12px',
                padding: '15px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                transition: 'transform 0.2s',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                minHeight: '140px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Top Section: Preview & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Large Circular Preview */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: '#444',
                    flexShrink: 0,
                    border: '2px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {project.preview_urls?.[0] || project.preview_url ? (
                        <img
                            src={project.preview_urls?.[0] || project.preview_url}
                            alt={project.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1db954, #191414)' }} />
                    )}
                </div>

                {/* Title with Marquee on Hover */}
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <div
                        className={isHovered && shouldScroll ? "marquee-container" : ""}
                        style={{ width: '100%' }}
                    >
                        <h2
                            ref={titleRef}
                            className={isHovered && shouldScroll ? "marquee-content" : ""}
                            style={{
                                margin: 0,
                                fontSize: '1.4em',
                                whiteSpace: 'nowrap',
                                overflow: isHovered && shouldScroll ? 'visible' : 'hidden',
                                textOverflow: isHovered && shouldScroll ? 'clip' : 'ellipsis',
                                color: 'white'
                            }}
                        >
                            {project.name}
                        </h2>
                    </div>
                    {isOwner && (
                        <div style={{ marginTop: '5px', fontSize: '0.8em', color: project.is_public ? '#1db954' : '#888' }}>
                            {project.is_public ? t('public') : t('private')}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: User Info & Actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px solid #333'
            }}>
                {/* User Info */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (project.username) {
                            window.location.href = `/user/${project.username}`;
                        }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#555'
                    }}>
                        {project.avatar_url ? (
                            <img
                                src={project.avatar_url}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6em', color: 'white' }}>
                                {project.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span style={{ fontSize: '0.8em', color: '#ccc', fontWeight: 'bold' }}>
                        {project.nickname || project.username}
                    </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        title="Copy Link"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#888',
                            fontSize: '1.2em',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        🔗
                    </button>

                    {/* Like Button */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <LikeButton projectId={project.id} initialCount={project.likes_count || 0} />
                    </div>

                    {/* Comment Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ccc', fontSize: '0.9em' }} title="Comments">
                        <span>💬</span>
                        <span>{project.comments_count || 0}</span>
                    </div>

                    {/* Owner Actions */}
                    {isOwner && (
                        <>
                            <button
                                onClick={(e) => onToggleVisibility(e, project)}
                                title={project.is_public ? "Make Private" : "Make Public"}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2em'
                                }}
                            >
                                {project.is_public ? '👁️' : '🔒'}
                            </button>
                            <button
                                onClick={(e) => onDelete(e, project)}
                                title="Delete"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2em'
                                }}
                            >
                                🗑️
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
