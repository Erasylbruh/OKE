import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import API_URL from '../config';

function LikeButton({ projectId, initialLiked = false, initialCount = 0 }) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    if (!projectId) return null;

    useEffect(() => {
        // Only fetch from server if we don't have initial values
        if (initialLiked !== undefined && initialCount !== undefined) {
            setLiked(initialLiked);
            setCount(initialCount);
            return;
        }

        // Otherwise, check with the server
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
    }, [projectId, initialLiked, initialCount]);

    const handleToggleLike = async (e) => {
        e.stopPropagation(); // Prevent triggering parent click events
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to like projects');
            return;
        }

        if (loading) return;

        // Optimistic update
        const previousLiked = liked;
        const previousCount = count;
        setLiked(!liked);
        setCount(liked ? count - 1 : count + 1);
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || res.statusText);
            }

            const data = await res.json();
            setLiked(data.liked);
            // We could update count from server if it returned it, but for now rely on optimistic
        } catch (err) {
            console.error('Error toggling like:', err);
            // Revert on error
            setLiked(previousLiked);
            setCount(previousCount);
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
                gap: '5px',
                transition: 'transform 0.2s',
                transform: liked ? 'scale(1.1)' : 'scale(1)'
            }}
            title={liked ? "Unlike" : "Like"}
        >
            <span style={{
                fontSize: '18px',
                color: liked ? '#E53935' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s'
            }}>
                {liked ? <FaHeart /> : <FaRegHeart />}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{count}</span>
        </button>
    );
}

export default LikeButton;
