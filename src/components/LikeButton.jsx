import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import API_URL from '../config';

function LikeButton({ projectId, initialLiked = false, initialCount = 0 }) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    if (!projectId) return null;

    useEffect(() => {
        // If initialLiked/Count changes from parent (e.g. refresh), update state
        setLiked(initialLiked);
        setCount(initialCount);
    }, [initialLiked, initialCount]);

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
                    // Note: We don't fetch count here separately usually, assuming parent passed correct initialCount
                }
            } catch (err) {
                console.error('Error checking like status:', err);
            }
        };
        checkLikeStatus();
    }, [projectId]);

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
            className={`bg-transparent border-none cursor-pointer p-1 flex items-center justify-center gap-1 transition-transform duration-200 ${liked ? 'scale-110' : 'scale-100'}`}
            title={liked ? "Unlike" : "Like"}
        >
            <span className={`text-lg flex items-center transition-colors duration-200 ${liked ? 'text-[#E53935]' : 'text-[#B3B3B3]'}`}>
                {liked ? <FaHeart /> : <FaRegHeart />}
            </span>
            <span className="text-[#ccc] text-sm">{count}</span>
        </button>
    );
}

export default LikeButton;
