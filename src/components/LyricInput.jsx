import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const { t } = useLanguage();

    const parseText = (inputText) => {
        if (!inputText.trim()) return;

<<<<<<< HEAD
        // Check if text looks like LRC format
=======
        // Check if text looks like LRC format (contains timestamps like [00:00.00] or [00:00.000])
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
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
<<<<<<< HEAD
                    cleanLines.push(line);
                } else if (line.trim() !== '' && !line.trim().startsWith('[')) {
                    cleanLines.push(line);
                }
=======
                    cleanLines.push(line); // Keep valid lyric lines
                } else if (line.trim() !== '' && !line.trim().startsWith('[')) {
                    // Keep non-timestamped lines that aren't metadata tags (simple text)
                    cleanLines.push(line);
                }
                // Metadata lines (starting with [ but not timestamp) are skipped in cleanLines
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
            });

            if (parsedLyrics.length > 0) {
                onParse(parsedLyrics);
<<<<<<< HEAD
                setText(cleanLines.join('\n'));
=======
                setText(cleanLines.join('\n')); // Update textarea with clean content
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
            } else {
                const lines = inputText.split(',').filter(line => line.trim() !== '');
                onParse(lines);
            }
        } else {
<<<<<<< HEAD
=======
            // Legacy comma-separated parsing
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
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
<<<<<<< HEAD
            className="w-full max-w-xl mx-auto"
=======
            className={`lyric-input ${isDragging ? 'dragging' : ''}`}
            style={{ width: '100%', maxWidth: '600px' }}
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
<<<<<<< HEAD
            <p className="text-sm text-neutral-400 mb-2">
=======
            <p style={{ fontSize: '0.9em', color: '#b3b3b3', marginBottom: '8px' }}>
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
                {t('lyrics_instructions') || 'Enter lyrics separated by commas OR paste/drop LRC file'}
            </p>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
<<<<<<< HEAD
                className={`w-full min-h-[150px] bg-[#1e1e1e] text-neutral-200 border rounded-lg p-4 font-mono text-sm leading-relaxed outline-none transition-all whitespace-pre-wrap break-words resize-none ${isDragging ? 'bg-neutral-800 border-green-500 border-2 border-dashed' : 'border-neutral-800 focus:border-green-500'
                    }`}
                placeholder="Paste lyrics here or drop .lrc file..."
            />
            <button
                onClick={handleParse}
                className="mt-3 w-full py-3 bg-green-500 text-black rounded-full font-bold text-base hover:bg-green-400 transition-transform active:scale-95"
            >
=======
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
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7
                {t('parse_lyrics') || 'Parse Lyrics'}
            </button>
        </div>
    );
}

export default LyricInput;
