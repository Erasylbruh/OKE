import React, { useState, useEffect, useRef, useMemo } from 'react';

function Preview({ lyrics, styles, resetTrigger, audioUrl, backgroundImageUrl, projectName }) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const scrollContainerRef = useRef(null);
    const audioRef = useRef(null);
    const lineRefs = useRef([]); // Store refs for all lines
    const requestRef = useRef(); // For requestAnimationFrame
    const startTimeRef = useRef(0); // For timer logic without audio

    // Derived state: Find the index of the currently active line
    const activeLineIndex = useMemo(() => {
        return lyrics.findIndex(line => currentTime >= line.start && currentTime <= line.end);
    }, [lyrics, currentTime]);

    // Reset when trigger changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }, [resetTrigger, audioUrl]);

    // Animation Loop Logic
    const animate = () => {
        if (audioUrl && audioRef.current) {
            // SYNC WITH AUDIO
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.ended) {
                setIsPlaying(false);
                return; // Stop loop
            }
        } else {
            // SYNC WITH TIMER (No Audio)
            const now = Date.now();
            const time = (now - startTimeRef.current) / 1000;
            setCurrentTime(time);

            const lastEnd = lyrics.length > 0 ? Math.max(...lyrics.map(l => l.end)) : 0;
            if (time > lastEnd + 2) {
                setIsPlaying(false);
                setCurrentTime(0);
                return; // Stop loop
            }
        }
        // Continue loop
        requestRef.current = requestAnimationFrame(animate);
    };

    // Toggle Play/Pause Effect
    useEffect(() => {
        if (isPlaying) {
            if (audioUrl && audioRef.current) {
                audioRef.current.play().catch(e => console.error("Audio play error:", e));
            } else {
                // If no audio, calculate where start time should be relative to current progress
                startTimeRef.current = Date.now() - (currentTime * 1000);
            }
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (audioUrl && audioRef.current) {
                audioRef.current.pause();
            }
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- SMART AUTO-SCROLL LOGIC ---
    useEffect(() => {
        // Only scroll if we have a valid active line index
        if (activeLineIndex !== -1 && lineRefs.current[activeLineIndex]) {
            lineRefs.current[activeLineIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeLineIndex]); // <--- Only triggers when the LINE changes, not every millisecond

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);

        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        } else {
            // Update the reference start time so the timer resumes from the new seek point
            startTimeRef.current = Date.now() - (newTime * 1000);
        }
    };

    const lastEnd = lyrics.length > 0 ? Math.max(...lyrics.map(l => l.end)) : 0;
    const maxTime = audioRef.current?.duration || lastEnd + 2;

    const formatTimeSimple = (t) => {
        if (!t && t !== 0) return "0.0s";
        return t.toFixed(1) + 's';
    };

    return (
        <div className="preview-container" style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontFamily: styles.fontFamily,
            borderRadius: '12px',
            position: 'relative'
        }}>
            {audioUrl && <audio ref={audioRef} src={audioUrl} />}

            {/* Lyrics Display */}
            <div
                ref={scrollContainerRef}
                className="lyrics-display"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflowY: 'auto',
                    padding: '0 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: '140px',
                    paddingBottom: 'calc(50% - 20px)',
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    zIndex: 1,
                    paddingLeft: '50px'
                }}
            >
                {lyrics.map((line, index) => {
                    const isActive = index === activeLineIndex;
                    const isPast = activeLineIndex > index || (currentTime > line.end);

                    let fillPercentage = 0;
                    if (isPast && !isActive) {
                        fillPercentage = 100;
                    } else if (isActive) {
                        const duration = line.end - line.start;
                        if (duration > 0) {
                            fillPercentage = ((currentTime - line.start) / duration) * 100;
                            // Clamp percentage
                            fillPercentage = Math.min(100, Math.max(0, fillPercentage));
                        }
                    }

                    return (
                        <div
                            key={index}
                            ref={el => lineRefs.current[index] = el} // Store ref by index
                            style={{
                                marginBottom: '30px',
                                position: 'relative',
                                display: 'block',
                                width: 'fit-content',
                                textAlign: 'left',
                                fontSize: isActive ? `${styles.activeFontSize}px` : `${styles.fontSize}px`,
                                fontFamily: styles.fontFamily,
                                fontWeight: 'bold',
                                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out', // Smooth transition
                                whiteSpace: 'nowrap',
                                opacity: isActive ? 1 : 0.3,
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                transformOrigin: 'left center',
                                cursor: 'default',
                                WebkitTextStroke: '0',
                            }}
                        >
                            {/* Inactive Layer (Background) */}
                            <div style={{ color: styles.color }}>
                                {line.text}
                            </div>

                            {/* Active Layer (Foreground Mask - Karaoke Effect) */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${fillPercentage}%`,
                                overflow: 'hidden',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                                transition: 'width 0.1s linear' // Slight smoothing on the fill width
                            }}>
                                <div style={{
                                    color: styles.fillColor,
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    WebkitTextStroke: '0px',
                                }}>
                                    {line.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {lyrics.length === 0 && <div style={{ opacity: 0.5, fontWeight: 'bold', padding: '20px' }}>Lyrics will appear here...</div>}
            </div>

            {/* Player Controls */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                zIndex: 10
            }}>
                {/* Vinyl & Play Button Container */}
                <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        position: 'relative',
                        overflow: 'hidden',
                        animation: isPlaying && backgroundImageUrl ? 'rotate 4s linear infinite' : 'none',
                        boxShadow: backgroundImageUrl ? '0 2px 5px rgba(0,0,0,0.5)' : 'none',
                        border: backgroundImageUrl ? 'none' : '2px solid white',
                        backgroundColor: '#181818'
                    }}>
                        <style>
                            {`
                                @keyframes rotate {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                            `}
                        </style>
                        {backgroundImageUrl && (
                            <img
                                src={backgroundImageUrl}
                                alt="Vinyl"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'repeating-radial-gradient(#000 0, #000 2px, transparent 3px, transparent 4px)',
                            opacity: 0.1, pointerEvents: 'none'
                        }} />
                    </div>

                    <button
                        onClick={togglePlay}
                        style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '24px', height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            zIndex: 10
                        }}
                    >
                        {isPlaying ? (
                            <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '2px' }} />
                        ) : (
                            <div style={{
                                width: 0, height: 0,
                                borderTop: '5px solid transparent',
                                borderBottom: '5px solid transparent',
                                borderLeft: '9px solid white',
                                marginLeft: '2px'
                            }} />
                        )}
                    </button>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {(projectName || styles.headerText) && (
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {projectName || styles.headerText}
                        </div>
                    )}

                    <style>
                        {`
                            input[type=range].custom-range {
                                -webkit-appearance: none;
                                width: 100%;
                                background: transparent;
                                cursor: pointer;
                                height: 20px;
                                margin: 0;
                            }
                            input[type=range].custom-range:focus { outline: none; }
                            input[type=range].custom-range::-webkit-slider-runnable-track {
                                width: 100%; height: 4px; cursor: pointer;
                                background: rgba(255,255,255,0.2); border-radius: 2px;
                            }
                            input[type=range].custom-range::-webkit-slider-thumb {
                                height: 12px; width: 12px; border-radius: 50%;
                                background: ${styles.fillColor};
                                cursor: pointer; -webkit-appearance: none;
                                margin-top: -4px;
                            }
                            input[type=range].custom-range::-moz-range-track {
                                width: 100%; height: 4px; cursor: pointer;
                                background: rgba(255,255,255,0.2); border-radius: 2px;
                            }
                            input[type=range].custom-range::-moz-range-thumb {
                                height: 12px; width: 12px; border: none;
                                border-radius: 50%; background: ${styles.fillColor};
                                cursor: pointer;
                            }
                        `}
                    </style>
                    <div style={{ position: 'relative', height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '8px 0' }}>
                        <div style={{
                            position: 'absolute',
                            left: 0, top: 0, height: '100%',
                            width: `${(currentTime / (maxTime || 1)) * 100}%`,
                            backgroundColor: styles.fillColor,
                            borderRadius: '2px',
                            pointerEvents: 'none'
                        }} />
                        <input
                            type="range"
                            className="custom-range"
                            min="0"
                            max={maxTime || 10}
                            step="0.01"
                            value={currentTime}
                            onChange={handleSeek}
                            style={{
                                position: 'absolute', top: '-8px', left: 0,
                                width: '100%', opacity: 0, height: '20px', zIndex: 2
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            left: `${(currentTime / (maxTime || 1)) * 100}%`,
                            top: '-4px', width: '12px', height: '12px',
                            backgroundColor: styles.fillColor,
                            borderRadius: '50%',
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none', zIndex: 1
                        }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc', marginTop: '0px' }}>
                        <span>{formatTimeSimple(currentTime)}</span>
                        <span>{formatTimeSimple(maxTime)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Preview;