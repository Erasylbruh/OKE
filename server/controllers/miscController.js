import dotenv from 'dotenv';
dotenv.config();

let fontsCache = null;

export const getFonts = async (req, res) => {
    if (fontsCache) return res.json(fontsCache);
    try {
        const apiKey = process.env.GOOGLE_FONTS_API_KEY;
        if (!apiKey) return res.status(500).send('Google Fonts API Key not configured');

        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`);
        if (!response.ok) throw new Error('Failed to fetch fonts');

        const data = await response.json();
        fontsCache = data.items.map(font => ({
            family: font.family,
            category: font.category,
            variants: font.variants,
            subsets: font.subsets
        }));
        res.json(fontsCache);
    } catch (err) {
        console.error('Fonts fetch error:', err);
        res.status(500).send(err.message);
    }
};