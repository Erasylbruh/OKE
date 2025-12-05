import React, { useState, useEffect } from 'react';

// Sub-component for time input
function TimeInput({ value, onChange, placeholder }) {
    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds)) return '00.00.00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${String(m).padStart(2, '0')}.${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    };

    const parseTime = (timeStr) => {
        const parts = timeStr.split('.');
        if (parts.length !== 3) return 0;
        const m = parseInt(parts[0], 10) || 0;
        const s = parseInt(parts[1], 10) || 0;
        const ms = parseInt(parts[2], 10) || 0;
        return m * 60 + s + ms / 100;
    };

    const [displayValue, setDisplayValue] = useState(formatTime(value));

    useEffect(() => {
        setDisplayValue(formatTime(value));
    }, [value]);

    const handleBlur = () => {
        const seconds = parseTime(displayValue);
        onChange(seconds);
        setDisplayValue(formatTime(seconds));
    };

    return (
        <input
            className="dark-input"
            type="text"
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            style={{ width: '80px', padding: '4px', height: 'auto', textAlign: 'center' }}
        />
    );
}

function TimingEditor({ lyrics, onUpdate }) {
    return (
        <div className="timing-editor" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lyrics.map((line, index) => (
                <div key={line.id} className="card" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#282828' }}>
                    <span style={{ color: '#666', width: '20px' }}>{index + 1}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>{line.text}</div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.8em', color: '#b3b3b3' }}>Start: <TimeInput value={line.start} onChange={(val) => onUpdate(index, 'start', val)} /></label>
                            <label style={{ fontSize: '0.8em', color: '#b3b3b3' }}>End: <TimeInput value={line.end} onChange={(val) => onUpdate(index, 'end', val)} /></label>
                        </div>
                    </div>
                    <button className="circular-btn" onClick={() => onUpdate(index, 'remove')} title="Remove">✕</button>
                </div>
            ))}
        </div>
    );
}

export default TimingEditor;