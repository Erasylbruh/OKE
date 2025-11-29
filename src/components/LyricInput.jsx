import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const { t } = useLanguage();

    const parseText = (inputText) => {
        if (!inputText.trim()) return;

        // Check if text looks like LRC format (contains timestamps like [00:00.00] or [00:00.000])
        const hasTimestamps = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(inputText);

        if (hasTimestamps) {
            const lines = inputText.split('\n');
            const parsedLyrics = [];
            const cleanLines = [];

            lines.forEach(line => {
                const match = line.match(/\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseFloat(match[2]);
                    const startTime = minutes * 60 + seconds;
                    const content = match[3].trim();
                    parsedLyrics.push({ text: content, start: startTime });
                    cleanLines.push(line); // Keep valid lyric lines
                } else if (line.trim() !== '' && !line.trim().startsWith('[')) {
                    // Keep non-timestamped lines that aren't metadata tags (simple text)
                    cleanLines.push(line);
                }
                // Metadata lines (starting with [ but not timestamp) are skipped in cleanLines
            });

            if (parsedLyrics.length > 0) {
                onParse(parsedLyrics);
                setText(cleanLines.join('\n')); // Update textarea with clean content
            } else {
                const lines = inputText.split(',').filter(line => line.trim() !== '');
                onParse(lines);
            }
        } else {
            // Legacy comma-separated parsing
            const lines = inputText.split(',').filter(line => line.trim() !== '');
            onParse(lines);
        }
    };

    const handleParse = () => {
        parseText(text);
    };

    const handleInput = (e) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 80)}px`;
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.lrc') || file.type === 'text/plain')) {
            const text = await file.text();
            setText(text);
            parseText(text);
        } else {
            alert('Please drop a valid .lrc or .txt file');
        }
    };

    return (
        <div
            className={`lyric-input ${isDragging ? 'dragging' : ''}`}
            style={{ width: '100%', maxWidth: '600px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <p style={{ fontSize: '0.9em', color: '#b3b3b3', marginBottom: '8px' }}>
                {t('lyrics_instructions') || 'Enter lyrics separated by commas OR paste/drop LRC file'}
            </p>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                style={{
                    width: '100%',
                    minHeight: '150px',
                    height: 'auto',
                    resize: 'vertical',
                    backgroundColor: isDragging ? '#333' : '#1e1e1e',
                    color: '#e0e0e0',
                    border: isDragging ? '2px dashed #1db954' : '1px solid #333',
                    borderRadius: '8px',
                    padding: '15px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'pre-wrap', // Ensure text wraps nicely
                    wordBreak: 'break-word' // Prevent aggressive breaking
                }}
                placeholder="Paste lyrics here or drop .lrc file..."
            />
            <button onClick={handleParse} style={{
                marginTop: '10px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#1db954',
                color: 'black',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'transform 0.1s'
            }}>
                {t('parse_lyrics') || 'Parse Lyrics'}
            </button>
        </div>
    );
}

export default LyricInput;
