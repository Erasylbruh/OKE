import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlay, FaPause } from 'react-icons/fa';
import LikeButton from '../common/LikeButton';
import { useLanguage } from '../../context/LanguageContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

const ProjectCard = ({ project, onClick, isOwner, onToggleVisibility, onDelete }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
    
    const isCurrentTrack = currentTrack?.id === project.id;
    const isCardPlaying = isCurrentTrack && isPlaying;

    const showVisibilityStatus = location.pathname === '/dashboard' || location.pathname === '/admin';
    const previewUrl = project.preview_urls?.[0] || project.preview_url;

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (project.audio_url) {
            playTrack(project.id, project.audio_url);
        } else {
            onClick();
        }
    };

    const handleUserClick = (e) => {
        e.stopPropagation();
        navigate(`/user/${project.username}`);
    };

    return (
        <div className="card project-card" onClick={onClick}>
            <div className="vinyl-wrapper">
                <div className={`vinyl-disc ${isCardPlaying ? 'spinning' : ''}`}>
                    {previewUrl ? (
                        <img src={previewUrl} alt={project.name} />
                    ) : (
                        <div className="vinyl-placeholder" />
                    )}
                    <div className="vinyl-hole" />
                    <div className="vinyl-grooves" />
                </div>
                <button className="play-overlay-btn" onClick={handlePlayClick}>
                    {isCardPlaying ? <FaPause size={12} /> : <FaPlay size={12} style={{ marginLeft: '2px' }} />}
                </button>
            </div>

            <div className="card-info">
                <h3 className="project-title">{project.name}</h3>
                <div className="user-info" onClick={handleUserClick}>
                    <div className="user-avatar">
                        {project.avatar_url ? (
                            <img src={project.avatar_url} alt="avatar" />
                        ) : (
                            <span>{project.username?.[0]?.toUpperCase()}</span>
                        )}
                    </div>
                    <span className="user-name">{project.nickname || project.username}</span>
                </div>

                <div className="card-footer">
                    {showVisibilityStatus && (
                        <div
                            className={`visibility-badge ${project.is_public ? 'public' : 'private'}`}
                            onClick={(e) => onToggleVisibility && onToggleVisibility(e, project)}
                        >
                            {project.is_public ? t('public') : t('private')}
                        </div>
                    )}
                    <div className="card-actions">
                        <div onClick={(e) => e.stopPropagation()}>
                            <LikeButton projectId={project.id} initialCount={project.likes_count || 0} />
                        </div>
                        {isOwner && (
                            <button
                                className="delete-btn"
                                onClick={(e) => onDelete(e, project)}
                                title="Delete"
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