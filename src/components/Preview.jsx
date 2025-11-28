import React, { useState, useEffect, useRef } from 'react';

function Preview({ lyrics, styles, resetTrigger, audioUrl, backgroundImageUrl }) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const activeLineRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const audioRef = useRef(null);

    // Reset when trigger changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [resetTrigger, audioUrl]);

    // Player logic
    useEffect(() => {
        let interval;
        if (isPlaying) {
            if (audioRef.current && audioUrl) {
                audioRef.current.play().catch(e => console.error("Audio play error:", e));
            }

            // If audio is present, use audio time. Otherwise use timer.
            if (audioUrl) {
                interval = setInterval(() => {
                    if (audioRef.current) {
                        setCurrentTime(audioRef.current.currentTime);
                        if (audioRef.current.ended) {
                            setIsPlaying(false);
                        }
                    }
                }, 16);
            } else {
                const start = Date.now() - currentTime * 1000;
                interval = setInterval(() => {
                    const time = (Date.now() - start) / 1000;
                    setCurrentTime(time);

                    const lastEnd = lyrics.length > 0 ? Math.max(...lyrics.map(l => l.end)) : 0;
                    if (time > lastEnd + 2) { // Stop 2s after last end
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }
                }, 16); // ~60fps
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        }
        return () => clearInterval(interval);
    }, [isPlaying, lyrics, audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }

        if (isPlaying) {
            // If using timer (no audio), we need to reset start time in effect, 
            // but since effect depends on isPlaying, toggling it is easiest way to reset if not using audio.
            // With audio, setting currentTime is enough.
            if (!audioUrl) {
                setIsPlaying(false);
                setTimeout(() => setIsPlaying(true), 10);
            }
        }
    };

    const lastEnd = lyrics.length > 0 ? Math.max(...lyrics.map(l => l.end)) : 0;
    const maxTime = audioRef.current?.duration || lastEnd + 2;

    // Format time for display
    const formatTimeSimple = (t) => {
        if (!t && t !== 0) return "0.0s";
        return t.toFixed(1) + 's';
    };

    return (
        <div className="preview-container" style={{
            height: '100%',
            width: '100%', // Ensure full width of parent (569px)
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontFamily: styles.fontFamily,
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {audioUrl && <audio ref={audioRef} src={audioUrl} />}

            {/* Player Controls - Top */}
            <div style={{
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent dark
                backdropFilter: 'blur(5px)', // Glass effect
                borderRadius: '12px',
                margin: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <button
                    onClick={togglePlay}
                    style={{
                        width: '60px', // Increased size for vinyl look
                        height: '60px',
                        borderRadius: '50%',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'transparent',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: backgroundImageUrl ? 'none' : '2px solid white',
                        color: 'white',
                        cursor: 'pointer',
                        flexShrink: 0,
                        animation: isPlaying && backgroundImageUrl ? 'rotate 4s linear infinite' : 'none',
                        position: 'relative',
                        boxShadow: backgroundImageUrl ? '0 2px 5px rgba(0,0,0,0.5)' : 'none'
                    }}
                >
                    {/* Rotation Keyframes */}
                    <style>
                        {`
                            @keyframes rotate {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}
                    </style>

                    {/* Overlay for play/pause icon if image is present */}
                    {backgroundImageUrl && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            borderRadius: '50%'
                        }} />
                    )}

                    {/* Center Hole for Vinyl Look */}
                    {backgroundImageUrl && (
                        <div style={{
                            position: 'absolute',
                            width: '15%',
                            height: '15%',
                            backgroundColor: '#181818',
                            borderRadius: '50%',
                            zIndex: 1
                        }} />
                    )}

                    {/* Vinyl Grooves Effect (Subtle overlay) */}
                    {backgroundImageUrl && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'repeating-radial-gradient(#000 0, #000 2px, transparent 3px, transparent 4px)',
                            opacity: 0.1,
                            borderRadius: '50%',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }} />
                    )}

                    {isPlaying ? (
                        <div style={{ width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '2px', zIndex: 2 }} />
                    ) : (
                        <div style={{
                            width: 0,
                            height: 0,
                            borderTop: '8px solid transparent',
                            borderBottom: '8px solid transparent',
                            borderLeft: '14px solid white',
                            marginLeft: '4px',
                            zIndex: 2
                        }} />
                    )}
                </button>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Custom Range Input Styling */}
                    <style>
                        {`
                            input[type=range].custom-range {
                                -webkit-appearance: none;
                                width: 100%;
                                background: transparent;
                                cursor: pointer;
                                height: 20px; /* Hit area */
                                margin: 0;
                            }
                            input[type=range].custom-range:focus {
                                outline: none;
                            }
                            
                            /* Webkit (Chrome, Safari, Edge) */
                            input[type=range].custom-range::-webkit-slider-runnable-track {
                                width: 100%;
                                height: 4px;
                                cursor: pointer;
                                background: rgba(255,255,255,0.2);
                                border-radius: 2px;
                            }
                            input[type=range].custom-range::-webkit-slider-thumb {
                                height: 12px;
                                width: 12px;
                                border-radius: 50%;
                                background: ${styles.fillColor};
                                cursor: pointer;
                                -webkit-appearance: none;
                                margin-top: -4px; /* Center thumb on track */
                            }
                            
                            /* Firefox */
                            input[type=range].custom-range::-moz-range-track {
                                width: 100%;
                                height: 4px;
                                cursor: pointer;
                                background: rgba(255,255,255,0.2);
                                border-radius: 2px;
                            }
                            input[type=range].custom-range::-moz-range-thumb {
                                height: 12px;
                                width: 12px;
                                border: none;
                                border-radius: 50%;
                                background: ${styles.fillColor};
                                cursor: pointer;
                            }
                        `}
                    </style>
                    <div style={{ position: 'relative', height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '8px' }}>
                        {/* Filled portion of the bar */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
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
                                position: 'absolute',
                                top: '-8px', // Align input over the visual bar
                                left: 0,
                                width: '100%',
                                opacity: 0, // Hide default input, use custom visual
                                height: '20px',
                                zIndex: 2
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            left: `${(currentTime / (maxTime || 1)) * 100}%`,
                            top: '-4px',
                            width: '12px',
                            height: '12px',
                            backgroundColor: styles.fillColor,
                            borderRadius: '50%',
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                            zIndex: 1
                        }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc', marginTop: '0px' }}>
                        <span>{formatTimeSimple(currentTime)}</span>
                        <span>{formatTimeSimple(maxTime)}</span>
                    </div>
                </div>
            </div>

            {/* Static Header Text */}
            {styles.headerText && (
                <div style={{
                    position: 'absolute',
                    top: '100px', // Below player controls
                    left: '40px', // Aligned with lyrics padding
                    textAlign: 'left',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    zIndex: 5,
                    pointerEvents: 'none',
                    color: styles.color,
                    opacity: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                    {styles.headerText}
                </div>
            )}

            {/* Lyrics Display */}
            <div
                ref={scrollContainerRef}
                className="lyrics-display"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    // Use 50% of container height to push content to center
                    paddingTop: 'calc(50% - 20px)',
                    paddingBottom: 'calc(50% - 20px)',
                    textAlign: 'left',
                    alignItems: 'flex-start'
                }}
            >
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
                            ref={isActive ? activeLineRef : null}
                            style={{
                                marginBottom: '30px',
                                position: 'relative',
                                display: 'block',
                                width: 'fit-content',
                                textAlign: 'left',
                                fontSize: isActive ? `${styles.activeFontSize}px` : `${styles.fontSize}px`,
                                fontFamily: styles.fontFamily,
                                fontWeight: 'bold', // Spotify style bold
                                transition: 'all 0.3s ease-out',
                                whiteSpace: 'nowrap',
                                opacity: isActive ? 1 : 0.3, // Lower opacity for inactive to mimic dark/inactive look
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                transformOrigin: 'left center',
                                cursor: 'default'
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
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap'
                            }}>
                                <div style={{
                                    color: styles.fillColor,
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                }}>
                                    {line.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {lyrics.length === 0 && <div style={{ opacity: 0.5, fontWeight: 'bold', padding: '20px' }}>Lyrics will appear here...</div>}
            </div>
        </div>
    );
}

export default Preview;
