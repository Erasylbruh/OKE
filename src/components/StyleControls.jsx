import { useLanguage } from '../context/LanguageContext';

const StyleControls = ({ styles, onUpdate }) => {
    const { t } = useLanguage();

    const handleChange = (field, value) => {
        onUpdate(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Color Controls */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-neutral-400 text-xs uppercase font-bold mb-2">Text Color</label>
                    <div className="flex items-center gap-2 bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                        <input
                            type="color"
                            value={styles.color}
                            onChange={(e) => handleChange('color', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-xs font-mono">{styles.color}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-neutral-400 text-xs uppercase font-bold mb-2">Highlight Color</label>
                    <div className="flex items-center gap-2 bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                        <input
                            type="color"
                            value={styles.fillColor}
                            onChange={(e) => handleChange('fillColor', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-xs font-mono">{styles.fillColor}</span>
                    </div>
                </div>
            </div>

            {/* Font Size */}
            <div>
                <label className="block text-neutral-400 text-xs uppercase font-bold mb-2">
                    Size: {styles.fontSize}px / Active: {styles.activeFontSize}px
                </label>
                <div className="space-y-4">
                    <div>
                        <input
                            type="range"
                            min="12"
                            max="60"
                            value={styles.fontSize}
                            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                    <div>
                        <input
                            type="range"
                            min="16"
                            max="80"
                            value={styles.activeFontSize}
                            onChange={(e) => handleChange('activeFontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                </div>
            </div>

            {/* Font Family */}
            <div>
                <label className="block text-neutral-400 text-xs uppercase font-bold mb-2">Font Family</label>
                <select
                    value={styles.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:outline-none focus:border-green-500"
                >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Playfair Display', serif">Playfair Display</option>
                    <option value="'Courier New', monospace">Courier New</option>
                </select>
            </div>

            {/* Custom Font URL */}
            <div>
                <label className="block text-neutral-400 text-xs uppercase font-bold mb-2">Custom Font URL (Google Fonts)</label>
                <input
                    type="text"
                    value={styles.fontUrl || ''}
                    onChange={(e) => handleChange('fontUrl', e.target.value)}
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    className="w-full bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700 focus:outline-none focus:border-green-500 text-sm"
                />
            </div>
        </div>
    );
};

export default StyleControls;
