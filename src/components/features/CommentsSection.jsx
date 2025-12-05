import React, { useState, useEffect, useCallback } from 'react';
import client from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

function CommentsSection({ projectId, projectOwnerId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const { t } = useLanguage();

    const fetchComments = useCallback(async () => {
        try {
            const data = await client.get(`/api/projects/${projectId}/comments?userId=${currentUser.id || 0}`);
            if (data) setComments(data);
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

        try {
            const data = await client.post(`/api/projects/${projectId}/comments`, { content, parent_id: parentId });
            if (data) {
                if (parentId) {
                    setReplyContent('');
                    setReplyTo(null);
                } else {
                    setNewComment('');
                }
                fetchComments();
            }
        } catch (err) {
            alert('Failed to post comment');
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await client.delete(`/api/comments/${commentId}`);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error(err);
        }
    };

    const handlePin = async (commentId) => {
        try {
            await client.post(`/api/comments/${commentId}/pin`);
            fetchComments();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async (commentId) => {
        try {
            const data = await client.post(`/api/comments/${commentId}/like`);
            if (data) {
                setComments(comments.map(c => {
                    if (c.id === commentId) {
                        return { ...c, is_liked: data.liked, likes_count: data.liked ? c.likes_count + 1 : c.likes_count - 1 };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to render comments (Simplified for brevity)
    const renderComment = (comment, isReply = false) => (
        <div key={comment.id} style={{ display: 'flex', gap: '10px', marginLeft: isReply ? '40px' : '0', marginBottom: '15px' }}>
            <div className="user-avatar" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                {comment.avatar_url ? <img src={comment.avatar_url} alt="avatar" /> : comment.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#ccc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{comment.nickname || comment.username}</span>
                    <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                    {comment.is_pinned && <span style={{ fontSize: '0.8em', color: '#1db954' }}>📌 {t('pinned_by_author')}</span>}
                </div>
                <div style={{ marginTop: '5px', color: '#eee' }}>{comment.content}</div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.8em', color: '#888' }}>
                    <span style={{ cursor: 'pointer', color: comment.is_liked ? '#e91e63' : '#888' }} onClick={() => handleLike(comment.id)}>
                        {comment.is_liked ? '❤️' : '🤍'} {comment.likes_count || 0}
                    </span>
                    <span style={{ cursor: 'pointer' }} onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>{t('reply')}</span>
                    {(Number(currentUser.id) === Number(comment.user_id) || !!currentUser.is_admin) && (
                        <span style={{ cursor: 'pointer', color: '#ff4444' }} onClick={() => handleDelete(comment.id)}>{t('delete')}</span>
                    )}
                    {Number(currentUser.id) === Number(projectOwnerId) && (
                        <span style={{ cursor: 'pointer', color: '#1db954' }} onClick={() => handlePin(comment.id)}>{comment.is_pinned ? t('unpin') : t('pin')}</span>
                    )}
                </div>
                {replyTo === comment.id && (
                    <form onSubmit={(e) => handleSubmit(e, comment.id)} style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <input className="dark-input" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder={`${t('reply')}...`} autoFocus />
                        <button type="submit" className="primary" style={{ borderRadius: '15px', padding: '5px 15px' }}>{t('reply')}</button>
                    </form>
                )}
            </div>
        </div>
    );

    const topLevelComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'white', height: '100%' }}>
            <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', gap: '10px' }}>
                <input className="dark-input" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('write_comment')} />
                <button type="submit" className="primary" style={{ borderRadius: '20px' }}>{t('post')}</button>
            </form>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? <p>Loading...</p> : topLevelComments.map(c => (
                    <div key={c.id}>{renderComment(c)}{getReplies(c.id).map(r => renderComment(r, true))}</div>
                ))}
            </div>
        </div>
    );
}

export default CommentsSection;