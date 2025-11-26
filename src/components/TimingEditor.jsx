import React from 'react';

function TimingEditor({ lyrics, onUpdate }) {
    return (
        <div className="timing-editor">
            {lyrics.map((line, index) => (
                <div key={line.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: '#282828',
                    borderRadius: '4px'
                }}>
                    <span style={{ width: '20px', color: '#b3b3b3' }}>{index + 1}</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{line.text}</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <label style={{ fontSize: '0.8em', color: '#b3b3b3' }}>
                                Start:
                                <input
                                    type="number"
                                    step="0.1"
                                    value={line.start}
                                    onChange={(e) => onUpdate(index, 'start', parseFloat(e.target.value))}
                                    style={{ width: '60px', marginLeft: '5px' }}
                                />
                            </label>
                            <label style={{ fontSize: '0.8em', color: '#b3b3b3' }}>
                                End:
                                <input
                                    type="number"
                                    step="0.1"
                                    value={line.end}
                                    onChange={(e) => onUpdate(index, 'end', parseFloat(e.target.value))}
                                    style={{ width: '60px', marginLeft: '5px' }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TimingEditor;
