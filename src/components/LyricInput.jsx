import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const { t } = useLanguage();

    const parseText = (inputText) => {
        if (!inputText.trim()) return;

        // Check if text looks like SRT format (contains "-->")
        const isSRT = inputText.includes('-->');
        // Check if text looks like LRC format (contains timestamps like [00:00.00] or [00:00.000])
        const isLRC = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(inputText);

        if (isSRT) {
            // SRT Parsing Logic
            // Split by double newlines to separate blocks
            const blocks = inputText.trim().split(/\n\s*\n/);
            const parsedLyrics = [];
            const cleanLines = [];

            blocks.forEach(block => {
                const lines = block.split('\n');
                if (lines.length >= 2) {
                    // SRT format usually:
                    // 1 (Index)
                    // 00:00:01,000 --> 00:00:04,000 (Time)
                    // Text line 1
                    // Text line 2...

                    // Find the time line (it contains -->)
                    const timeLineIndex = lines.findIndex(line => line.includes('-->'));

                    if (timeLineIndex !== -1 && lines.length > timeLineIndex + 1) {
                        const timeLine = lines[timeLineIndex];
                        const textLines = lines.slice(timeLineIndex + 1);

                        // Parse times: HH:MM:SS,ms or MM:SS,ms
                        const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);

                        if (timeMatch) {
                            const toSeconds = (h, m, s, ms) =>
                                parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;

                            const startTime = toSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
                            const endTime = toSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

                            const content = textLines.join(' ').trim();

                            if (content) {
                                parsedLyrics.push({ text: content, start: startTime, end: endTime });
                                cleanLines.push(content);
                            }
                        }
                    }
                }
            });

            if (parsedLyrics.length > 0) {
                onParse(parsedLyrics);
                setText(cleanLines.join('\n'));
            } else {
                // Fallback if parsing fails
                alert("Could not parse SRT format. Please ensure standard SRT formatting.");
            }

        } else if (isLRC) {
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
                    // LRC only gives start time, end is implied by next line
                    parsedLyrics.push({ text: content, start: startTime });
                    cleanLines.push(line); // Keep valid lyric lines for LRC (or maybe just text?)
                    // Typically for LRC we might want to keep the raw text in the box or just content. 
                    // The original code kept the whole line. Let's stick to that for LRC maintenance.
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
        if (file && (file.name.endsWith('.lrc') || file.name.endsWith('.srt') || file.type === 'text/plain')) {
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
                {t('lyrics_instructions') || 'Enter lyrics, paste/drop LRC/SRT file'}
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
                placeholder="Paste lyrics here or drop .lrc/.srt file..."
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
