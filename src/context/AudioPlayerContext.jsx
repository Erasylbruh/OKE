import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null); // { id, url }
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());

    const playTrack = (trackId, url) => {
        const audio = audioRef.current;

        if (currentTrack?.id === trackId) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play().catch(e => console.error("Playback error:", e));
                setIsPlaying(true);
            }
        } else {
            audio.pause();
            audio.src = url;
            audio.load();
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setCurrentTrack({ id: trackId, url });
                        setIsPlaying(true);
                    })
                    .catch(error => {
                        console.error("Playback failed:", error);
                        setIsPlaying(false);
                    });
            }
        }
    };

    const stop = () => {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
    };

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setIsPlaying(false);
        const handleError = () => setIsPlaying(false);

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.pause();
        };
    }, []);

    return (
        <AudioPlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, stop }}>
            {children}
        </AudioPlayerContext.Provider>
    );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);