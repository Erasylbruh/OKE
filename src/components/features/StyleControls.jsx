import React, { useState, useEffect, useMemo } from 'react';
import client from '../../api/client';

function StyleControls({ styles, onUpdate }) {
    const [fonts, setFonts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubset, setSelectedSubset] = useState('latin');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFonts = async () => {
            setLoading(true);
            try {
                const data = await client.get('/api/fonts');
                if (data) setFonts(data);
            } catch (err) {
                console.error(err);
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
    const subsets = ['all', 'latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'];

    return (
        <div className="style-controls">
            <div className="control-group grid-2">
                <label>
                    Font Size (px)
                    <input
                        type="number"
                        className="dark-input"
                        value={styles.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                    />
                </label>
                <label>
                    Active Size (px)
                    <input
                        type="number"
                        className="dark-input"
                        value={styles.activeFontSize}
                        onChange={(e) => handleChange('activeFontSize', parseInt(e.target.value))}
                    />
                </label>
            </div>

            <div className="control-group grid-2">
                <label>
                    Category
                    <select
                        className="dark-input"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </label>
                <label>
                    Language
                    <select
                        className="dark-input"
                        value={selectedSubset}
                        onChange={(e) => setSelectedSubset(e.target.value)}
                    >
                        {subsets.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </label>
            </div>

            <div className="control-group">
                <label>
                    Select Font ({filteredFonts.length})
                    <input
                        type="text"
                        className="dark-input mb-2"
                        placeholder="Search fonts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="dark-input"
                        value={styles.fontFamily}
                        onChange={handleFontSelect}
                    >
                        <option value="Inter, sans-serif">Default (Inter)</option>
                        {loading ? <option disabled>Loading...</option> : 
                            filteredFonts.slice(0, 200).map((font) => (
                                <option key={font.family} value={font.family}>{font.family}</option>
                            ))
                        }
                    </select>
                </label>
            </div>

            <div className="control-group">
                <label>
                    Header Text
                    <input
                        type="text"
                        className="dark-input"
                        value={styles.headerText || ''}
                        onChange={(e) => handleChange('headerText', e.target.value)}
                        placeholder="Enter header text..."
                    />
                </label>
            </div>

            <div className="colors-container">
                {['color', 'fillColor', 'backgroundColor'].map(key => (
                    <div className="color-picker-wrapper" key={key}>
                        <span>{key.replace('Color', '')}</span>
                        <div className="color-input-box">
                            <input
                                type="color"
                                value={styles[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StyleControls;