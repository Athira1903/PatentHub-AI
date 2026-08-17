"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const jspdf_1 = require("jspdf");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
const formService_1 = require("./formService");
const filingReadinessService_1 = require("./filingReadinessService");
class PdfService {
    /**
     * Helper to ensure the destination uploads directory exists.
     */
    static ensureUploadDirectory() {
        const uploadDir = path_1.default.join(__dirname, '../../public/uploads/documents');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        return uploadDir;
    }
    /**
     * Generates a server-side PDF for an IPO Form (Form 1, 2, 3, 5, 26) using stored form data.
     */
    static async generateFormPdf(projectId, formType, userId) {
        const normalizedType = formService_1.FormService.normalizeFormType(formType);
        const formNumber = normalizedType.replace('Form ', '');
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: { select: { fullName: true, email: true, institution: true } },
                members: { include: { user: { select: { fullName: true, username: true, email: true } } } }
            }
        });
        if (!project) {
            throw new Error('Project not found for PDF generation.');
        }
        const patentForm = await db_1.prisma.patentForm.findUnique({
            where: {
                projectId_formType: {
                    projectId,
                    formType: normalizedType
                }
            }
        });
        const formData = patentForm?.formData || formService_1.FormService.generateDefaultFormData(project, normalizedType);
        const doc = new jspdf_1.jsPDF();
        // Top Header Banner
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`IPO Patent Form ${formNumber}`, 15, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Intellectual Property India (Government of India / Patent Office Registry)', 15, 25);
        // Section Header
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`FORM ${formNumber} [FILING PREPARATION DRAFT]`, 15, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 55, 195, 55);
        let yPos = 65;
        const writeLine = (label, text, isHeader = false) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
            doc.setFontSize(isHeader ? 10 : 9);
            if (label) {
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, 15, yPos);
                doc.setFont('helvetica', 'normal');
                const splitText = doc.splitTextToSize(String(text || 'N/A'), 135);
                doc.text(splitText, 60, yPos);
                yPos += (splitText.length * 5) + 3;
            }
            else {
                const splitText = doc.splitTextToSize(String(text || ''), 180);
                doc.text(splitText, 15, yPos);
                yPos += (splitText.length * 5) + 3;
            }
        };
        if (normalizedType === 'Form 1') {
            writeLine('', 'APPLICATION FOR GRANT OF PATENT (Section 7, 54 & 135; Rule 5(1))', true);
            yPos += 5;
            writeLine('Applicant Type', formData.applicantType || 'Natural Person');
            writeLine('Applicant Name', formData.applicantName || project.owner.fullName);
            writeLine('Nationality', formData.nationality || 'Indian');
            writeLine('Address (Institution)', formData.address || project.owner.institution || 'N/A');
            writeLine('Email', formData.email || project.owner.email);
            writeLine('Title of Invention', formData.title || project.title);
            writeLine('Category', project.category);
            yPos += 5;
            writeLine('', 'INVENTOR(S) DETAILS:', true);
            writeLine('1. First Inventor', `${project.owner.fullName} (${project.owner.email})`);
            project.members.forEach((m, idx) => {
                writeLine(`${idx + 2}. Co-Inventor`, `${m.user.fullName} (${m.user.email}) - [${m.role}]`);
            });
        }
        else if (normalizedType === 'Form 2') {
            writeLine('', 'PROVISIONAL / COMPLETE SPECIFICATION (Section 10; Rule 13)', true);
            yPos += 5;
            writeLine('1. Title of Invention', formData.title || project.title);
            writeLine('2. Specification Type', formData.specificationType || 'COMPLETE');
            writeLine('3. Preamble to Description', formData.preamble || 'The following specification particularly describes the invention and the manner in which it is to be performed.');
            yPos += 5;
            writeLine('', '4. DESCRIPTION & CLAIMS:', true);
            writeLine('Abstract Description', formData.abstract || project.innovationIdea);
            writeLine('Problem Statement', formData.problemStatement || project.problemStatement);
            writeLine('Proposed Solution', formData.proposedSolution || project.proposedSolution);
            writeLine('Novel Features', formData.novelFeatures || project.novelFeatures || 'N/A');
            writeLine('Claims Count', String(formData.claimsCount || 1));
            writeLine('Claims Scope', formData.claimsText || `1. A system for ${project.title}, comprising: ${project.proposedSolution}`);
        }
        else if (normalizedType === 'Form 3') {
            writeLine('', 'STATEMENT AND UNDERTAKING UNDER SECTION 8 (Rule 12)', true);
            yPos += 5;
            writeLine('Applicant Name', formData.applicantName || project.owner.fullName);
            writeLine('Title of Invention', formData.title || project.title);
            writeLine('Undertaking Details', formData.undertakingText || 'I/We hereby declare that we have not made any application for a patent for the same or substantially the same invention outside India except those declared herein.');
        }
        else if (normalizedType === 'Form 5') {
            writeLine('', 'DECLARATION AS TO INVENTORSHIP (Section 10(6); Rule 4.17(i))', true);
            yPos += 5;
            writeLine('Applicant Name', formData.applicantName || project.owner.fullName);
            writeLine('Title of Invention', formData.title || project.title);
            writeLine('Declaration Text', formData.declarationText || `I/We, the true and first inventors for the patent project titled "${project.title}", hereby confirm our inventorship credentials under IPO rules.`);
        }
        else if (normalizedType === 'Form 26') {
            writeLine('', 'FORM FOR AUTHORISATION OF A PATENT AGENT / ATTORNEY (Section 140; Rule 135)', true);
            yPos += 5;
            writeLine('Principal Authoriser', formData.authoriserName || project.owner.fullName);
            writeLine('Designated Patent Agent', formData.agentName || 'Registered Patent Agent');
            writeLine('Agent Reg. Number', formData.agentRegistrationNumber || 'IN/PA-XXXX');
            writeLine('Scope of Authorization', formData.authorizationScope || `To act, represent, file and prosecute the patent specification titled "${project.title}" on behalf of the applicant.`);
        }
        // Disclaimer footer
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Note: This is a pre-filing preparation draft compiled by PatentHub AI. Not an official filing receipt.', 15, 285);
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const uploadDir = this.ensureUploadDirectory();
        const sanitizedFileName = `Form_${formNumber}_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const docName = `IPO Form ${formNumber} (${project.title})`;
        // Register or update Document record in Prisma
        const existingFormDoc = patentForm?.documentId ? await db_1.prisma.document.findUnique({ where: { id: patentForm.documentId } }) : null;
        const nextVersion = existingFormDoc ? existingFormDoc.version + 1 : 1;
        const document = await db_1.prisma.document.create({
            data: {
                name: docName,
                fileUrl,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                version: nextVersion,
                category: 'PATENT_DRAFT',
                projectId,
                parentDocId: existingFormDoc?.id || null
            }
        });
        // Link document back to PatentForm
        if (patentForm) {
            await db_1.prisma.patentForm.update({
                where: { id: patentForm.id },
                data: { documentId: document.id }
            });
        }
        if (userId) {
            await db_1.prisma.activityLog.create({
                data: {
                    userId,
                    projectId,
                    action: `Generated server-side PDF for IPO Form ${formNumber} (Version ${nextVersion}).`
                }
            });
        }
        return document;
    }
    /**
     * Generates a server-side Filing Readiness Audit PDF report.
     */
    static async generateReadinessReportPdf(projectId, readinessData, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { owner: { select: { fullName: true, email: true, institution: true } } }
        });
        if (!project) {
            throw new Error('Project not found for readiness report generation.');
        }
        const doc = new jspdf_1.jsPDF();
        // Top Header Banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('PatentHub AI', 15, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Filing Readiness & Compliance Audit Report', 15, 30);
        // Title
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Filing Readiness Audit Report', 15, 55);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 60, 195, 60);
        let yPos = 70;
        const writeField = (label, value) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${label}:`, 15, yPos);
            doc.setFont('helvetica', 'normal');
            const splitVal = doc.splitTextToSize(value || 'N/A', 135);
            doc.text(splitVal, 60, yPos);
            yPos += (splitVal.length * 5) + 4;
        };
        writeField('Project Title', project.title);
        writeField('Filing Stage', project.stage);
        writeField('Owner / Inventor', project.owner.fullName);
        writeField('Readiness Status', readinessData.overallReadiness || 'NOT_READY');
        writeField('Compliance Progress', `${readinessData.completedCount} / ${readinessData.totalRequiredCount} items satisfied`);
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('6-POINT COMPLIANCE CHECKLIST:', 15, yPos);
        yPos += 8;
        readinessData.checklist?.forEach((item) => {
            if (yPos > 260) {
                doc.addPage();
                yPos = 20;
            }
            const icon = item.completed ? '[PASS ✓]' : '[FAIL ✗]';
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(item.completed ? 16 : 225, item.completed ? 185 : 29, item.completed ? 129 : 72);
            doc.text(`${icon} ${item.title}`, 15, yPos);
            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const expLines = doc.splitTextToSize(item.explanation || '', 175);
            doc.text(expLines, 20, yPos + 5);
            yPos += (expLines.length * 5) + 8;
        });
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const uploadDir = this.ensureUploadDirectory();
        const sanitizedFileName = `Readiness_Report_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const document = await db_1.prisma.document.create({
            data: {
                name: `Filing Readiness Report (${project.title})`,
                fileUrl,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                version: 1,
                category: 'PATENT_DRAFT',
                projectId
            }
        });
        return document;
    }
    /**
     * Generates a server-side Technical Patent Figure Preparation Sheet PDF.
     */
    static async generatePatentFigureSheetPdf(projectId, figureId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { owner: { select: { fullName: true, email: true, institution: true } } }
        });
        if (!project) {
            throw new Error('Project not found for figure sheet generation.');
        }
        const figure = await db_1.prisma.drawingFigure.findUnique({
            where: { id: figureId },
            include: {
                components: { orderBy: { referenceNumber: 'asc' } },
                sourceDocument: true
            }
        });
        if (!figure || figure.projectId !== projectId) {
            throw new Error('Drawing figure not found or project mismatch.');
        }
        const doc = new jspdf_1.jsPDF();
        // Border Frame for Official Layout
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 190, 277);
        // Sheet Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`PATENT FIGURE PREPARATION SHEET`, 15, 22);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Project: ${project.title} (${project.category})`, 15, 28);
        doc.text(`Applicant: ${project.owner.fullName}`, 15, 33);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 36, 195, 36);
        // Figure Title Banner
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${figure.figureNumber} - ${figure.title}`, 15, 47);
        if (figure.description) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 116, 139);
            const splitDesc = doc.splitTextToSize(figure.description, 180);
            doc.text(splitDesc, 15, 53);
        }
        // Schematic Drawing Bounding Box
        let yPos = figure.description ? 65 : 55;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.rect(15, yPos, 180, 110, 'FD');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(`[2D SCHEMATIC LAYOUT REPRESENTATION]`, 45, yPos + 20);
        // Draw reference tags in bounding box
        let tagY = yPos + 35;
        let tagX = 25;
        figure.components.slice(0, 8).forEach((comp, idx) => {
            doc.setFillColor(79, 70, 229);
            doc.circle(tagX, tagY, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(comp.referenceNumber, tagX - 2.5, tagY + 1.5);
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`─── ${comp.componentName}`, tagX + 6, tagY + 1.5);
            tagY += 16;
            if (tagY > yPos + 95) {
                tagY = yPos + 35;
                tagX += 85;
            }
        });
        // Reference Components Table Legend
        yPos += 120;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('COMPONENT REFERENCE LEGEND TABLE:', 15, yPos);
        yPos += 5;
        doc.setDrawColor(203, 213, 225);
        doc.line(15, yPos, 195, yPos);
        yPos += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Ref #', 15, yPos);
        doc.text('Component Name', 40, yPos);
        doc.text('Description', 100, yPos);
        yPos += 4;
        doc.line(15, yPos, 195, yPos);
        yPos += 5;
        if (figure.components.length === 0) {
            doc.setFont('helvetica', 'italic');
            doc.text('No component reference tags cataloged for this figure.', 15, yPos);
            yPos += 10;
        }
        else {
            figure.components.forEach((comp) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(comp.referenceNumber, 15, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(comp.componentName, 40, yPos);
                const splitCompDesc = doc.splitTextToSize(comp.description || 'N/A', 90);
                doc.text(splitCompDesc, 100, yPos);
                yPos += (splitCompDesc.length * 4) + 3;
            });
        }
        // Disclaimer footer
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text('Note: Patent figure preparation sheet. AI-assisted technical drawing draft. Not an official IPO/USPTO filing document.', 15, 283);
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const uploadDir = this.ensureUploadDirectory();
        const sanitizedFileName = `Figure_${figure.figureNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const document = await db_1.prisma.document.create({
            data: {
                name: `${figure.figureNumber} Sheet - ${figure.title}.pdf`,
                fileUrl,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                version: 1,
                category: 'PATENT_DRAFT',
                projectId
            }
        });
        // Update DrawingFigure generatedDocumentId
        await db_1.prisma.drawingFigure.update({
            where: { id: figure.id },
            data: { generatedDocumentId: document.id }
        });
        if (userId) {
            try {
                await db_1.prisma.activityLog.create({
                    data: {
                        userId,
                        projectId,
                        action: `Generated Technical Figure Sheet PDF for ${figure.figureNumber}.`
                    }
                });
            }
            catch (e) {
                // Ignore activity log creation in mock/test environments
            }
        }
        return document;
    }
    /**
     * Generates a comprehensive multi-page Master Patent Intelligence Report PDF.
     */
    static async generateComprehensivePatentReportPdf(projectId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: { select: { fullName: true, email: true, institution: true, username: true } },
                members: { include: { user: { select: { fullName: true, username: true } } } },
                tasks: { include: { assignedTo: { select: { username: true } } } },
                patentReferences: true,
                patentForms: true,
                projectReviews: { include: { reviewer: { select: { fullName: true, username: true } } } },
                prototypes: { include: { figures: { include: { components: true } } } },
                drawingFigures: { include: { components: true } },
                activityLogs: true,
                documents: true
            }
        });
        if (!project) {
            throw new Error('Project not found for Master Patent Intelligence Report PDF generation.');
        }
        const readiness = await filingReadinessService_1.FilingReadinessService.getFilingReadiness(projectId);
        const doc = new jspdf_1.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        // --- PAGE 1: EXECUTIVE COVER & SUMMARY ---
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('PATENTHUB-AI INTELLIGENCE REPORT', 15, 22);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('CONFIDENTIAL PRE-FILING AUDIT DOSSIER', 15, 30);
        let y = 50;
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(project.title, 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Category: ${project.category}  |  Technical Domain: ${project.technicalDomain || 'General'}  |  Workflow Stage: ${project.stage}`, 15, y);
        y += 6;
        doc.text(`Lead Inventor / Owner: ${project.owner.fullName} (@${project.owner.username})  |  Generated: ${new Date().toLocaleDateString()}`, 15, y);
        y += 12;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y, pageWidth - 15, y);
        y += 10;
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('1. EXECUTIVE INVENTION ABSTRACT', 15, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const splitIdea = doc.splitTextToSize(project.innovationIdea || 'No abstract text registered.', pageWidth - 30);
        doc.text(splitIdea, 15, y);
        y += splitIdea.length * 5 + 6;
        // 6-Point Filing Readiness Status Box
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, pageWidth - 30, 28, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(15, y, pageWidth - 30, 28, 'S');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`FILING READINESS STATUS: ${readiness.overallReadiness}`, 20, y + 8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Completed Compliance Checks: ${readiness.completedCount} of ${readiness.totalRequiredCount}`, 20, y + 15);
        doc.text(`Active Blocking Issues: ${readiness.blockingIssues.length}`, 20, y + 21);
        y += 38;
        // --- SECTION 2: PRIOR ART & PATENT REFERENCES ---
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('2. PRIOR ART & PATENT REGISTRY REFERENCES', 15, y);
        y += 8;
        if (project.patentReferences.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No prior art patent references cataloged in workspace.', 15, y);
            y += 8;
        }
        else {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(241, 245, 249);
            doc.rect(15, y, pageWidth - 30, 6, 'F');
            doc.text('Patent Number', 18, y + 4.5);
            doc.text('Title / Abstract', 60, y + 4.5);
            doc.text('Source', 160, y + 4.5);
            y += 7;
            doc.setFont('helvetica', 'normal');
            for (const ref of project.patentReferences.slice(0, 5)) {
                doc.text(ref.patentNumber, 18, y + 4);
                const titleTrunc = ref.title.length > 55 ? ref.title.substring(0, 55) + '...' : ref.title;
                doc.text(titleTrunc, 60, y + 4);
                doc.text(ref.source, 160, y + 4);
                y += 6;
            }
        }
        // PAGE 2: DRAWINGS, FORMS & REVIEWS
        doc.addPage();
        y = 20;
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('3. TECHNICAL BLUEPRINT FIGURES & COMPONENT LEGEND', 15, y);
        y += 8;
        if (project.drawingFigures.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No technical 2D drawing figures registered.', 15, y);
            y += 8;
        }
        else {
            for (const fig of project.drawingFigures.slice(0, 3)) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text(`${fig.figureNumber}: ${fig.title}`, 15, y);
                y += 5;
                if (fig.components.length > 0) {
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    const tagsStr = fig.components.map((c) => `[${c.referenceNumber}] ${c.componentName}`).join(', ');
                    const splitTags = doc.splitTextToSize(`Annotated Callout Tags: ${tagsStr}`, pageWidth - 30);
                    doc.text(splitTags, 18, y);
                    y += splitTags.length * 4 + 4;
                }
                else {
                    y += 4;
                }
            }
        }
        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('4. INDIAN PATENT OFFICE (IPO) FORMS DOCKET', 15, y);
        y += 8;
        const mandatoryForms = ['Form 1', 'Form 2', 'Form 3', 'Form 5', 'Form 26'];
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, pageWidth - 30, 6, 'F');
        doc.text('Form Identifier', 18, y + 4.5);
        doc.text('Mandatory Purpose', 60, y + 4.5);
        doc.text('Status', 160, y + 4.5);
        y += 7;
        doc.setFont('helvetica', 'normal');
        for (const ft of mandatoryForms) {
            const match = project.patentForms.find((f) => f.formType === ft);
            doc.text(ft, 18, y + 4);
            doc.text(ft === 'Form 1' ? 'Application for Grant of Patent' : ft === 'Form 2' ? 'Provisional / Complete Specification' : 'Statutory Registration Form', 60, y + 4);
            doc.text(match ? match.status : 'NOT_STARTED', 160, y + 4);
            y += 6;
        }
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('5. SUPERVISOR & EXPERT REVIEW LOG', 15, y);
        y += 8;
        if (project.projectReviews.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No formal guide or patent expert review decisions recorded.', 15, y);
            y += 10;
        }
        else {
            for (const rev of project.projectReviews.slice(0, 4)) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(`${rev.reviewType}: ${rev.decision} by @${rev.reviewer.username}`, 15, y);
                if (rev.comments) {
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Comments: ${rev.comments}`, 18, y + 4);
                    y += 4;
                }
                y += 5;
            }
        }
        // Disclaimer footer
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text('Note: Master Patent Intelligence & Pre-Filing Report. AI-assisted technical dossier. Not an official IPO/USPTO legal certificate.', 15, 283);
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const uploadDir = this.ensureUploadDirectory();
        const sanitizedFileName = `Master_Intelligence_Report_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const document = await db_1.prisma.document.create({
            data: {
                name: `Master Patent Intelligence Report - ${project.title}.pdf`,
                fileUrl,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                version: 1,
                category: 'PATENT_DRAFT',
                projectId
            }
        });
        if (userId) {
            try {
                await db_1.prisma.activityLog.create({
                    data: {
                        userId,
                        projectId,
                        action: `Generated Master Patent Intelligence Report PDF.`
                    }
                });
            }
            catch (e) {
                // Ignore activity log creation in mock/test environments
            }
        }
        return document;
    }
    /**
     * Generates a formal Claims Docket PDF with full claims schedule, element breakdown, drawing references, and FTO overview.
     */
    static async generateClaimsDocketPdf(projectId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                patentClaims: {
                    orderBy: [
                        { orderIndex: 'asc' },
                        { claimNumber: 'asc' }
                    ],
                    include: {
                        claimElements: {
                            include: {
                                component: {
                                    include: {
                                        figure: true
                                    }
                                }
                            }
                        }
                    }
                },
                patentReferences: true,
                claimCharts: {
                    include: {
                        reference: true,
                        elements: {
                            include: {
                                claimElement: true
                            }
                        }
                    }
                }
            }
        });
        if (!project) {
            throw new Error('Project not found for Claims Docket PDF export.');
        }
        const doc = new jspdf_1.jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;
        // Header banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 28, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('PATENTHUB-AI | OFFICIAL CLAIMS ENGINEERING DOCKET', 15, 12);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Project: ${project.title} | Domain: ${project.technicalDomain || 'General'} | Exported: ${new Date().toISOString().split('T')[0]}`, 15, 20);
        // Disclaimer box
        y = 35;
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(252, 165, 165);
        doc.rect(15, y, pageWidth - 30, 14, 'FD');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(153, 27, 27);
        doc.text('LEGAL NOTICE & STATUTORY DISCLAIMER', 18, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(185, 28, 28);
        doc.text('AI-generated drafting assistance and preliminary technical analysis. Not legal advice, a patentability determination, or a definitive FTO opinion.', 18, y + 9.5);
        // SECTION 1: Claims Schedule
        y = 56;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('1. PATENT CLAIMS SCHEDULE & TECHNICAL SPECIFICATION', 15, y);
        y += 8;
        if (project.patentClaims.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No structured claims created in this project yet.', 15, y);
            y += 10;
        }
        else {
            for (const claim of project.patentClaims) {
                if (y > 260) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.rect(15, y, pageWidth - 30, 6, 'FD');
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                const depStr = claim.dependsOnNumber ? ` [Depends on Claim ${claim.dependsOnNumber}]` : ' [Independent]';
                doc.text(`Claim ${claim.claimNumber} (${claim.claimType})${depStr} - Status: ${claim.status}`, 18, y + 4.2);
                y += 9;
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85);
                const fullText = `${claim.preamble ? claim.preamble + ' ' : ''}${claim.body}`;
                const splitText = doc.splitTextToSize(fullText, pageWidth - 36);
                doc.text(splitText, 18, y);
                y += splitText.length * 4.2 + 2;
                // Elements
                if (claim.claimElements.length > 0) {
                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(71, 85, 105);
                    doc.text('Technical Elements & Drawing Callouts:', 22, y);
                    y += 4;
                    doc.setFont('helvetica', 'normal');
                    for (const el of claim.claimElements) {
                        let elStr = `• ${el.elementName}: ${el.elementText}`;
                        if (el.component) {
                            elStr += `  [Ref: ${el.component.referenceNumber} (${el.component.componentName}) in ${el.component.figure?.figureNumber || 'Drawing'}]`;
                        }
                        const splitEl = doc.splitTextToSize(elStr, pageWidth - 44);
                        doc.text(splitEl, 24, y);
                        y += splitEl.length * 3.8 + 1.5;
                    }
                }
                y += 4;
            }
        }
        // SECTION 2: Preliminary FTO Overview
        if (y > 230) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('2. PRELIMINARY FREEDOM-TO-OPERATE (FTO) MATRIX SUMMARY', 15, y);
        y += 8;
        if (!project.claimCharts || project.claimCharts.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No preliminary FTO claim charts generated yet.', 15, y);
            y += 10;
        }
        else {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(241, 245, 249);
            doc.rect(15, y, pageWidth - 30, 6, 'F');
            doc.text('Prior-Art Patent', 18, y + 4.5);
            doc.text('Assignee / Title', 60, y + 4.5);
            doc.text('Preliminary Risk', 150, y + 4.5);
            y += 7;
            doc.setFont('helvetica', 'normal');
            for (const chart of project.claimCharts) {
                doc.text(chart.reference?.patentNumber || 'N/A', 18, y + 4);
                const titleTrunc = chart.reference?.title ? (chart.reference.title.length > 50 ? chart.reference.title.substring(0, 50) + '...' : chart.reference.title) : 'N/A';
                doc.text(titleTrunc, 60, y + 4);
                doc.setFont('helvetica', 'bold');
                if (chart.overallRisk === 'HIGH')
                    doc.setTextColor(185, 28, 28);
                else if (chart.overallRisk === 'MEDIUM')
                    doc.setTextColor(180, 83, 9);
                else
                    doc.setTextColor(21, 128, 61);
                doc.text(chart.overallRisk, 150, y + 4);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85);
                y += 6;
            }
        }
        // Disclaimer footer
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text('Note: PatentHub-AI Claims Engineering Docket. For research & drafting preparation. Not a formal legal document.', 15, 283);
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const uploadDir = this.ensureUploadDirectory();
        const sanitizedFileName = `Claims_Docket_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const document = await db_1.prisma.document.create({
            data: {
                name: `Claims Docket - ${project.title}.pdf`,
                fileUrl,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                version: 1,
                category: 'PATENT_DRAFT',
                projectId
            }
        });
        if (userId) {
            try {
                await db_1.prisma.activityLog.create({
                    data: {
                        userId,
                        projectId,
                        action: `Generated Claims Docket PDF with ${project.patentClaims.length} claims.`
                    }
                });
            }
            catch (e) {
                // Ignore
            }
        }
        return document;
    }
}
exports.PdfService = PdfService;
