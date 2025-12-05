import API_URL from '../config';

const request = async (endpoint, method = 'GET', body = null, customHeaders = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...customHeaders };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        if (body instanceof FormData) {
            config.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Очищаем данные при протухшем токене
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth';
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API Error: ${response.status}`);
        }

        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
};

export default {
    get: (url) => request(url, 'GET'),
    post: (url, body) => request(url, 'POST', body),
    put: (url, body) => request(url, 'PUT', body),
    patch: (url, body) => request(url, 'PATCH', body),
    delete: (url) => request(url, 'DELETE'),
    upload: (url, formData) => request(url, 'POST', formData),
};