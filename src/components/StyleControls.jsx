import React, { useState, useEffect, useMemo } from 'react';
import API_URL from '../config';

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
                const res = await fetch(`${API_URL}/api/fonts`);
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

    const inputStyle = {
        width: '100%',
        marginTop: '4px',
        padding: '0 12px', // Horizontal padding
        height: '40px', // Requested h40
        backgroundColor: '#282828', // Reverted to dark
        color: 'white',
        border: '1px solid #333',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    return (
        <div className="style-controls" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Top Section: Size Controls */}
            <div className="style-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}> {/* Requested gap 10 */}
                <label>
                    Font Size (px)
                    <input
                        type="number"
                        value={styles.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        style={inputStyle}
                    />
                </label>
                <label>
                    Active Size (px)
                    <input
                        type="number"
                        value={styles.activeFontSize}
                        onChange={(e) => handleChange('activeFontSize', parseInt(e.target.value))}
                        style={inputStyle}
                    />
                </label>
            </div>

            {/* Font Filters */}
            <div className="style-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}> {/* Requested gap 10 */}
                <label>
                    Category
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={inputStyle}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                    </select>
                </label>
                <label>
                    Language (Subset)
                    <select
                        value={selectedSubset}
                        onChange={(e) => setSelectedSubset(e.target.value)}
                        style={inputStyle}
                    >
                        {subsets.map(sub => <option key={sub} value={sub}>{sub === 'all' ? 'All Languages' : sub}</option>)}
                    </select>
                </label>
            </div>

            {/* Font Search & Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>
                    Select Font ({filteredFonts.length} available)
                    <select
                        value={styles.fontFamily}
                        onChange={handleFontSelect}
                        style={inputStyle}
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

            {/* Static Header Text Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>
                    Header Text
                    <input
                        type="text"
                        value={styles.headerText || ''}
                        onChange={(e) => handleChange('headerText', e.target.value)}
                        placeholder="Enter header text..."
                        style={inputStyle}
                    />
                </label>
            </div>

            {/* Colors Section - Bar Layout */}
            <div style={{ display: 'flex', gap: '0', marginTop: '10px', borderRadius: '4px', overflow: 'hidden', height: '40px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-20px', left: '0', fontSize: '0.8em' }}>Text</span>
                    <input
                        type="color"
                        value={styles.color}
                        onChange={(e) => handleChange('color', e.target.value)}
                        style={{ width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-20px', left: '0', fontSize: '0.8em' }}>Fill</span>
                    <input
                        type="color"
                        value={styles.fillColor}
                        onChange={(e) => handleChange('fillColor', e.target.value)}
                        style={{ width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-20px', left: '0', fontSize: '0.8em' }}>Bg</span>
                    <input
                        type="color"
                        value={styles.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        style={{ width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default StyleControls;
