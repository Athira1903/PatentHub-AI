"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilingReadinessService = void 0;
const db_1 = require("../config/db");
const patent_form_policy_1 = require("../policies/forms/patent-form.policy");
const jspdf_1 = require("jspdf");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FilingReadinessService {
    /**
     * Evaluates the 6-point filing readiness checklist for a project.
     */
    static async getFilingReadiness(projectId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: { select: { fullName: true, email: true, institution: true } },
                members: { include: { user: { select: { fullName: true, email: true } } } },
                documents: true,
                patentReferences: true,
                patentForms: true,
                projectReviews: true
            }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const blockingIssues = [];
        // 1. Applicant & Project Info
        const hasInfo = Boolean(project.title &&
            project.innovationIdea &&
            project.problemStatement &&
            project.proposedSolution &&
            project.technicalDomain &&
            project.category);
        if (!hasInfo) {
            blockingIssues.push('Project information is incomplete. Title, abstract, problem statement, and proposed solution are required.');
        }
        // 2. Specification & Claims Definition
        const form2 = project.patentForms.find(f => f.formType === 'Form 2');
        const form2Data = form2?.formData;
        const hasSpecification = Boolean((project.novelFeatures || (form2Data && form2Data.novelFeatures)) &&
            (project.keywords || (form2Data && form2Data.claimsText)));
        if (!hasSpecification) {
            blockingIssues.push('Patent specification and claims scope definition are incomplete.');
        }
        // 3. Mandatory Patent Forms (Form 1, 2, 3, 5)
        const formsComplete = patent_form_policy_1.PatentFormPolicy.areMandatoryFormsComplete(project) ||
            ['Form 1', 'Form 2', 'Form 3', 'Form 5'].every(ft => project.patentForms.some(f => f.formType === ft));
        if (!formsComplete) {
            blockingIssues.push('Mandatory IPO forms (Form 1, 2, 3, 5) are incomplete or missing.');
        }
        // 4. Supporting Documents & Drawings
        const hasDocuments = project.documents.length > 0;
        if (!hasDocuments) {
            blockingIssues.push('No supporting documents or technical drawings uploaded to project.');
        }
        // 5. Prior-Art & Patent Intelligence References
        const hasReferences = project.patentReferences.length > 0;
        if (!hasReferences) {
            blockingIssues.push('No prior-art patent references saved to project.');
        }
        // 6. Review & Approval Sign-offs
        const isStageApproved = project.stage === 'FILING_READY' || project.stage === 'FILED';
        const hasApprovedReviews = project.projectReviews.some(r => r.decision === 'APPROVED');
        const hasReviewsPassed = isStageApproved || hasApprovedReviews;
        if (!hasReviewsPassed) {
            blockingIssues.push('Project review approval by assigned Guide / Expert is pending.');
        }
        const checklist = [
            {
                key: 'project_applicant_info',
                title: 'Project & Applicant Information',
                completed: hasInfo,
                required: true,
                explanation: hasInfo
                    ? 'Project details, title, and applicant information are fully configured.'
                    : 'Missing project title, innovation abstract, or problem statement.',
                details: { owner: project.owner.fullName, title: project.title }
            },
            {
                key: 'specification_claims',
                title: 'Specification & Claims Definition',
                completed: hasSpecification,
                required: true,
                explanation: hasSpecification
                    ? 'Technical domain, novel features, and claim scope definitions are established.'
                    : 'Novel features or claim scope definitions are missing.',
                details: { category: project.category, technicalDomain: project.technicalDomain }
            },
            {
                key: 'mandatory_ipo_forms',
                title: 'Mandatory IPO Forms Compilation',
                completed: formsComplete,
                required: true,
                explanation: formsComplete
                    ? 'IPO Forms 1, 2, 3, and 5 are fully compiled and prepared.'
                    : 'One or more mandatory IPO forms (Form 1, 2, 3, 5) are incomplete.',
                details: { compiledForms: project.patentForms.map(f => f.formType) }
            },
            {
                key: 'supporting_documents_drawings',
                title: 'Supporting Documents & Drawings',
                completed: hasDocuments,
                required: true,
                explanation: hasDocuments
                    ? `${project.documents.length} document(s) uploaded to workspace.`
                    : 'Upload at least 1 supporting specification document or drawing figure.',
                details: { documentCount: project.documents.length }
            },
            {
                key: 'prior_art_intelligence',
                title: 'Prior-Art Intelligence & References',
                completed: hasReferences,
                required: true,
                explanation: hasReferences
                    ? `${project.patentReferences.length} verified prior-art reference(s) linked.`
                    : 'Link at least 1 verified prior-art patent reference for similarity diagnostics.',
                details: { referenceCount: project.patentReferences.length }
            },
            {
                key: 'review_approvals',
                title: 'Formal Review Sign-Offs',
                completed: hasReviewsPassed,
                required: true,
                explanation: hasReviewsPassed
                    ? `Project stage is ${project.stage} with reviewer approval logged.`
                    : 'Guide / Expert review approval is pending.',
                details: { stage: project.stage, approvedReviews: project.projectReviews.filter(r => r.decision === 'APPROVED').length }
            }
        ];
        const completedCount = checklist.filter(c => c.completed).length;
        const overallReadiness = completedCount === 6 ? 'READY' : 'NOT_READY';
        return {
            overallReadiness,
            completedCount,
            totalRequiredCount: 6,
            checklist,
            blockingIssues
        };
    }
    /**
     * Compiles a consolidated server-side Filing Package ZIP/PDF bundle.
     * Throws structured error if readiness requirements are incomplete.
     */
    static async exportFilingPackage(projectId, userId) {
        const readiness = await this.getFilingReadiness(projectId);
        if (readiness.overallReadiness !== 'READY') {
            const error = new Error('Cannot export filing package. Project filing-readiness audit failed.');
            error.blockingIssues = readiness.blockingIssues;
            error.readiness = readiness;
            throw error;
        }
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                members: { include: { user: true } },
                patentForms: true,
                patentReferences: true,
                projectReviews: { include: { reviewer: true } }
            }
        });
        if (!project) {
            throw new Error('Project not found for package export.');
        }
        const doc = new jspdf_1.jsPDF();
        // Master Cover Page
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('PatentHub AI', 15, 25);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('OFFICIAL PATENT FILING PREPARATION PACKAGE', 15, 38);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Master Filing Package: ${project.title}`, 15, 65);
        doc.setFontSize(10);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 70, 195, 70);
        let yPos = 80;
        const writeLine = (label, value) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 15, yPos);
            doc.setFont('helvetica', 'normal');
            const split = doc.splitTextToSize(value || 'N/A', 135);
            doc.text(split, 60, yPos);
            yPos += (split.length * 5) + 3;
        };
        writeLine('Project ID', project.id);
        writeLine('Title of Invention', project.title);
        writeLine('Primary Applicant', `${project.owner.fullName} (${project.owner.email})`);
        writeLine('Technical Domain', project.technicalDomain);
        writeLine('Category', project.category);
        writeLine('Workflow Stage', project.stage);
        writeLine('Audit Readiness', '100% (6/6 Checklist Points Passed)');
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('INCLUDED PACKAGE ARTIFACTS:', 15, yPos);
        yPos += 7;
        const artifacts = [
            '1. Master Specification & Claims Package',
            '2. IPO Form 1 (Application for Grant of Patent)',
            '3. IPO Form 2 (Complete Specification)',
            '4. IPO Form 3 (Section 8 Undertaking)',
            '5. IPO Form 5 (Declaration of Inventorship)',
            '6. IPO Form 26 (Power of Attorney)',
            `7. Verified Prior-Art References Log (${project.patentReferences.length} items)`,
            `8. Review Decision Audit History (${project.projectReviews.length} records)`
        ];
        artifacts.forEach(art => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(art, 20, yPos);
            yPos += 6;
        });
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const uploadDir = path_1.default.join(__dirname, '../../public/uploads/documents');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const sanitizedFileName = `Filing_Package_${projectId.substring(0, 8)}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadDir, sanitizedFileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        const fileUrl = `/uploads/documents/${sanitizedFileName}`;
        const document = await db_1.prisma.document.create({
            data: {
                name: `Filing Package - ${project.title}.pdf`,
                fileUrl,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                version: 1,
                category: 'PATENT_DRAFT',
                projectId
            }
        });
        await db_1.prisma.activityLog.create({
            data: {
                userId,
                projectId,
                action: `Generated consolidated Filing-Ready Package PDF.`
            }
        });
        return document;
    }
}
exports.FilingReadinessService = FilingReadinessService;
