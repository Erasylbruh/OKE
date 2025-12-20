import React, { useState } from 'react';
import { FaTimes, FaKeyboard } from 'react-icons/fa';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';
import { useLanguage } from '../context/LanguageContext';

const KeyboardShortcutsHelp = ({ onClose }) => {
    const { t } = useLanguage();

    const shortcuts = [
        {
            category: 'Editor',
            items: [
                { keys: formatShortcut('S', true), description: 'Save project' },
                { keys: 'Space', description: 'Play/Pause preview' },
                { keys: 'Esc', description: 'Close modals' },
                { keys: '?', description: 'Show keyboard shortcuts' }
            ]
        },
        {
            category: 'Navigation',
            items: [
                { keys: formatShortcut('K', true), description: 'Search (coming soon)' },
                { keys: formatShortcut('[', true), description: 'Previous track (coming soon)' },
                { keys: formatShortcut(']', true), description: 'Next track (coming soon)' }
            ]
        }
    ];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '16px',
                    padding: '30px',
                    maxWidth: '600px',
                    width: '100%',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaKeyboard size={24} color="var(--brand-primary)" />
                        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                            Keyboard Shortcuts
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Shortcuts List */}
                {shortcuts.map((category, idx) => (
                    <div key={idx} style={{ marginBottom: idx < shortcuts.length - 1 ? '30px' : 0 }}>
                        <h3 style={{
                            fontSize: '14px',
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                            marginBottom: '15px',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}>
                            {category.category}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {category.items.map((item, itemIdx) => (
                                <div
                                    key={itemIdx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        backgroundColor: 'var(--bg-input)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                        {item.description}
                                    </span>
                                    <kbd style={{
                                        backgroundColor: 'var(--bg-main)',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'var(--brand-primary)',
                                        border: '1px solid var(--border-color)',
                                        fontFamily: 'monospace',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {item.keys}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Footer */}
                <div style={{
                    marginTop: '25px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Press <kbd style={{
                            backgroundColor: 'var(--bg-input)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid var(--border-color)',
                            fontFamily: 'monospace'
                        }}>?</kbd> anytime to see this help
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsHelp;
