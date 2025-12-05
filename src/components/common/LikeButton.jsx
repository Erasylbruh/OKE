import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import client from '../../api/client';

function LikeButton({ projectId, initialLiked = false, initialCount = 0 }) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLiked(initialLiked);
        setCount(initialCount);
    }, [initialLiked, initialCount]);

    useEffect(() => {
        const checkLike = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const data = await client.get(`/api/projects/${projectId}/like`);
                if (data) setLiked(data.liked);
            } catch (err) {
                console.error(err);
            }
        };
        checkLike();
    }, [projectId]);

    const handleToggleLike = async (e) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to like');
        if (loading) return;

        const previousLiked = liked;
        const previousCount = count;
        
        // Optimistic update
        setLiked(!liked);
        setCount(liked ? count - 1 : count + 1);
        setLoading(true);

        try {
            const data = await client.post(`/api/projects/${projectId}/like`);
            if (data) setLiked(data.liked);
        } catch (err) {
            setLiked(previousLiked);
            setCount(previousCount);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleLike}
            className="like-btn"
            style={{ background: 'none', border: 'none', padding: '5px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'transform 0.2s', transform: liked ? 'scale(1.1)' : 'scale(1)' }}
        >
            <span style={{ fontSize: '18px', color: liked ? '#E53935' : '#B3B3B3', display: 'flex', alignItems: 'center' }}>
                {liked ? <FaHeart /> : <FaRegHeart />}
            </span>
            <span style={{ color: '#ccc', fontSize: '0.9em' }}>{count}</span>
        </button>
    );
}

export default LikeButton;