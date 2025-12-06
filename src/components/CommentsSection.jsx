import React, { useState, useEffect } from 'react';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

function CommentsSection({ projectId, projectOwnerId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null); // commentId
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const { t } = useLanguage();

    const fetchComments = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`${API_URL}/api/projects/${projectId}/comments?userId=${currentUser.id || 0}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId, currentUser.id]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e, parentId = null) => {
        e.preventDefault();
        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to comment');

        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, parent_id: parentId })
            });

            if (res.ok) {
                if (parentId) {
                    setReplyContent('');
                    setReplyTo(null);
                } else {
                    setNewComment('');
                }
                fetchComments();
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
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePin = async (commentId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/comments/${commentId}/pin`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchComments();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to like');

        try {
            const res = await fetch(`${API_URL}/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(comments.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            is_liked: data.liked,
                            likes_count: data.liked ? c.likes_count + 1 : c.likes_count - 1
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderComment = (comment, isReply = false) => (
        <div key={comment.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginLeft: isReply ? '40px' : '0', marginBottom: '15px', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#444', flexShrink: 0, cursor: 'pointer' }} onClick={() => window.location.href = `/user/${comment.username}`}>
                {comment.avatar_url ? (
                    <img src={comment.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {comment.username[0].toUpperCase()}
                    </div>
                )}
            </div>

            <div style={{ flex: 1 }}>
                {/* Header */}
                <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#ccc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span onClick={() => window.location.href = `/user/${comment.username}`} style={{ cursor: 'pointer' }}>
                        {comment.nickname || comment.username}
                    </span>
                    <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {comment.is_pinned && <span style={{ fontSize: '0.8em', color: '#1db954' }}>📌 {t('pinned_by_author')}</span>}
                </div>

                {/* Content */}
                <div style={{ marginTop: '5px', color: '#eee' }}>{comment.content}</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.8em', color: '#888' }}>
                    <span style={{ cursor: 'pointer', color: comment.is_liked ? '#e91e63' : '#888' }} onClick={() => handleLike(comment.id)}>
                        {comment.is_liked ? '❤️' : '🤍'} {comment.likes_count || 0}
                    </span>
                    <span style={{ cursor: 'pointer' }} onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>{t('reply')}</span>

                    {(Number(currentUser.id) === Number(comment.user_id) || !!currentUser.is_admin) && (
                        <span style={{ cursor: 'pointer', color: '#ff4444' }} onClick={() => handleDelete(comment.id)}>{t('delete')}</span>
                    )}

                    {/* Pin Action (Owner Only) */}
                    {Number(currentUser.id) === Number(projectOwnerId) && (
                        <span style={{ cursor: 'pointer', color: '#1db954' }} onClick={() => handlePin(comment.id)}>
                            {comment.is_pinned ? t('unpin') : t('pin')}
                        </span>
                    )}
                </div>

                {/* Reply Input */}
                {replyTo === comment.id && (
                    <form onSubmit={(e) => handleSubmit(e, comment.id)} style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder={`${t('reply')} @${comment.username}...`}
                            style={{ flex: 1, padding: '8px', borderRadius: '15px', border: 'none', backgroundColor: '#333', color: 'white', fontSize: '0.9em' }}
                            autoFocus
                        />
                        <button type="submit" style={{ padding: '5px 15px', borderRadius: '15px', border: 'none', backgroundColor: '#1db954', color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9em' }}>
                            {t('reply')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );

    // Group comments (simple nesting for 1 level deep or flatten)
    // For simplicity, let's just render top-level then their children
    const topLevelComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'white', height: '100%' }}>
            {/* Input Form at Top */}
            <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder={t('write_comment')}
                    style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', backgroundColor: '#444', color: 'white' }}
                />
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#1db954', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t('post')}
                </button>
            </form>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {loading ? <p>Loading...</p> : comments.length === 0 ? <p style={{ color: '#888' }}>No comments yet.</p> : (
                    topLevelComments.map(comment => (
                        <div key={comment.id}>
                            {renderComment(comment)}
                            {getReplies(comment.id).map(reply => renderComment(reply, true))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CommentsSection;
