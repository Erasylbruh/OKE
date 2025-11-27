import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function LikeButton({ projectId, initialLiked = false }) {
    const [liked, setLiked] = useState(initialLiked);
    const [loading, setLoading] = useState(false);

    if (!projectId) return null;

    useEffect(() => {
        const checkLikeStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/api/projects/${projectId}/like`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLiked(data.liked);
                }
            } catch (err) {
                console.error('Error checking like status:', err);
            }
        };
        checkLikeStatus();
    }, [projectId]);

    const handleToggleLike = async (e) => {
        e.stopPropagation(); // Prevent triggering parent click events (e.g., opening project)
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to like projects');
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLiked(data.liked);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            alert(`Failed to update like status: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleLike}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                transform: liked ? 'scale(1.1)' : 'scale(1)'
            }}
            title={liked ? "Unlike" : "Like"}
        >
            <span style={{
                fontSize: '24px',
                color: liked ? '#e91e63' : '#ccc',
                filter: liked ? 'drop-shadow(0 0 2px #e91e63)' : 'none'
            }}>
                {liked ? '❤️' : '🤍'}
            </span>
        </button>
    );
}

export default LikeButton;
