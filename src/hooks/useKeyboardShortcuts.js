import { useEffect, useCallback } from 'react';

/**
 * Custom hook for managing keyboard shortcuts
 * Handles both Mac (Cmd) and Windows (Ctrl) key combinations
 */

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const useKeyboardShortcuts = (shortcuts) => {
    const handleKeyDown = useCallback((event) => {
        // Ignore shortcuts if user is typing in an input or textarea
        const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);

        shortcuts.forEach(({ key, ctrl, alt, shift, meta, callback, allowInInput = false }) => {
            // Skip if in input field and not allowed
            if (isInputField && !allowInInput) return;

            // Check modifier keys
            const ctrlKey = ctrl && (event.ctrlKey || event.metaKey);
            const altKey = alt && event.altKey;
            const shiftKey = shift && event.shiftKey;
            const metaKey = meta && event.metaKey;

            // Check if the key matches
            const keyMatches = event.key.toLowerCase() === key.toLowerCase() ||
                event.code === key;

            // Determine if all required conditions are met
            const modifiersMatch = (
                (ctrl ? ctrlKey : true) &&
                (alt ? altKey : !event.altKey) &&
                (shift ? shiftKey : !event.shiftKey) &&
                (meta ? metaKey : true)
            );

            if (keyMatches && modifiersMatch) {
                event.preventDefault();
                callback(event);
            }
        });
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

/**
 * Get modifier key label based on platform
 */
export const getModifierKey = () => isMac ? '⌘' : 'Ctrl';

/**
 * Format shortcut for display
 * Example: formatShortcut('s', true) => 'Ctrl+S' or '⌘S'
 */
export const formatShortcut = (key, ctrl = false, alt = false, shift = false) => {
    const parts = [];
    if (ctrl) parts.push(getModifierKey());
    if (alt) parts.push(isMac ? '⌥' : 'Alt');
    if (shift) parts.push(isMac ? '⇧' : 'Shift');
    parts.push(key.toUpperCase());
    return parts.join(isMac ? '' : '+');
};

export default useKeyboardShortcuts;
