
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:3000/api';
let token;
let projectId;
let userId;

async function login() {
    console.log('Logging in...');
    // Assuming admin user exists from previous steps
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '060101551275', password: '6973990306' })
    });

    // If login fails, create a test user
    if (!res.ok) {
        console.log('Login failed, creating test user...');
        await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testuser123', password: 'TestUser123!' })
        });
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testuser123', password: 'TestUser123!' })
        });
        const data = await loginRes.json();
        token = data.token;
        userId = data.user.id;
    } else {
        const data = await res.json();
        token = data.token;
        userId = data.user.id;
    }
    console.log('Logged in as user ID:', userId);
}

async function createProject() {
    console.log('Creating test project...');
    const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Test Project', data: {}, is_public: true })
    });
    const data = await res.json();
    projectId = data.id;
    console.log('Created project ID:', projectId);
}

async function testLikes() {
    console.log('Testing Like...');
    const likeRes = await fetch(`${BASE_URL}/projects/${projectId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const text = await likeRes.text();
    try {
        const likeData = JSON.parse(text);
        console.log('Like result:', likeData); // Should be { liked: true }
    } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw e;
    }

    console.log('Checking Like Status...');
    const statusRes = await fetch(`${BASE_URL}/projects/${projectId}/like`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const statusData = await statusRes.json();
    console.log('Status result:', statusData); // Should be { liked: true }

    console.log('Listing Liked Projects...');
    const listRes = await fetch(`${BASE_URL}/users/likes`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log('Liked Projects List:', listData.map(p => p.id)); // Should include projectId

    console.log('Testing Unlike...');
    const unlikeRes = await fetch(`${BASE_URL}/projects/${projectId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const unlikeData = await unlikeRes.json();
    console.log('Unlike result:', unlikeData); // Should be { liked: false }

    console.log('Checking Like Status (After Unlike)...');
    const statusRes2 = await fetch(`${BASE_URL}/projects/${projectId}/like`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const statusData2 = await statusRes2.json();
    console.log('Status result:', statusData2); // Should be { liked: false }
}

async function run() {
    try {
        await login();
        await createProject();
        await testLikes();
        console.log('Verification Complete!');
    } catch (err) {
        console.error('Verification Failed:', err);
    }
}

run();
