

async function testPublicProjects() {
    try {
        const res = await fetch('http://localhost:3000/api/projects/public');
        if (!res.ok) {
            console.error('Failed to fetch:', res.status, res.statusText);
            const text = await res.text();
            console.error('Body:', text);
            return;
        }
        const data = await res.json();
        console.log('Public Projects:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

testPublicProjects();
