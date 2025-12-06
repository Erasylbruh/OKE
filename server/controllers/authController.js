import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        await authService.registerUser(username, password);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await authService.loginUser(username, password);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
