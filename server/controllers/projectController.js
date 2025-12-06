import * as projectService from '../services/projectService.js';

export const getProject = async (req, res, next) => {
    try {
        const currentUserId = req.user ? req.user.id : null;
        const isAdmin = req.user ? req.user.is_admin : false;
        const result = await projectService.getProject(req.params.id, currentUserId, isAdmin);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getMyProjects = async (req, res, next) => {
    try {
        const result = await projectService.getUserProjects(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getPublicProjects = async (req, res, next) => {
    try {
        const result = await projectService.getPublicProjects();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getFollowingProjects = async (req, res, next) => {
    try {
        const result = await projectService.getFollowingProjects(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const createProject = async (req, res, next) => {
    try {
        const result = await projectService.createProject(req.user.id, req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const updateProject = async (req, res, next) => {
    try {
        const result = await projectService.updateProject(req.params.id, req.user.id, req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteProject = async (req, res, next) => {
    try {
        const result = await projectService.deleteProject(req.params.id, req.user.id, req.user.is_admin);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const updateVisibility = async (req, res, next) => {
    try {
        const result = await projectService.updateVisibility(req.params.id, req.user.id, req.user.is_admin, req.body.is_public);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const uploadAudio = async (req, res, next) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    try {
        const result = await projectService.uploadAudio(req.params.id, req.user.id, req.file.path);
        res.json(result);
    } catch (err) {
        // If upload happened but logic failed, we might want to return what happened
        // But for now sticking to standard error handling
        next(err);
    }
};

export const deleteAudio = async (req, res, next) => {
    try {
        const result = await projectService.deleteAudio(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const uploadPreview = async (req, res, next) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    try {
        const result = await projectService.uploadPreview(req.params.id, req.user.id, req.file.path, req.body.slot);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const deletePreview = async (req, res, next) => {
    try {
        const result = await projectService.deletePreview(req.params.id, req.user.id, req.params.slot);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const setMainPreview = async (req, res, next) => {
    try {
        const result = await projectService.setMainPreview(req.params.id, req.user.id, req.body.slot);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
