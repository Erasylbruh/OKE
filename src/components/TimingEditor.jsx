import React, { useState, useEffect } from 'react';

function TimeInput({ value, onChange, placeholder, style }) {
    // Helper to format seconds to mm.ss.ms
    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null || isNaN(seconds)) return '00.00.00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${String(m).padStart(2, '0')}.${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    };

    // Helper to parse mm.ss.ms to seconds
    const parseTime = (timeStr) => {
        const parts = timeStr.split('.');
        if (parts.length !== 3) return 0;
        const m = parseInt(parts[0], 10) || 0;
        const s = parseInt(parts[1], 10) || 0;
        const ms = parseInt(parts[2], 10) || 0;
        return m * 60 + s + ms / 100;
    };

    const [displayValue, setDisplayValue] = useState(formatTime(value));

    // Sync with external value changes
    useEffect(() => {
        setDisplayValue(formatTime(value));
    }, [value]);

    const handleBlur = () => {
        const seconds = parseTime(displayValue);
        onChange(seconds);
        // Re-format to ensure consistent display
        setDisplayValue(formatTime(seconds));
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            style={style}
        />
    );
}

function TimingEditor({ lyrics, onUpdate }) {
    return (
        <div className="timing-editor">
            {lyrics.map((line, index) => (
                <div key={line.id} className="timing-row" style={{
                    display: 'flex',
                    alignItems: 'flex-start', // Align to top
                    gap: '10px',
                    marginBottom: '10px',
                    padding: '10px 15px',
                    backgroundColor: '#282828',
                    borderRadius: '4px',
                    minHeight: '80px',
                    width: '100%',
                    maxWidth: '600px',
                    boxSizing: 'border-box',
                    flexWrap: 'wrap' // Allow wrapping
                }}>
                    <span style={{ width: '20px', color: '#b3b3b3', marginTop: '4px' }}>{index + 1}</span>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'white', wordBreak: 'break-word' }}>{line.text}</div>
                        <div className="timing-inputs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '0.8em', color: '#b3b3b3', display: 'flex', alignItems: 'center' }}>
                                Start:
                                <TimeInput
                                    value={line.start}
                                    onChange={(val) => onUpdate(index, 'start', val)}
                                    placeholder="mm.ss.ms"
                                    style={{ width: '80px', marginLeft: '5px', backgroundColor: '#333', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '3px' }}
                                />
                            </label>
                            <label style={{ fontSize: '0.8em', color: '#b3b3b3', display: 'flex', alignItems: 'center' }}>
                                End:
                                <TimeInput
                                    value={line.end}
                                    onChange={(val) => onUpdate(index, 'end', val)}
                                    placeholder="mm.ss.ms"
                                    style={{ width: '80px', marginLeft: '5px', backgroundColor: '#333', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '3px' }}
                                />
                            </label>
                        </div>
                    </div>
                    <button
                        className="circular-btn"
                        onClick={() => onUpdate(index, 'remove')}
                        title="Remove line"
                        style={{ marginTop: '4px' }}
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

export default TimingEditor;
