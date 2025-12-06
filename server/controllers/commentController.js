import * as commentService from '../services/commentService.js';

export const getComments = async (req, res, next) => {
    try {
        const currentUserId = req.user ? req.user.id : null;
        const result = await commentService.getProjectComments(req.params.id, currentUserId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const addComment = async (req, res, next) => {
    try {
        const result = await commentService.addComment(req.params.id, req.user.id, req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const result = await commentService.deleteComment(req.params.id, req.user.id, req.user.is_admin);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const likeComment = async (req, res, next) => {
    try {
        const result = await commentService.toggleLike(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const unlikeComment = async (req, res, next) => {
    try {
        const result = await commentService.removeLike(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const pinComment = async (req, res, next) => {
    try {
        const result = await commentService.setPinStatus(req.params.id, req.user.id, req.body.is_pinned);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
