"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReference = exports.saveReference = exports.getSavedReferences = exports.searchPatents = void 0;
const patentSearchService_1 = require("../services/patentSearchService");
const patentReferenceService_1 = require("../services/patentReferenceService");
/**
 * Searches patents using the query string in the request.
 */
const searchPatents = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || !query.trim()) {
            res.status(400).json({ message: 'Search query parameter "q" is required.' });
            return;
        }
        const results = await patentSearchService_1.PatentSearchService.search(query);
        res.status(200).json({ success: true, results });
    }
    catch (error) {
        console.error('searchPatents Error:', error);
        const status = error.message?.includes('timed out') || error.message?.includes('rate limit') ? 502 : 400;
        res.status(status).json({ message: error.message || 'Failed to search patents.' });
    }
};
exports.searchPatents = searchPatents;
/**
 * Retrieves saved references for a specific project.
 */
const getSavedReferences = async (req, res) => {
    try {
        const projectId = req.params.id;
        const references = await patentReferenceService_1.PatentReferenceService.listReferences(projectId);
        res.status(200).json({ success: true, references });
    }
    catch (error) {
        console.error('getSavedReferences Error:', error);
        res.status(500).json({ message: error.message || 'Failed to retrieve saved references.' });
    }
};
exports.getSavedReferences = getSavedReferences;
/**
 * Saves a patent reference to a project.
 */
const saveReference = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { patentNumber, title, abstract, claims, url, inventors, assignee, publishDate, source } = req.body;
        if (!patentNumber || !title) {
            res.status(400).json({ message: 'Patent number and title are required.' });
            return;
        }
        const saved = await patentReferenceService_1.PatentReferenceService.saveReference(projectId, {
            patentNumber,
            title,
            abstract,
            claims,
            url,
            inventors,
            assignee,
            publishDate,
            source
        });
        res.status(201).json({ success: true, reference: saved });
    }
    catch (error) {
        console.error('saveReference Error:', error);
        res.status(400).json({ message: error.message || 'Failed to save patent reference.' });
    }
};
exports.saveReference = saveReference;
/**
 * Deletes a saved reference from a project.
 */
const deleteReference = async (req, res) => {
    try {
        const projectId = req.params.id;
        const referenceId = req.params.refId;
        if (!referenceId) {
            res.status(400).json({ message: 'Reference ID is required.' });
            return;
        }
        await patentReferenceService_1.PatentReferenceService.deleteReference(projectId, referenceId);
        res.status(200).json({ success: true, message: 'Patent reference deleted successfully.' });
    }
    catch (error) {
        console.error('deleteReference Error:', error);
        res.status(400).json({ message: error.message || 'Failed to delete patent reference.' });
    }
};
exports.deleteReference = deleteReference;
