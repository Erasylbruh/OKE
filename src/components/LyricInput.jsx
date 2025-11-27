import { useState, useRef } from 'react';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);

    const handleParse = () => {
        if (!text.trim()) return;
        const lines = text.split(',').filter(line => line.trim() !== '');
        onParse(lines);
    };

    const handleInput = (e) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 80)}px`;
        }
    };

    return (
        <div className="lyric-input" style={{ width: '600px' }}>
            <p style={{ fontSize: '0.9em', color: '#b3b3b3', marginBottom: '8px' }}>
                Enter lyrics separated by commas (e.g. "Hello world, this is a test, karaoke time")
            </p>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                style={{
                    width: '100%',
                    minHeight: '80px',
                    height: '80px',
                    resize: 'none',
                    backgroundColor: '#282828',
                    color: 'white',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    padding: '10px',
                    overflow: 'hidden',
                    boxSizing: 'border-box' // Ensure padding doesn't overflow width
                }}
                placeholder="Paste lyrics here..."
            />
            <button onClick={handleParse} style={{
                marginTop: '10px',
                width: '100%',
                height: '40px',
                backgroundColor: '#1db954',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}>
                Parse Lyrics
            </button>
        </div>
    );
}

export default LyricInput;
