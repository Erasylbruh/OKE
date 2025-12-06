import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function AdminLoginModal({ onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user.is_admin) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/admin');
                    onClose();
                } else {
                    setError('Not an admin account');
                }
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (

        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
            <div className="bg-[#1e1e1e] p-8 rounded-xl w-[300px] border border-[#333]">
                <h2 className="text-white mb-5 text-center text-xl font-bold">Admin Access</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="ID"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="p-3 bg-[#333] border-none text-white rounded w-full focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                        autoFocus
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 bg-[#333] border-none text-white rounded w-full focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                    />
                    {error && <p className="text-[#ff4444] text-sm text-center">{error}</p>}
                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 p-2 bg-transparent border border-[#555] text-[#ccc] rounded hover:bg-[#333] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 p-2 bg-[#e91e63] border-none text-white rounded hover:bg-[#d81b60] transition-colors cursor-pointer font-bold"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}

export default AdminLoginModal;
