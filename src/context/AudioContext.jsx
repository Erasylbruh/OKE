import { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext(null);

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
    const [currentTrackId, setCurrentTrackId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());

    // Cleanup on unmount
    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    const playTrack = (trackUrl, trackId) => {
        const audio = audioRef.current;

        if (currentTrackId === trackId) {
            // Toggle play/pause for same track
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play();
                setIsPlaying(true);
            }
        } else {
            // New track
            audio.src = trackUrl;
            audio.play();
            setCurrentTrackId(trackId);
            setIsPlaying(true);
        }
    };

    // Handle audio ending
    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, []);

    return (
        <AudioContext.Provider value={{
            currentTrackId,
            isPlaying,
            playTrack,
            pauseTrack: () => {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }}>
            {children}
        </AudioContext.Provider>
    );
};
