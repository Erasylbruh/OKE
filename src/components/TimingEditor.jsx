<<<<<<< HEAD
import React, { useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { FaPlay, FaPause } from 'react-icons/fa';

const TimingEditor = ({ lyrics, onUpdate }) => {
    const { isPlaying, playTrack, currentTrackId, pauseTrack } = useAudio();
    // Ideally we would sync with audio time, but for now this is a manual editor provided
    // If the original had automatic scrolling or sync, we would need that logic.
    // Based on previous view, it seemed to be a list of inputs.

    const handleChange = (index, field, value) => {
        onUpdate(index, field, parseFloat(value));
    };

    return (
        <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-neutral-500 font-bold uppercase sticky top-0 bg-neutral-900 pb-2 border-b border-neutral-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-7">Content</div>
                <div className="col-span-2 text-center">Start (s)</div>
                <div className="col-span-2 text-center">End (s)</div>
            </div>

            <div className="space-y-1">
                {lyrics.map((line, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-center hover:bg-neutral-800 p-2 rounded transition-colors group"
                    >
                        <div className="col-span-1 text-center text-neutral-500 text-xs">
                            {index + 1}
                        </div>
                        <div className="col-span-7 text-sm text-neutral-300 truncate font-mono" title={line.text}>
                            {line.text}
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                step="0.1"
                                value={line.start}
                                onChange={(e) => handleChange(index, 'start', e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-xs text-center focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                step="0.1"
                                value={line.end}
                                onChange={(e) => handleChange(index, 'end', e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-xs text-center focus:border-green-500 focus:outline-none"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {lyrics.length === 0 && (
                <div className="text-center text-neutral-500 py-8 text-sm">
                    No lyrics to sync. Add lyrics in the previous step.
                </div>
            )}
        </div>
    );
};
=======
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
>>>>>>> 79d52c792460071028c6ce6892c6a03c21402ae7

export default TimingEditor;
