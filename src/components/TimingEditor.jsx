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

export default TimingEditor;
