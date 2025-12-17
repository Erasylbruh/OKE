import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import QRCode from "react-qr-code";

// --- Sub-Components ---

/**
 * LyricsDisplay Component
 * Handles rendering of lyrics lines and auto-scrolling.
 * Includes defensive checks for lyrics data.
 */
const LyricsDisplay = ({ lyrics = [], currentTime = 0, styles = {}, activeLineIndex = -1 }) => {
    const scrollContainerRef = useRef(null);
    const contentRef = useRef(null);
    const lineRefs = useRef([]);
    const [translateY, setTranslateY] = useState(0);

    // Validate lyrics prop
    const safeLyrics = useMemo(() => {
        if (!Array.isArray(lyrics)) return [];
        return lyrics.filter(l => l && typeof l.start === 'number' && typeof l.end === 'number' && typeof l.text === 'string');
    }, [lyrics]);

    // Compute targetIndex for scrolling (active line or next line if in gap)
    const targetIndex = useMemo(() => {
        if (activeLineIndex !== -1) return activeLineIndex;

        // If no active line, find the next upcoming line
        const nextIndex = safeLyrics.findIndex(l => l.start > currentTime);
        if (nextIndex !== -1) return nextIndex;

        // If we heavily passed the last line, stay on the last line
        if (safeLyrics.length > 0 && currentTime > safeLyrics[safeLyrics.length - 1].end) {
            return safeLyrics.length - 1;
        }

        return 0; // Default to first line
    }, [activeLineIndex, safeLyrics, currentTime]);

    // Calculate vertical shift to center the target line
    useEffect(() => {
        if (targetIndex !== -1 && lineRefs.current[targetIndex] && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const line = lineRefs.current[targetIndex];

            // Dimensions and Positions
            const containerHeight = container.clientHeight;
            const lineTop = line.offsetTop;
            const lineHeight = line.clientHeight;

            // Usage of the requested formula:
            // Y = (CenterScreen) - (ActiveElementPosition + HalfHeightActive)
            const targetY = (containerHeight / 2) - (lineTop + lineHeight / 2);

            setTranslateY(targetY);
        }
    }, [targetIndex, safeLyrics]); // Re-run if target changes

    // Safe style access
    const getStyle = (key, fallback) => styles && styles[key] ? styles[key] : fallback;

    return (
        <div
            ref={scrollContainerRef}
            className="lyrics-display"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'auto', // Enable scrolling
                backgroundColor: 'transparent',
                // Hide scrollbar for all browsers
                msOverflowStyle: 'none',  // IE and Edge
                scrollbarWidth: 'none',   // Firefox
            }}
        >
            <style>
                {`
                    .lyrics-display::-webkit-scrollbar {
                        display: none; /* Chrome, Safari, Edge */
                    }
                `}
            </style>
            <div
                ref={contentRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${translateY}px)`,
                    willChange: 'transform',
                    transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth implementation
                    padding: '0 40px', // Horizontal padding moved here
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                }}
            >
                {safeLyrics.map((line, index) => {
                    const isActive = index === activeLineIndex;
                    const isPast = activeLineIndex > index || (currentTime > line.end);

                    // Calculate fill percentage for karaoke effect
                    let fillPercentage = 0;
                    if (isPast && !isActive) {
                        fillPercentage = 100;
                    } else if (isActive) {
                        const duration = line.end - line.start;
                        if (duration > 0) {
                            fillPercentage = ((currentTime - line.start) / duration) * 100;
                            fillPercentage = Math.min(100, Math.max(0, fillPercentage));
                        }
                    }

                    return (
                        <div
                            key={index}
                            ref={el => lineRefs.current[index] = el}
                            style={{
                                marginBottom: '5px',
                                position: 'relative',
                                display: 'block',
                                width: 'fit-content',
                                textAlign: 'left',
                                fontSize: isActive ? `${getStyle('activeFontSize', 24)}px` : `${getStyle('fontSize', 18)}px`,
                                fontFamily: getStyle('fontFamily', 'Inter, sans-serif'),
                                fontWeight: 'bold',
                                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                                whiteSpace: 'nowrap',
                                opacity: isActive ? 1 : 0.3,
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                transformOrigin: 'left center',
                                cursor: 'default',
                                WebkitTextStroke: '0',
                            }}
                        >
                            {/* Background Layer (Inactive Color) */}
                            <div style={{ color: getStyle('color', '#ffffff') }}>
                                {line.text}
                            </div>

                            {/* Foreground Layer (Active Fill Color) */}
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
                                    color: getStyle('fillColor', '#1db954'),
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
                {safeLyrics.length === 0 && (
                    <div style={{ opacity: 0.5, fontWeight: 'bold', padding: '20px', color: getStyle('color', '#ffffff') }}>
                        Lyrics will appear here...
                    </div>
                )}

                {/* Project QR Code Watermark */
                    safeLyrics.length > 0 && (
                        <div style={{
                            marginTop: '80px',
                            marginBottom: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center', // Center relative to container width?
                            // Note: alignItems is 'flex-start' on the parent. 
                            // To center this block, we might need alignSelf: center or width 100% + alignItems center.
                            width: '100%',
                            opacity: 0.8
                        }}>
                            <div style={{
                                marginBottom: '10px',
                                fontWeight: 'bold',
                                color: getStyle('color', '#ffffff'),
                                fontSize: '14px',
                                fontFamily: getStyle('fontFamily', 'Inter, sans-serif')
                            }}>
                                Made on QaraOke
                            </div>
                            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '8px', display: 'inline-block' }}>
                                <QRCode
                                    value={window.location.href}
                                    size={120}
                                    fgColor={getStyle('qrColor', '#000000')}
                                    bgColor="white"
                                />
                            </div>
                            <div style={{
                                marginTop: '5px',
                                fontSize: '10px',
                                color: getStyle('color', '#ffffff'),
                                textAlign: 'center'
                            }}>
                                Scan to play
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

/**
 * PlayerControls Component
 * Handles play/pause, seeking, and vinyl animation.
 */
const PlayerControls = ({
    isPlaying,
    togglePlay,
    currentTime,
    maxTime,
    handleSeek,
    styles = {},
    backgroundImageUrl,
    projectName,
    isFullscreen = false,
    toggleFullscreen = () => { }
}) => {
    const formatTime = (t) => {
        if (typeof t !== 'number' || isNaN(t)) return "00:00";
        const totalSeconds = Math.max(0, t);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const getStyle = (key, fallback) => styles && styles[key] ? styles[key] : fallback;
    const fillColor = getStyle('fillColor', '#1db954');

    // Clamp progress for display
    const safeCurrentTime = Math.max(0, currentTime);
    const safeMaxTime = Math.max(0.1, maxTime || 1); // Avoid division by zero
    const progressPercent = Math.min(100, Math.max(0, (safeCurrentTime / safeMaxTime) * 100));

    // High-precision progress bar click handler
    const handleProgressBarClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * safeMaxTime;
        handleSeek({ target: { value: newTime } });
    };

    return (
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
            {/* Vinyl & Play Button */}
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
                        {`@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
                    </style>
                    {backgroundImageUrl && (
                        <img
                            src={backgroundImageUrl}
                            alt="Vinyl"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => e.target.style.display = 'none'} // Hide broken images
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
                        top: '54%', left: '53%',
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



            {/* Progress Bar & Info */}
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
                        input[type=range].custom-range { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; height: 20px; margin: 0; }
                        input[type=range].custom-range:focus { outline: none; }
                        input[type=range].custom-range::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.2); border-radius: 2px; }
                        input[type=range].custom-range::-webkit-slider-thumb { height: 12px; width: 12px; border-radius: 50%; background: ${fillColor}; cursor: pointer; -webkit-appearance: none; margin-top: -4px; }
                        input[type=range].custom-range::-moz-range-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.2); border-radius: 2px; }
                        input[type=range].custom-range::-moz-range-thumb { height: 12px; width: 12px; border: none; border-radius: 50%; background: ${fillColor}; cursor: pointer; }
                    `}
                </style>
                <div
                    onClick={handleProgressBarClick}
                    style={{
                        position: 'relative',
                        height: '4px',
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '2px',
                        margin: '8px 0',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0, height: '100%',
                        width: `${progressPercent}%`,
                        backgroundColor: fillColor,
                        borderRadius: '2px',
                        pointerEvents: 'none'
                    }} />
                    <input
                        type="range"
                        className="custom-range"
                        min="0"
                        max={safeMaxTime}
                        step="0.01"
                        value={safeCurrentTime}
                        onChange={handleSeek}
                        style={{
                            position: 'absolute', top: '-8px', left: 0,
                            width: '100%', opacity: 0, height: '20px', zIndex: 2,
                            pointerEvents: 'none'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        left: `${progressPercent}%`,
                        top: '-4px', width: '12px', height: '12px',
                        backgroundColor: fillColor,
                        borderRadius: '50%',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none', zIndex: 1
                    }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#ccc', marginTop: '0px' }}>
                    <span>{formatTime(safeCurrentTime)}</span>
                    <span>{formatTime(maxTime)}</span>
                    {/* Fullscreen Toggle Button */}
                    <button
                        onClick={toggleFullscreen}
                        style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '10px',
                            transition: 'all 0.2s'
                        }}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? '⛶' : '⛶'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

function Preview({ lyrics = [], styles = {}, resetTrigger, audioUrl, backgroundImageUrl, projectName }) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);

    const audioRef = useRef(null);
    const requestRef = useRef(null);
    const startTimeRef = useRef(0);
    const lyricsRef = useRef(lyrics);
    const isPlayingRef = useRef(isPlaying); // Track playing state in ref for loops

    // Detect portrait orientation on mobile
    useEffect(() => {
        const checkOrientation = () => {
            setIsPortrait(window.matchMedia('(max-width: 877px) and (orientation: portrait)').matches);
        };
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // Update refs when props/state change
    useEffect(() => {
        lyricsRef.current = Array.isArray(lyrics) ? lyrics : [];
    }, [lyrics]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Derived State
    const activeLineIndex = useMemo(() => {
        if (!Array.isArray(lyrics)) return -1;
        return lyrics.findIndex(line =>
            line && typeof line.start === 'number' && typeof line.end === 'number' &&
            currentTime >= line.start && currentTime <= line.end
        );
    }, [lyrics, currentTime]);

    const lastEnd = useMemo(() => {
        if (!Array.isArray(lyrics) || lyrics.length === 0) return 0;
        return Math.max(...lyrics.map(l => (l && typeof l.end === 'number') ? l.end : 0));
    }, [lyrics]);

    const maxTime = (audioRef.current?.duration) || (lastEnd + 2);

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

    // Animation Loop
    const animate = useCallback(() => {
        if (audioUrl && audioRef.current) {
            // Sync with Audio
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.ended) {
                setIsPlaying(false);
                return;
            }
        } else {
            // Sync with Timer
            const now = Date.now();
            const time = (now - startTimeRef.current) / 1000;
            setCurrentTime(time);

            // Check end condition
            const currentLastEnd = lyricsRef.current.length > 0 ?
                Math.max(...lyricsRef.current.map(l => (l && typeof l.end === 'number') ? l.end : 0)) : 0;

            if (time > currentLastEnd + 2) {
                setIsPlaying(false);
                setCurrentTime(0);
                return;
            }
        }

        // Only continue if still playing
        if (isPlayingRef.current) {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [audioUrl]);

    // Handle Play/Pause Effect
    useEffect(() => {
        const handleAudioPlay = async () => {
            if (isPlaying) {
                if (audioUrl && audioRef.current) {
                    try {
                        await audioRef.current.play();
                    } catch (e) {
                        console.warn("Audio playback interrupted or failed:", e);
                        setIsPlaying(false); // Revert state if play fails
                        return;
                    }
                } else {
                    // Initialize timer start time based on current progress
                    startTimeRef.current = Date.now() - (currentTime * 1000);
                }

                // Start animation loop
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                requestRef.current = requestAnimationFrame(animate);
            } else {
                if (audioUrl && audioRef.current) {
                    audioRef.current.pause();
                }
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
            }
        };

        handleAudioPlay();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, audioUrl, animate, currentTime]);

    const togglePlay = () => setIsPlaying(prev => !prev);

    // Native fullscreen API implementation
    const fullscreenContainerRef = useRef(null);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                // Enter fullscreen
                const element = fullscreenContainerRef.current;
                if (element) {
                    if (element.requestFullscreen) {
                        await element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) { // Safari
                        await element.webkitRequestFullscreen();
                    } else if (element.mozRequestFullScreen) { // Firefox
                        await element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) { // IE11
                        await element.msRequestFullscreen();
                    }
                    setIsFullscreen(true);
                }
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) { // Safari
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) { // Firefox
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) { // IE11
                    await document.msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    // Listen for fullscreen changes (e.g., user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const handleSeek = (e) => {
        const val = parseFloat(e.target.value);
        const newTime = isNaN(val) ? 0 : val;

        setCurrentTime(newTime);

        if (audioRef.current) {
            // Check if audio is ready
            if (Number.isFinite(audioRef.current.duration)) {
                audioRef.current.currentTime = newTime;
            }
        } else {
            // Update timer reference
            startTimeRef.current = Date.now() - (newTime * 1000);
        }
    };

    // Safe style access
    const getStyle = (key, fallback) => styles && styles[key] ? styles[key] : fallback;

    // For native fullscreen API, simplified styles
    const fullscreenContainerStyle = {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: isFullscreen ? 'black' : 'transparent',
        display: isFullscreen ? 'flex' : 'block',
        alignItems: isFullscreen ? 'center' : 'normal',
        justifyContent: isFullscreen ? 'center' : 'normal'
    };

    const cinematicInnerStyle = isFullscreen ? {
        width: isPortrait ? '100vh' : '100%',
        height: isPortrait ? '100vw' : '100%',
        maxWidth: '177.78vh', // 16:9 ratio (100vh / 9 * 16)
        maxHeight: '56.25vw', // 16:9 ratio (100vw / 16 * 9)
        transform: isPortrait ? 'rotate(90deg)' : 'none',
        transformOrigin: 'center',
        position: 'relative'
    } : { height: '100%', width: '100%', position: 'relative' };

    return (
        <>
            {/* Fullscreen Close Button */}
            {isFullscreen && (
                <button
                    onClick={toggleFullscreen}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 10000,
                        background: 'rgba(0,0,0,0.8)',
                        border: '2px solid white',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    ✕ Close
                </button>
            )}

            <div
                ref={fullscreenContainerRef}
                style={{
                    ...fullscreenContainerStyle,
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}
            >
                <div style={{
                    ...cinematicInnerStyle,
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}>
                    <div className="preview-container" style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: getStyle('backgroundColor', '#121212'),
                        color: getStyle('color', '#ffffff'),
                        fontFamily: getStyle('fontFamily', 'Inter, sans-serif'),
                        borderRadius: isFullscreen ? '0' : '12px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onError={(e) => {
                                    console.error("Audio load error", e);
                                    setIsPlaying(false);
                                }}
                            />
                        )}

                        <LyricsDisplay
                            lyrics={lyrics}
                            currentTime={currentTime}
                            styles={styles}
                            activeLineIndex={activeLineIndex}
                        />

                        <PlayerControls
                            isPlaying={isPlaying}
                            togglePlay={togglePlay}
                            currentTime={currentTime}
                            maxTime={maxTime}
                            handleSeek={handleSeek}
                            styles={styles}
                            backgroundImageUrl={backgroundImageUrl}
                            projectName={projectName}
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default Preview;