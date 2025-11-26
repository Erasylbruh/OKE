import React, { useState, useMemo } from 'react';

// Mock Font Data (since we don't have the API key yet)
const GOOGLE_FONTS = [
    { family: 'Inter', category: 'sans-serif', subsets: ['latin', 'cyrillic', 'greek'] },
    { family: 'Roboto', category: 'sans-serif', subsets: ['latin', 'cyrillic', 'greek', 'vietnamese'] },
    { family: 'Open Sans', category: 'sans-serif', subsets: ['latin', 'cyrillic', 'greek', 'vietnamese', 'hebrew'] },
    { family: 'Lato', category: 'sans-serif', subsets: ['latin'] },
    { family: 'Montserrat', category: 'sans-serif', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'Oswald', category: 'sans-serif', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'Merriweather', category: 'serif', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'Playfair Display', category: 'serif', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'Lora', category: 'serif', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'PT Serif', category: 'serif', subsets: ['latin', 'cyrillic'] },
    { family: 'Dancing Script', category: 'handwriting', subsets: ['latin', 'vietnamese'] },
    { family: 'Pacifico', category: 'handwriting', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'Caveat', category: 'handwriting', subsets: ['latin', 'cyrillic'] },
    { family: 'Courier New', category: 'monospace', subsets: ['latin', 'cyrillic'] },
    { family: 'Fira Code', category: 'monospace', subsets: ['latin', 'cyrillic', 'greek'] },
    { family: 'Inconsolata', category: 'monospace', subsets: ['latin', 'vietnamese'] },
    { family: 'Lobster', category: 'display', subsets: ['latin', 'cyrillic', 'vietnamese'] },
    { family: 'Bebas Neue', category: 'display', subsets: ['latin'] },
    { family: 'Comfortaa', category: 'display', subsets: ['latin', 'cyrillic', 'greek', 'vietnamese'] }
];

function StyleControls({ styles, onUpdate }) {
    const [category, setCategory] = useState('All');
    const [fontSearch, setFontSearch] = useState('');

    const handleChange = (field, value) => {
        onUpdate((prev) => ({ ...prev, [field]: value }));
    };

    const filteredFonts = useMemo(() => {
        return GOOGLE_FONTS.filter(font => {
            const matchesCategory = category === 'All' || font.category === category.toLowerCase();
            const matchesSearch = font.family.toLowerCase().includes(fontSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [category, fontSearch]);

    return (
        <div className="style-controls" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Font Size Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ flex: 1 }}>
                    Font Size (px)
                    <input
                        type="number"
                        value={styles.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '4px' }}
                    />
                </label>
                <label style={{ flex: 1 }}>
                    Active Size (px)
                    <input
                        type="number"
                        value={styles.activeFontSize}
                        onChange={(e) => handleChange('activeFontSize', parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '4px' }}
                    />
                </label>
            </div>

            {/* Font Filtering */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1 }}>
                    Category
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                    >
                        <option value="All">All</option>
                        <option value="Serif">Serif</option>
                        <option value="Sans-serif">Sans Serif</option>
                        <option value="Display">Display</option>
                        <option value="Handwriting">Handwriting</option>
                        <option value="Monospace">Monospace</option>
                    </select>
                </label>
            </div>

            {/* Font Selection */}
            <label>
                <input
                    type="text"
                    placeholder="Search fonts..."
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    style={{ width: '100%', marginBottom: '5px', padding: '8px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '4px', color: 'white' }}
                />
                Select Font ({filteredFonts.length} available)
                <select
                    value={styles.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                >
                    {filteredFonts.map(font => (
                        <option key={font.family} value={`${font.family}, ${font.category}`}>
                            {font.family}
                        </option>
                    ))}
                    {filteredFonts.length === 0 && <option disabled>No fonts found</option>}
                </select>
            </label>

            {/* Color Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ flex: 1 }}>
                    Text Color
                    <input
                        type="color"
                        value={styles.color}
                        onChange={(e) => handleChange('color', e.target.value)}
                        style={{ width: '100%', height: '40px', marginTop: '4px', padding: 0, border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
                    />
                </label>
                <label style={{ flex: 1 }}>
                    Fill Color
                    <input
                        type="color"
                        value={styles.fillColor}
                        onChange={(e) => handleChange('fillColor', e.target.value)}
                        style={{ width: '100%', height: '40px', marginTop: '4px', padding: 0, border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
                    />
                </label>
                <label style={{ flex: 1 }}>
                    Background
                    <input
                        type="color"
                        value={styles.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        style={{ width: '100%', height: '40px', marginTop: '4px', padding: 0, border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
                    />
                </label>
            </div>
        </div>
    );
}

export default StyleControls;
