import { useState } from 'react';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');

    const handleParse = () => {
        if (!text.trim()) return;
        // Split by newlines first, then maybe commas if requested? 
        // User request: "separates lines by commas" (разделяет строчки запятыми).
        // So I should split by comma.
        const lines = text.split(',').filter(line => line.trim() !== '');
        onParse(lines);
    };

    return (
        <div className="lyric-input">
            <p style={{ fontSize: '0.9em', color: '#b3b3b3', marginBottom: '8px' }}>
                Enter lyrics separated by commas (e.g. "Hello world, this is a test, karaoke time")
            </p>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Paste lyrics here..."
            />
            <button onClick={handleParse} style={{ marginTop: '10px', width: '100%' }}>
                Parse Lyrics
            </button>
        </div>
    );
}

export default LyricInput;
