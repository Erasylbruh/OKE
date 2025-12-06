import React from 'react';
import CommentsSection from './CommentsSection';

function CommentsModal({ projectId, onClose }) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#282828', padding: '20px', borderRadius: '12px', width: '500px', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column', gap: '15px', color: 'white'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Comments</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.5em', cursor: 'pointer' }}>&times;</button>
                </div>

                <CommentsSection projectId={projectId} />
            </div>
        </div>
    );
}

export default CommentsModal;
