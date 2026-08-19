"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeedback = exports.updateFeedbackStatus = exports.addFeedbackReply = exports.getFeedbackById = exports.getProjectFeedbacks = exports.createFeedback = void 0;
const feedbackService_1 = require("../services/feedbackService");
const createFeedback = async (req, res) => {
    try {
        const projectId = req.params.id;
        const guideUserId = req.user.userId;
        const { feedbackType, priority, comment, correctionRequested } = req.body;
        const feedback = await feedbackService_1.FeedbackService.createFeedback(projectId, guideUserId, {
            feedbackType,
            priority,
            comment,
            correctionRequested
        });
        res.status(201).json({
            success: true,
            message: 'Guide feedback submitted successfully.',
            feedback
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to submit feedback.' });
    }
};
exports.createFeedback = createFeedback;
const getProjectFeedbacks = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.userId;
        const feedbacks = await feedbackService_1.FeedbackService.getProjectFeedbacks(projectId, userId);
        res.status(200).json({ success: true, feedbacks });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to fetch project feedbacks.' });
    }
};
exports.getProjectFeedbacks = getProjectFeedbacks;
const getFeedbackById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const feedbackId = req.params.feedbackId;
        const userId = req.user.userId;
        const feedback = await feedbackService_1.FeedbackService.getFeedbackById(projectId, feedbackId, userId);
        res.status(200).json({ success: true, feedback });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to fetch feedback.' });
    }
};
exports.getFeedbackById = getFeedbackById;
const addFeedbackReply = async (req, res) => {
    try {
        const projectId = req.params.id;
        const feedbackId = req.params.feedbackId;
        const userId = req.user.userId;
        const { message } = req.body;
        const reply = await feedbackService_1.FeedbackService.addReply(projectId, feedbackId, userId, message);
        res.status(201).json({
            success: true,
            message: 'Reply posted successfully.',
            reply
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to post reply.' });
    }
};
exports.addFeedbackReply = addFeedbackReply;
const updateFeedbackStatus = async (req, res) => {
    try {
        const projectId = req.params.id;
        const feedbackId = req.params.feedbackId;
        const userId = req.user.userId;
        const { action, note } = req.body;
        const updatedFeedback = await feedbackService_1.FeedbackService.updateFeedbackStatus(projectId, feedbackId, userId, {
            action,
            note
        });
        res.status(200).json({
            success: true,
            message: `Feedback status updated (${action}).`,
            feedback: updatedFeedback
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update feedback status.' });
    }
};
exports.updateFeedbackStatus = updateFeedbackStatus;
const deleteFeedback = async (req, res) => {
    try {
        const projectId = req.params.id;
        const feedbackId = req.params.feedbackId;
        const userId = req.user.userId;
        await feedbackService_1.FeedbackService.deleteFeedback(projectId, feedbackId, userId);
        res.status(200).json({ success: true, message: 'Feedback deleted successfully.' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to delete feedback.' });
    }
};
exports.deleteFeedback = deleteFeedback;
