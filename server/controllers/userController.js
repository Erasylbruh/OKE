import * as userService from '../services/userService.js';

export const getSettings = async (req, res, next) => {
    try {
        const settings = await userService.getUserSettings(req.user.id);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};

export const updateSettings = async (req, res, next) => {
    try {
        const result = await userService.updateUserSettings(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const avatar_url = req.file ? req.file.path : req.body.avatar_url;
        const result = await userService.updateUserProfile(req.user.id, { ...req.body, avatar_url });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id, req.user.id, req.user.is_admin);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getLikes = async (req, res, next) => {
    try {
        const result = await userService.getUserLikes(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        // Need to extract currentUserId if authenticated, but route might be public
        // Controller will check req.user if available (depends on middleware usage)
        const currentUserId = req.user ? req.user.id : null;
        const result = await userService.getPublicProfile(req.params.username, currentUserId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const follow = async (req, res, next) => {
    try {
        const result = await userService.followUser(req.user.id, req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const unfollow = async (req, res, next) => {
    try {
        const result = await userService.unfollowUser(req.user.id, req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getFollowing = async (req, res, next) => {
    try {
        const result = await userService.getFollowing(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
