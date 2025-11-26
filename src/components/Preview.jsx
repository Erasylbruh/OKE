import React, { useState, useEffect, useRef } from 'react';

function Preview({ lyrics, styles, resetTrigger }) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const activeLineRef = useRef(null);

    // Reset when trigger changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
    }, [resetTrigger]);

    // Better simple player logic
    useEffect(() => {
        let interval;
        if (isPlaying) {
            const start = Date.now() - currentTime * 1000;
            interval = setInterval(() => {
                const time = (Date.now() - start) / 1000;
                setCurrentTime(time);

                // Auto-stop logic: End + 5s
                const lastEnd = lyrics.length > 0 ? Math.max(...lyrics.map(l => l.end)) : 0;
                if (time > lastEnd + 5) {
                    setIsPlaying(false);
                    setCurrentTime(0); // Optional: reset to start after finish
                }
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying, lyrics]);

    // Auto-scroll logic
    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTime]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        setCurrentTime(parseFloat(e.target.value));
        if (isPlaying) {
            setIsPlaying(false);
            setTimeout(() => setIsPlaying(true), 10);
        }
    };

    const lastEnd = lyrics.length > 0 ? Math.max(...lyrics.map(l => l.end)) : 0;
    const maxTime = lastEnd + 5;

    return (
        <div className="preview-container" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontFamily: styles.fontFamily,
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header / Controls */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={togglePlay} style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <input
                    type="range"
                    min="0"
                    max={maxTime || 10}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    style={{ flex: 1 }}
                />
                <span style={{ minWidth: '50px', textAlign: 'right' }}>{currentTime.toFixed(1)}s</span>
            </div>

            {/* Lyrics Display */}
            <div className="lyrics-display" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                textAlign: 'left' // Left align
            }}>
                {lyrics.map((line, index) => {
                    const isActive = currentTime >= line.start && currentTime <= line.end;
                    const isPast = currentTime > line.end;

                    let fillPercentage = 0;
                    if (isPast) {
                        fillPercentage = 100;
                    } else if (isActive) {
                        const duration = line.end - line.start;
                        if (duration > 0) {
                            fillPercentage = ((currentTime - line.start) / duration) * 100;
                        }
                    }

                    return (
                        <div
                            key={index}
                            ref={isActive ? activeLineRef : null} // Ref for auto-scroll
                            style={{
                                marginBottom: '20px',
                                position: 'relative',
                                display: 'inline-block',
                                width: '100%', // Full width
                                textAlign: 'left', // Left align text
                                fontSize: isActive ? `${styles.activeFontSize}px` : `${styles.fontSize}px`,
                                fontFamily: styles.fontFamily,
                                transition: 'font-size 0.2s ease-out',
                            }}
                        >
                            {/* Inactive Layer (Background) */}
                            <div style={{ color: styles.color }}>
                                {line.text}
                            </div>

                            {/* Active Layer (Foreground Mask) */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${fillPercentage}%`,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none'
                            }}>
                                <div style={{ color: styles.fillColor }}>
                                    {line.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {lyrics.length === 0 && <div style={{ opacity: 0.5 }}>Lyrics will appear here...</div>}
            </div>
        </div>
    );
}

export default Preview;
