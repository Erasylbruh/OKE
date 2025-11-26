import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function CommentsSection({ projectId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchComments();
    }, [projectId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to comment');

        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newComment })
            });

            if (res.ok) {
                setNewComment('');
                fetchComments(); // Refresh list
            } else {
                alert('Failed to post comment');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId));
            } else {
                alert('Failed to delete comment');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'white', height: '100%' }}>
            {/* Input Form at Top */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', backgroundColor: '#444', color: 'white' }}
                />
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#1db954', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                    Post
                </button>
            </form>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loading ? <p>Loading...</p> : comments.length === 0 ? <p style={{ color: '#888' }}>No comments yet.</p> : (
                    comments.map(comment => (
                        <div key={comment.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#444', flexShrink: 0 }}>
                                {comment.avatar_url ? (
                                    <img src={comment.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {comment.username[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#ccc', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>
                                        {comment.nickname || comment.username}
                                        <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px', fontWeight: 'normal' }}>
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </span>
                                    {(Number(currentUser.id) === Number(comment.user_id) || !!currentUser.is_admin) && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8em' }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                                <div style={{ marginTop: '5px', color: '#eee' }}>{comment.content}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CommentsSection;
