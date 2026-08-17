"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFormPdf = exports.submitForm = exports.saveForm = exports.getFormById = exports.getProjectForms = void 0;
const formService_1 = require("../services/formService");
const pdfService_1 = require("../services/pdfService");
const getProjectForms = async (req, res) => {
    try {
        const projectId = req.params.id;
        const forms = await formService_1.FormService.getProjectForms(projectId);
        res.status(200).json({ success: true, forms });
    }
    catch (error) {
        console.error('getProjectForms Error:', error);
        res.status(500).json({ message: error.message || 'Failed to retrieve project forms.' });
    }
};
exports.getProjectForms = getProjectForms;
const getFormById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const formId = req.params.formId;
        const form = await formService_1.FormService.getFormById(projectId, formId);
        res.status(200).json({ success: true, form });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Form not found.' });
    }
};
exports.getFormById = getFormById;
const saveForm = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { formType, formData } = req.body;
        if (!formType) {
            res.status(400).json({ message: 'Form type is required.' });
            return;
        }
        const saved = await formService_1.FormService.saveForm(projectId, formType, formData, req.user?.userId);
        res.status(200).json({ success: true, form: saved });
    }
    catch (error) {
        console.error('saveForm Error:', error);
        res.status(400).json({ message: error.message || 'Failed to save form data.' });
    }
};
exports.saveForm = saveForm;
const submitForm = async (req, res) => {
    try {
        const projectId = req.params.id;
        const formId = req.params.formId;
        const submitted = await formService_1.FormService.submitForm(projectId, formId, req.user.userId);
        res.status(200).json({ success: true, message: 'Form submitted successfully.', form: submitted });
    }
    catch (error) {
        console.error('submitForm Error:', error);
        res.status(400).json({ message: error.message || 'Failed to submit form.' });
    }
};
exports.submitForm = submitForm;
const generateFormPdf = async (req, res) => {
    try {
        const projectId = req.params.id;
        const formType = (req.params.formType || req.body.formType || 'Form 1');
        const document = await pdfService_1.PdfService.generateFormPdf(projectId, formType, req.user?.userId);
        res.status(201).json({ success: true, message: 'PDF generated successfully.', document });
    }
    catch (error) {
        console.error('generateFormPdf Error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate form PDF.' });
    }
};
exports.generateFormPdf = generateFormPdf;
