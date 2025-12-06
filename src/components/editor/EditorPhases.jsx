import React from 'react';

const EditorPhases = ({ activePhase, setActivePhase }) => {
    const phases = [
        { id: 1, label: 'Lyrics & Audio' },
        { id: 2, label: 'Style' },
        { id: 3, label: 'Publishing' }
    ];

    return (
        <div className="flex border-b border-neutral-800 bg-neutral-900 px-8">
            {phases.map((phase) => (
                <button
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id)}
                    className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activePhase === phase.id
                            ? 'border-green-500 text-green-500'
                            : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                >
                    {phase.id}. {phase.label}
                </button>
            ))}
        </div>
    );
};

export default EditorPhases;
