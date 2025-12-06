import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

function LyricInput({ onParse }) {
    const [text, setText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const { t } = useLanguage();

    const parseText = (inputText) => {
        if (!inputText.trim()) return;

        // 1. Try to parse as JSON first (for precise timestamps from Whisper/External)
        try {
            if (inputText.trim().startsWith('[') || inputText.trim().startsWith('{')) {
                const json = JSON.parse(inputText);
                if (Array.isArray(json)) {
                    // Validate basic structure
                    const validItems = json.filter(item => typeof item.text === 'string' && typeof item.start === 'number');
                    if (validItems.length > 0) {
                        onParse(validItems);
                        // Make pretty for textarea
                        setText(JSON.stringify(validItems, null, 2));
                        return;
                    }
                }
            }
        } catch (e) {
            // Not valid JSON, continue to LRC/Text parsing
            console.log("Input is not valid JSON, trying LRC...", e);
        }

        // 2. Check if text looks like LRC format
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
                    const time = minutes * 60 + seconds;
                    const text = match[3].trim();
                    if (text) {
                        parsedLyrics.push({ start: time, text });
                        cleanLines.push(line);
                    }
                } else if (line.trim() !== '' && !line.trim().startsWith('[')) {
                    cleanLines.push(line);
                }
            });

            if (parsedLyrics.length > 0) {
                onParse(parsedLyrics);
                setText(cleanLines.join('\n'));
            } else {
                const lines = inputText.split(',').filter(line => line.trim() !== '');
                onParse(lines);
            }
        } else {
            // 3. Fallback to basic comma/newline separated text
            const lines = inputText.split(/[\n,]/).filter(line => line.trim() !== '').map(l => l.trim());
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
            className="w-full max-w-xl mx-auto"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <p className="text-sm text-neutral-400 mb-2">
                {t('lyrics_instructions') || 'Enter lyrics separated by commas OR paste/drop LRC file'}
            </p>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                className={`w-full min-h-[150px] bg-[#1e1e1e] text-neutral-200 border rounded-lg p-4 font-mono text-sm leading-relaxed outline-none transition-all whitespace-pre-wrap break-words resize-none ${isDragging ? 'bg-neutral-800 border-green-500 border-2 border-dashed' : 'border-neutral-800 focus:border-green-500'
                    }`}
                placeholder="Paste lyrics here or drop .lrc file..."
            />
            <button
                onClick={handleParse}
                className="mt-3 w-full py-3 bg-green-500 text-black rounded-full font-bold text-base hover:bg-green-400 transition-transform active:scale-95"
            >
                {t('parse_lyrics') || 'Parse Lyrics'}
            </button>
        </div>
    );
}

export default LyricInput;
