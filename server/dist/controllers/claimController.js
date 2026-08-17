"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClaimsDocketPdf = exports.syncClaimsToForm2 = exports.deleteClaimChart = exports.getClaimChartByReference = exports.getProjectClaimCharts = exports.generateFtoClaimChart = exports.importClaimProposal = exports.validateClaimProposal = exports.validateClaimAntecedents = exports.generateClaimProposal = exports.unlinkClaimElementComponent = exports.linkClaimElementComponent = exports.deleteClaimElement = exports.updateClaimElement = exports.createClaimElement = exports.getClaimElements = exports.reorderClaims = exports.deleteClaim = exports.updateClaim = exports.createClaim = exports.getClaimById = exports.getProjectClaims = void 0;
const claimService_1 = require("../services/claimService");
const claimAiService_1 = require("../services/claimAiService");
const claimValidationService_1 = require("../services/claimValidationService");
const ftoAnalysisService_1 = require("../services/ftoAnalysisService");
const pdfService_1 = require("../services/pdfService");
const getProjectClaims = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claims = await claimService_1.ClaimService.getProjectClaims(projectId);
        res.status(200).json({ success: true, count: claims.length, claims });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch project claims.' });
    }
};
exports.getProjectClaims = getProjectClaims;
const getClaimById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const claim = await claimService_1.ClaimService.getClaimById(projectId, claimId);
        res.status(200).json({ success: true, claim });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: error.message || 'Failed to fetch claim.' });
    }
};
exports.getClaimById = getClaimById;
const createClaim = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { claimNumber, claimType, dependsOnNumber, preamble, body, status, linkedFigures, orderIndex } = req.body;
        const claim = await claimService_1.ClaimService.createClaim(projectId, userId, {
            claimNumber,
            claimType,
            dependsOnNumber,
            preamble,
            body,
            status,
            linkedFigures,
            orderIndex
        });
        res.status(201).json({ success: true, message: 'Patent claim created successfully.', claim });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create claim.' });
    }
};
exports.createClaim = createClaim;
const updateClaim = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { claimNumber, claimType, dependsOnNumber, preamble, body, status, linkedFigures, orderIndex } = req.body;
        const claim = await claimService_1.ClaimService.updateClaim(projectId, userId, claimId, {
            claimNumber,
            claimType,
            dependsOnNumber,
            preamble,
            body,
            status,
            linkedFigures,
            orderIndex
        });
        res.status(200).json({ success: true, message: 'Patent claim updated successfully.', claim });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to update claim.' });
    }
};
exports.updateClaim = updateClaim;
const deleteClaim = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const result = await claimService_1.ClaimService.deleteClaim(projectId, userId, claimId);
        res.status(200).json({ message: 'Patent claim deleted successfully.', ...result });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to delete claim.' });
    }
};
exports.deleteClaim = deleteClaim;
const reorderClaims = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { orderedClaimIds } = req.body;
        const claims = await claimService_1.ClaimService.reorderClaims(projectId, userId, orderedClaimIds);
        res.status(200).json({ success: true, message: 'Claims reordered successfully.', claims });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to reorder claims.' });
    }
};
exports.reorderClaims = reorderClaims;
// =========================================================================
// CLAIM ELEMENT CONTROLLERS
// =========================================================================
const getClaimElements = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const elements = await claimService_1.ClaimService.getClaimElements(projectId, claimId);
        res.status(200).json({ success: true, count: elements.length, elements });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: error.message || 'Failed to fetch claim elements.' });
    }
};
exports.getClaimElements = getClaimElements;
const createClaimElement = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { elementName, elementText, componentId } = req.body;
        const element = await claimService_1.ClaimService.createClaimElement(projectId, claimId, userId, {
            elementName,
            elementText,
            componentId
        });
        res.status(201).json({ success: true, message: 'Claim element created successfully.', element });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to create claim element.' });
    }
};
exports.createClaimElement = createClaimElement;
const updateClaimElement = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const elementId = req.params.elementId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { elementName, elementText, componentId } = req.body;
        const element = await claimService_1.ClaimService.updateClaimElement(projectId, claimId, elementId, userId, {
            elementName,
            elementText,
            componentId
        });
        res.status(200).json({ success: true, message: 'Claim element updated successfully.', element });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to update claim element.' });
    }
};
exports.updateClaimElement = updateClaimElement;
const deleteClaimElement = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const elementId = req.params.elementId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const result = await claimService_1.ClaimService.deleteClaimElement(projectId, claimId, elementId, userId);
        res.status(200).json({ message: 'Claim element deleted successfully.', ...result });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to delete claim element.' });
    }
};
exports.deleteClaimElement = deleteClaimElement;
const linkClaimElementComponent = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const elementId = req.params.elementId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { componentId } = req.body;
        const element = await claimService_1.ClaimService.linkClaimElementToComponent(projectId, claimId, elementId, userId, componentId);
        res.status(200).json({ success: true, message: 'Claim element linked to drawing component successfully.', element });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to link drawing component.' });
    }
};
exports.linkClaimElementComponent = linkClaimElementComponent;
const unlinkClaimElementComponent = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const elementId = req.params.elementId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const element = await claimService_1.ClaimService.unlinkClaimElementFromComponent(projectId, claimId, elementId, userId);
        res.status(200).json({ success: true, message: 'Drawing component unlinked from claim element successfully.', element });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to unlink drawing component.' });
    }
};
exports.unlinkClaimElementComponent = unlinkClaimElementComponent;
// =========================================================================
// AI GENERATION & VALIDATION CONTROLLERS (STEP 4 & 5)
// =========================================================================
const generateClaimProposal = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { targetJurisdiction } = req.body;
        const proposal = await claimAiService_1.ClaimAiService.generateClaimProposal(projectId, userId, { targetJurisdiction });
        res.status(200).json({ success: true, ...proposal });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to generate AI claim proposal.' });
    }
};
exports.generateClaimProposal = generateClaimProposal;
const validateClaimAntecedents = async (req, res) => {
    try {
        const { preamble, body } = req.body;
        const result = claimValidationService_1.ClaimValidationService.validateAntecedents({ preamble, body });
        res.status(200).json({ success: true, ...result });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to validate antecedents.' });
    }
};
exports.validateClaimAntecedents = validateClaimAntecedents;
const validateClaimProposal = async (req, res) => {
    try {
        const { proposal } = req.body;
        const result = claimValidationService_1.ClaimValidationService.validateProposal(proposal);
        res.status(200).json({ success: true, ...result });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to validate claim proposal.' });
    }
};
exports.validateClaimProposal = validateClaimProposal;
const importClaimProposal = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const { proposal } = req.body;
        const createdClaims = await claimValidationService_1.ClaimValidationService.importProposal(projectId, userId, proposal);
        res.status(201).json({
            success: true,
            message: `Successfully imported ${createdClaims.length} claims into project.`,
            claims: createdClaims
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to import claim proposal.' });
    }
};
exports.importClaimProposal = importClaimProposal;
// =========================================================================
// PRELIMINARY FTO CLAIM CHART CONTROLLERS (STEP 6)
// =========================================================================
const generateFtoClaimChart = async (req, res) => {
    try {
        const projectId = req.params.id;
        const claimId = req.params.claimId;
        const referenceId = req.params.referenceId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const chart = await ftoAnalysisService_1.FtoAnalysisService.generateClaimChart(projectId, claimId, referenceId, userId);
        res.status(200).json({ success: true, message: 'Preliminary FTO claim chart generated successfully.', chart });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to generate preliminary FTO claim chart.' });
    }
};
exports.generateFtoClaimChart = generateFtoClaimChart;
const getProjectClaimCharts = async (req, res) => {
    try {
        const projectId = req.params.id;
        const charts = await ftoAnalysisService_1.FtoAnalysisService.getProjectClaimCharts(projectId);
        res.status(200).json({ success: true, count: charts.length, charts });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch claim charts.' });
    }
};
exports.getProjectClaimCharts = getProjectClaimCharts;
const getClaimChartByReference = async (req, res) => {
    try {
        const projectId = req.params.id;
        const referenceId = req.params.referenceId;
        const chart = await ftoAnalysisService_1.FtoAnalysisService.getClaimChartByReference(projectId, referenceId);
        if (!chart) {
            res.status(404).json({ message: 'No claim chart found for this reference.' });
            return;
        }
        res.status(200).json({ success: true, chart });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch claim chart.' });
    }
};
exports.getClaimChartByReference = getClaimChartByReference;
const deleteClaimChart = async (req, res) => {
    try {
        const projectId = req.params.id;
        const chartId = req.params.chartId;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const result = await ftoAnalysisService_1.FtoAnalysisService.deleteClaimChart(projectId, chartId, userId);
        res.status(200).json({ message: 'Claim chart deleted successfully.', ...result });
    }
    catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to delete claim chart.' });
    }
};
exports.deleteClaimChart = deleteClaimChart;
// =========================================================================
// FORM 2 SYNC & DOCKET PDF CONTROLLERS (STEP 9 & 10)
// =========================================================================
const syncClaimsToForm2 = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const result = await claimService_1.ClaimService.syncClaimsToForm2(projectId, userId);
        res.status(200).json({
            message: `Synchronized ${result.claimsCount} claims to Form 2 successfully.`,
            ...result
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to sync claims to Form 2.' });
    }
};
exports.syncClaimsToForm2 = syncClaimsToForm2;
const generateClaimsDocketPdf = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        const document = await pdfService_1.PdfService.generateClaimsDocketPdf(projectId, userId);
        res.status(201).json({
            success: true,
            message: 'Claims Docket PDF generated successfully.',
            document
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to generate Claims Docket PDF.' });
    }
};
exports.generateClaimsDocketPdf = generateClaimsDocketPdf;
