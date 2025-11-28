async function test() {
    for (let i = 1; i <= 10; i++) {
        try {
            const res = await fetch(`http://localhost:3000/api/debug/likes?userId=${i}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`User ${i}: Found ${data.count} likes.`);
                if (data.count > 0) {
                    console.log(JSON.stringify(data.projects, null, 2));
                }
            } else {
                console.log(`User ${i}: Error ${res.status} ${res.statusText}`);
            }
        } catch (err) {
            console.log(`User ${i}: Request failed - ${err.message}`);
        }
    }
}

test();
