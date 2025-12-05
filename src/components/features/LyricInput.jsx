import { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const { t } = useLanguage();

    const parseText = (inputText) => {
        if (!inputText.trim()) return;
        const hasTimestamps = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(inputText);

        if (hasTimestamps) {
            const lines = inputText.split('\n');
            const parsedLyrics = [];
            const cleanLines = [];

            lines.forEach(line => {
                const match = line.match(/\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/);
                if (match) {
                    const seconds = parseInt(match[1]) * 60 + parseFloat(match[2]);
                    parsedLyrics.push({ text: match[3].trim(), start: seconds });
                    cleanLines.push(line);
                } else if (line.trim() && !line.trim().startsWith('[')) {
                    cleanLines.push(line);
                }
            });

            if (parsedLyrics.length > 0) {
                onParse(parsedLyrics);
                setText(cleanLines.join('\n'));
            } else {
                onParse(inputText.split(',').filter(l => l.trim()));
            }
        } else {
            onParse(inputText.split(',').filter(l => l.trim()));
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            const content = await file.text();
            setText(content);
            parseText(content);
        }
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{ width: '100%' }}
        >
            <p style={{ fontSize: '0.9em', color: '#b3b3b3', marginBottom: '8px' }}>{t('lyrics_instructions') || 'Enter lyrics or drop .lrc file'}</p>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="dark-input"
                style={{ width: '100%', minHeight: '150px', border: isDragging ? '2px dashed #1db954' : '1px solid #333', fontFamily: 'monospace', resize: 'vertical' }}
                placeholder="Lyrics..."
            />
            <button onClick={() => parseText(text)} className="primary" style={{ marginTop: '10px', width: '100%', borderRadius: '25px' }}>
                {t('parse_lyrics') || 'Parse'}
            </button>
        </div>
    );
}

export default LyricInput;