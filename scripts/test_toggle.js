

async function testToggle() {
    // 1. Login to get token
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '060101551275', password: '6973990306' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('Logged in, Token:', token ? 'Yes' : 'No');

    // 2. Get a project
    const projectsRes = await fetch('http://localhost:3000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const projects = await projectsRes.json();
    if (projects.length === 0) {
        console.log('No projects to test.');
        return;
    }
    const project = projects[0];
    console.log(`Testing Project: ${project.name} (ID: ${project.id}), Current Public: ${project.is_public}`);

    // 3. Toggle Visibility
    const newStatus = !project.is_public;
    console.log(`Attempting to set Public to: ${newStatus}`);

    const toggleRes = await fetch(`http://localhost:3000/api/projects/${project.id}/visibility`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_public: newStatus })
    });

    if (toggleRes.ok) {
        console.log('Toggle Request Successful');
        const updatedRes = await fetch(`http://localhost:3000/api/projects/${project.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedProject = await updatedRes.json();
        console.log(`Verified New Status: ${updatedProject.is_public}`);
    } else {
        console.log('Toggle Request Failed:', await toggleRes.text());
    }
}

testToggle();
