import React, { useState, useEffect, useMemo } from 'react';

function StyleControls({ styles, onUpdate }) {
    const [fonts, setFonts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubset, setSelectedSubset] = useState('latin'); // Default to latin/english
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFonts = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/fonts');
                if (res.ok) {
                    const data = await res.json();
                    setFonts(data);
                }
            } catch (err) {
                console.error('Error fetching fonts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFonts();
    }, []);

    const handleChange = (field, value) => {
        onUpdate((prev) => ({ ...prev, [field]: value }));
    };

    const handleFontSelect = (e) => {
        const family = e.target.value;
        if (!family) return;

        handleChange('fontFamily', family);
        // Construct Google Fonts URL
        // Replace spaces with +
        const formattedFamily = family.replace(/ /g, '+');
        const url = `https://fonts.googleapis.com/css2?family=${formattedFamily}&display=swap`;
        handleChange('fontUrl', url);
    };

    const filteredFonts = useMemo(() => {
        return fonts.filter(font => {
            const matchesSearch = font.family.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
            const matchesSubset = selectedSubset === 'all' || (font.subsets && font.subsets.includes(selectedSubset));
            return matchesSearch && matchesCategory && matchesSubset;
        });
    }, [fonts, searchTerm, selectedCategory, selectedSubset]);

    const categories = ['all', 'serif', 'sans-serif', 'display', 'handwriting', 'monospace'];
    // Common subsets, could be derived from data but hardcoding common ones is safer for UI
    const subsets = ['all', 'latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'];

    return (
        <div className="style-controls" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Top Section: Size Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label>
                    Font Size (px)
                    <input
                        type="number"
                        value={styles.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                    />
                </label>
                <label>
                    Active Size (px)
                    <input
                        type="number"
                        value={styles.activeFontSize}
                        onChange={(e) => handleChange('activeFontSize', parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                    />
                </label>
            </div>

            {/* Font Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label>
                    Category
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                    </select>
                </label>
                <label>
                    Language (Subset)
                    <select
                        value={selectedSubset}
                        onChange={(e) => setSelectedSubset(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                    >
                        {subsets.map(sub => <option key={sub} value={sub}>{sub === 'all' ? 'All Languages' : sub}</option>)}
                    </select>
                </label>
            </div>

            {/* Font Search & Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Search fonts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                />

                <label>
                    Select Font ({filteredFonts.length} available)
                    <select
                        value={styles.fontFamily}
                        onChange={handleFontSelect}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', backgroundColor: '#282828', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                    >
                        <option value="Inter, sans-serif">Default (Inter)</option>
                        {loading ? (
                            <option disabled>Loading fonts...</option>
                        ) : (
                            filteredFonts.slice(0, 200).map((font) => (
                                <option key={font.family} value={font.family}>
                                    {font.family}
                                </option>
                            ))
                        )}
                    </select>
                </label>
            </div>

            {/* Colors Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <label>
                    Text
                    <input
                        type="color"
                        value={styles.color}
                        onChange={(e) => handleChange('color', e.target.value)}
                        style={{ width: '100%', height: '35px', marginTop: '4px', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                </label>
                <label>
                    Fill
                    <input
                        type="color"
                        value={styles.fillColor}
                        onChange={(e) => handleChange('fillColor', e.target.value)}
                        style={{ width: '100%', height: '35px', marginTop: '4px', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                </label>
                <label>
                    Bg
                    <input
                        type="color"
                        value={styles.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        style={{ width: '100%', height: '35px', marginTop: '4px', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                </label>
            </div>
        </div>
    );
}

export default StyleControls;
