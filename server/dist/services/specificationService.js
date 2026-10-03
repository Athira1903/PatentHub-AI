"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecificationService = exports.SPEC_SECTION_KEYS = void 0;
const db_1 = require("../config/db");
const jspdf_1 = require("jspdf");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.SPEC_SECTION_KEYS = [
    'abstract',
    'background',
    'problem',
    'proposedSolution',
    'summary',
    'detailedDescription',
    'technicalComponents',
    'workingPrinciple',
    'advantages',
    'applications',
    'industrialApplicability',
];
class SpecificationService {
    /**
     * Dynamically calculates non-empty structured sections out of the 11 statutory sections.
     * Avoids treating pure whitespace as completion.
     */
    static calculateCompleteness(spec) {
        if (!spec) {
            return {
                completedCount: 0,
                totalCount: exports.SPEC_SECTION_KEYS.length,
                percentage: 0,
                sections: {},
            };
        }
        const sections = {};
        let completedCount = 0;
        for (const key of exports.SPEC_SECTION_KEYS) {
            const val = spec[key];
            const isFilled = typeof val === 'string' && val.trim().length > 10;
            sections[key] = isFilled;
            if (isFilled)
                completedCount++;
        }
        const percentage = Math.round((completedCount / exports.SPEC_SECTION_KEYS.length) * 100);
        return {
            completedCount,
            totalCount: exports.SPEC_SECTION_KEYS.length,
            percentage,
            sections,
        };
    }
    /**
     * Retrieves the current working specification for a project along with version history and completeness.
     */
    static async getSpecification(projectId) {
        let spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    select: {
                        id: true,
                        versionNumber: true,
                        title: true,
                        changeSummary: true,
                        isCurrent: true,
                        createdAt: true,
                        updatedAt: true,
                        savedByUserId: true,
                    },
                },
            },
        });
        // Auto-initialize specification draft from project data if not yet created
        if (!spec) {
            const project = await db_1.prisma.patentProject.findUnique({
                where: { id: projectId },
            });
            if (!project)
                throw new Error('Project not found');
            const initialTitle = project.title || 'UNTITLED INVENTION';
            const initialAbstract = project.innovationIdea || '';
            const initialProblem = project.problemStatement || '';
            const initialSolution = project.proposedSolution || '';
            const initialAdvantages = project.novelFeatures || '';
            spec = await db_1.prisma.specification.create({
                data: {
                    projectId,
                    title: initialTitle,
                    abstract: initialAbstract,
                    problem: initialProblem,
                    proposedSolution: initialSolution,
                    advantages: initialAdvantages,
                    specificationType: project.specificationType || 'COMPLETE',
                    version: 1,
                    isCurrent: true,
                    status: 'DRAFT',
                },
                include: {
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                        select: {
                            id: true,
                            versionNumber: true,
                            title: true,
                            changeSummary: true,
                            isCurrent: true,
                            createdAt: true,
                            updatedAt: true,
                            savedByUserId: true,
                        },
                    },
                },
            });
            // Create baseline initial Version 1 snapshot
            const v1 = await db_1.prisma.specificationVersion.create({
                data: {
                    specificationId: spec.id,
                    versionNumber: 1,
                    title: initialTitle,
                    abstract: initialAbstract,
                    problem: initialProblem,
                    proposedSolution: initialSolution,
                    advantages: initialAdvantages,
                    changeSummary: 'Initial specification draft',
                    isCurrent: true,
                    savedByUserId: project.ownerId,
                },
            });
            spec = await db_1.prisma.specification.update({
                where: { id: spec.id },
                data: { currentVersionId: v1.id },
                include: {
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                        select: {
                            id: true,
                            versionNumber: true,
                            title: true,
                            changeSummary: true,
                            isCurrent: true,
                            createdAt: true,
                            updatedAt: true,
                            savedByUserId: true,
                        },
                    },
                },
            });
        }
        // Check project reviews for review state banner (e.g. CHANGES_REQUESTED)
        const latestReview = await db_1.prisma.projectReview.findFirst({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                reviewer: {
                    select: { id: true, fullName: true, username: true, role: true },
                },
            },
        });
        const completeness = this.calculateCompleteness(spec);
        return {
            ...spec,
            completeness,
            reviewContext: latestReview
                ? {
                    decision: latestReview.decision,
                    comments: latestReview.comments,
                    reviewType: latestReview.reviewType,
                    reviewerName: latestReview.reviewer?.fullName || latestReview.reviewer?.username,
                    createdAt: latestReview.createdAt,
                }
                : null,
        };
    }
    /**
     * Updates or autosaves the current working specification draft.
     * Does NOT create a new version on autosave unless createSnapshot is explicitly requested.
     */
    static async saveSpecification(projectId, input, userId) {
        let spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec) {
            await this.getSpecification(projectId);
            spec = await db_1.prisma.specification.findFirst({
                where: { projectId, isCurrent: true },
            });
            if (!spec)
                throw new Error('Specification could not be initialized');
        }
        const shouldCreateSnapshot = !!input.createSnapshot;
        const updateData = {};
        if (input.title !== undefined)
            updateData.title = input.title;
        if (input.abstract !== undefined)
            updateData.abstract = input.abstract;
        if (input.background !== undefined)
            updateData.background = input.background;
        if (input.problem !== undefined)
            updateData.problem = input.problem;
        if (input.proposedSolution !== undefined)
            updateData.proposedSolution = input.proposedSolution;
        if (input.summary !== undefined)
            updateData.summary = input.summary;
        if (input.detailedDescription !== undefined)
            updateData.detailedDescription = input.detailedDescription;
        if (input.technicalComponents !== undefined)
            updateData.technicalComponents = input.technicalComponents;
        if (input.workingPrinciple !== undefined)
            updateData.workingPrinciple = input.workingPrinciple;
        if (input.advantages !== undefined)
            updateData.advantages = input.advantages;
        if (input.applications !== undefined)
            updateData.applications = input.applications;
        if (input.industrialApplicability !== undefined)
            updateData.industrialApplicability = input.industrialApplicability;
        if (input.specificationType !== undefined)
            updateData.specificationType = input.specificationType;
        if (input.status !== undefined)
            updateData.status = input.status;
        let updated = await db_1.prisma.specification.update({
            where: { id: spec.id },
            data: updateData,
        });
        if (shouldCreateSnapshot) {
            const summary = input.changeSummary || input.versionNotes || 'Specification updated';
            const versionResult = await this.createVersion(projectId, summary, userId);
            return versionResult;
        }
        const completeness = this.calculateCompleteness(updated);
        return {
            ...updated,
            completeness,
        };
    }
    /**
     * Explicitly creates a new version snapshot (Version N+1) from current specification state.
     */
    static async createVersion(projectId, changeSummary, userId) {
        let spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec) {
            await this.getSpecification(projectId);
            spec = await db_1.prisma.specification.findFirst({
                where: { projectId, isCurrent: true },
            });
            if (!spec)
                throw new Error('Specification not found');
        }
        // Determine highest existing version number
        const highestVer = await db_1.prisma.specificationVersion.findFirst({
            where: { specificationId: spec.id },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
        });
        const nextVersionNumber = (highestVer?.versionNumber || spec.version || 0) + 1;
        // Reset current flag on existing versions
        await db_1.prisma.specificationVersion.updateMany({
            where: { specificationId: spec.id, isCurrent: true },
            data: { isCurrent: false },
        });
        // Create new version snapshot with current content
        const newVersion = await db_1.prisma.specificationVersion.create({
            data: {
                specificationId: spec.id,
                versionNumber: nextVersionNumber,
                title: spec.title,
                abstract: spec.abstract,
                background: spec.background,
                problem: spec.problem,
                proposedSolution: spec.proposedSolution,
                summary: spec.summary,
                detailedDescription: spec.detailedDescription,
                technicalComponents: spec.technicalComponents,
                workingPrinciple: spec.workingPrinciple,
                advantages: spec.advantages,
                applications: spec.applications,
                industrialApplicability: spec.industrialApplicability,
                savedByUserId: userId,
                changeSummary: changeSummary?.trim() || 'Specification updated',
                isCurrent: true,
            },
        });
        // Update specification with new version counter and currentVersionId
        const updatedSpec = await db_1.prisma.specification.update({
            where: { id: spec.id },
            data: {
                version: nextVersionNumber,
                currentVersionId: newVersion.id,
            },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    select: {
                        id: true,
                        versionNumber: true,
                        title: true,
                        changeSummary: true,
                        isCurrent: true,
                        createdAt: true,
                        updatedAt: true,
                        savedByUserId: true,
                    },
                },
            },
        });
        const completeness = this.calculateCompleteness(updatedSpec);
        return {
            ...updatedSpec,
            completeness,
            createdVersion: newVersion,
        };
    }
    /**
     * Retrieves all historical version snapshots for a project specification.
     */
    static async getVersions(projectId) {
        const spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec)
            return [];
        return await db_1.prisma.specificationVersion.findMany({
            where: { specificationId: spec.id },
            orderBy: { versionNumber: 'desc' },
        });
    }
    /**
     * Retrieves a single historical version snapshot by ID.
     */
    static async getVersion(projectId, versionId) {
        const spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec)
            throw new Error('Specification not found');
        const version = await db_1.prisma.specificationVersion.findFirst({
            where: {
                id: versionId,
                specificationId: spec.id,
            },
        });
        if (!version) {
            throw new Error('Specification version not found');
        }
        const completeness = this.calculateCompleteness(version);
        return {
            ...version,
            completeness,
        };
    }
    /**
     * Safe restoration: Restoring an older version creates a NEW version snapshot (Version N+1)
     * populated with the restored content and updates the current working draft.
     * Historical versions are NEVER destroyed or mutated.
     */
    static async restoreVersion(projectId, versionId, userId) {
        const spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec)
            throw new Error('Active specification not found');
        const historical = await db_1.prisma.specificationVersion.findFirst({
            where: { id: versionId, specificationId: spec.id },
        });
        if (!historical) {
            throw new Error(`Historical specification version ${versionId} not found`);
        }
        // Determine next version number
        const highestVer = await db_1.prisma.specificationVersion.findFirst({
            where: { specificationId: spec.id },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
        });
        const nextVersionNumber = (highestVer?.versionNumber || spec.version || 0) + 1;
        // Reset current flag on all versions
        await db_1.prisma.specificationVersion.updateMany({
            where: { specificationId: spec.id, isCurrent: true },
            data: { isCurrent: false },
        });
        // Create new Version N+1 with the historical content
        const restoredVersion = await db_1.prisma.specificationVersion.create({
            data: {
                specificationId: spec.id,
                versionNumber: nextVersionNumber,
                title: historical.title,
                abstract: historical.abstract,
                background: historical.background,
                problem: historical.problem,
                proposedSolution: historical.proposedSolution,
                summary: historical.summary,
                detailedDescription: historical.detailedDescription,
                technicalComponents: historical.technicalComponents,
                workingPrinciple: historical.workingPrinciple,
                advantages: historical.advantages,
                applications: historical.applications,
                industrialApplicability: historical.industrialApplicability,
                savedByUserId: userId,
                changeSummary: `Restored from Version ${historical.versionNumber}`,
                isCurrent: true,
            },
        });
        // Update active working draft with historical snapshot content
        const updatedSpec = await db_1.prisma.specification.update({
            where: { id: spec.id },
            data: {
                title: historical.title,
                abstract: historical.abstract,
                background: historical.background,
                problem: historical.problem,
                proposedSolution: historical.proposedSolution,
                summary: historical.summary,
                detailedDescription: historical.detailedDescription,
                technicalComponents: historical.technicalComponents,
                workingPrinciple: historical.workingPrinciple,
                advantages: historical.advantages,
                applications: historical.applications,
                industrialApplicability: historical.industrialApplicability,
                version: nextVersionNumber,
                currentVersionId: restoredVersion.id,
            },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    select: {
                        id: true,
                        versionNumber: true,
                        title: true,
                        changeSummary: true,
                        isCurrent: true,
                        createdAt: true,
                        updatedAt: true,
                        savedByUserId: true,
                    },
                },
            },
        });
        const completeness = this.calculateCompleteness(updatedSpec);
        return {
            ...updatedSpec,
            completeness,
            restoredFromVersionNumber: historical.versionNumber,
            newVersion: restoredVersion,
        };
    }
    /**
     * Compares two specification versions (or compares a version with the current draft).
     */
    static async compareVersions(projectId, versionAId, versionBId) {
        const spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec)
            throw new Error('Specification not found');
        let verA;
        let verB;
        if (versionAId === 'current') {
            verA = { ...spec, versionNumber: spec.version, changeSummary: 'Current Working Draft' };
        }
        else {
            const parsedNumA = parseInt(versionAId, 10);
            const isNumA = !isNaN(parsedNumA) && String(parsedNumA) === versionAId;
            verA = await db_1.prisma.specificationVersion.findFirst({
                where: isNumA
                    ? { specificationId: spec.id, versionNumber: parsedNumA }
                    : { id: versionAId, specificationId: spec.id },
            });
            if (!verA)
                throw new Error(`Version A (${versionAId}) not found`);
        }
        if (versionBId === 'current') {
            verB = { ...spec, versionNumber: spec.version, changeSummary: 'Current Working Draft' };
        }
        else {
            const parsedNumB = parseInt(versionBId, 10);
            const isNumB = !isNaN(parsedNumB) && String(parsedNumB) === versionBId;
            verB = await db_1.prisma.specificationVersion.findFirst({
                where: isNumB
                    ? { specificationId: spec.id, versionNumber: parsedNumB }
                    : { id: versionBId, specificationId: spec.id },
            });
            if (!verB)
                throw new Error(`Version B (${versionBId}) not found`);
        }
        const sectionLabels = {
            title: 'Title of Invention',
            abstract: 'Abstract',
            background: 'Field & Background',
            problem: 'Technical Problem',
            proposedSolution: 'Proposed Solution',
            summary: 'Summary of the Invention',
            detailedDescription: 'Detailed Description',
            technicalComponents: 'Technical Components',
            workingPrinciple: 'Working Principle',
            advantages: 'Technical Advantages',
            applications: 'Applications',
            industrialApplicability: 'Industrial Applicability',
        };
        const keysToCompare = ['title', ...exports.SPEC_SECTION_KEYS];
        const differences = [];
        let changedSectionsCount = 0;
        for (const key of keysToCompare) {
            const contentA = (verA[key] || '').trim();
            const contentB = (verB[key] || '').trim();
            const hasChanged = contentA !== contentB;
            if (hasChanged)
                changedSectionsCount++;
            differences.push({
                key,
                label: sectionLabels[key] || key,
                hasChanged,
                contentA,
                contentB,
            });
        }
        return {
            versionA: {
                id: verA.id || 'current',
                versionNumber: verA.versionNumber,
                changeSummary: verA.changeSummary,
                createdAt: verA.createdAt,
            },
            versionB: {
                id: verB.id || 'current',
                versionNumber: verB.versionNumber,
                changeSummary: verB.changeSummary,
                createdAt: verB.createdAt,
            },
            changedSectionsCount,
            differences,
        };
    }
    /**
     * Synchronizes the approved or current specification content directly into Indian Patent Form 2.
     * Updates Form 2 formData JSON and sets lastSyncedWithForm2 timestamp on Specification.
     */
    static async syncWithForm2(projectId, userId) {
        const spec = await db_1.prisma.specification.findFirst({
            where: { projectId, isCurrent: true },
        });
        if (!spec)
            throw new Error('Active specification not found to synchronize');
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                patentClaims: { orderBy: { orderIndex: 'asc' } },
                owner: true,
                members: { include: { user: true } },
            },
        });
        if (!project)
            throw new Error('Project not found');
        // Build structured claims text from existing claims if present
        let claimsText = '';
        if (project.patentClaims && project.patentClaims.length > 0) {
            claimsText = project.patentClaims
                .map((c) => `${c.claimNumber}. ${c.preamble} ${c.body}`)
                .join('\n\n');
        }
        else {
            claimsText = `1. A technical system for ${spec.title}, comprising: ${spec.proposedSolution || 'a functional processing assembly.'}`;
        }
        // Structured Form 2 formData mapping
        const form2Data = {
            specificationType: spec.specificationType || 'COMPLETE',
            title: spec.title || project.title,
            preamble: spec.specificationType === 'PROVISIONAL'
                ? 'The following specification describes the invention.'
                : 'The following specification particularly describes the invention and the manner in which it is to be performed.',
            abstract: spec.abstract || '',
            background: spec.background || '',
            problemStatement: spec.problem || '',
            proposedSolution: spec.proposedSolution || '',
            summary: spec.summary || '',
            detailedDescription: spec.detailedDescription || '',
            technicalComponents: spec.technicalComponents || '',
            workingPrinciple: spec.workingPrinciple || '',
            advantages: spec.advantages || '',
            applications: spec.applications || '',
            industrialApplicability: spec.industrialApplicability || '',
            novelFeatures: spec.advantages || project.novelFeatures || '',
            claimsCount: project.patentClaims.length || 1,
            claimsText,
            specificationSections: {
                abstract: spec.abstract || '',
                background: spec.background || '',
                problem: spec.problem || '',
                proposedSolution: spec.proposedSolution || '',
                summary: spec.summary || '',
                detailedDescription: spec.detailedDescription || '',
                technicalComponents: spec.technicalComponents || '',
                workingPrinciple: spec.workingPrinciple || '',
                advantages: spec.advantages || '',
                applications: spec.applications || '',
                industrialApplicability: spec.industrialApplicability || '',
            },
            lastSyncedAt: new Date().toISOString(),
            syncedVersionNumber: spec.version,
        };
        // Find or create Form 2
        let form2 = await db_1.prisma.patentForm.findFirst({
            where: { projectId, formType: 'Form 2' },
        });
        if (form2) {
            form2 = await db_1.prisma.patentForm.update({
                where: { id: form2.id },
                data: {
                    formData: form2Data,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            form2 = await db_1.prisma.patentForm.create({
                data: {
                    projectId,
                    formType: 'Form 2',
                    formData: form2Data,
                    status: 'DRAFT',
                    createdBy: userId || project.ownerId,
                },
            });
        }
        // Update lastSyncedWithForm2 on Specification
        const now = new Date();
        const updatedSpec = await db_1.prisma.specification.update({
            where: { id: spec.id },
            data: { lastSyncedWithForm2: now },
        });
        return {
            success: true,
            message: 'Specification successfully synchronized to Indian Patent Form 2',
            lastSyncedWithForm2: now,
            formId: form2.id,
            formType: 'Form 2',
            syncedSectionsCount: exports.SPEC_SECTION_KEYS.length,
        };
    }
    /**
     * Exports official Indian Patent Form 2 specification text document with all 11 structured sections.
     */
    static async exportPdf(projectId) {
        const spec = await this.getSpecification(projectId);
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                applicants: true,
                inventors: true,
                patentClaims: { orderBy: { orderIndex: 'asc' } },
            },
        });
        const doc = new jspdf_1.jsPDF();
        let y = 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('FORM 2', 105, y, { align: 'center' });
        y += 7;
        doc.setFontSize(11);
        doc.text('THE PATENTS ACT, 1970 (39 of 1970)', 105, y, { align: 'center' });
        y += 5;
        doc.text('& THE PATENTS RULES, 2003', 105, y, { align: 'center' });
        y += 7;
        doc.setFontSize(13);
        doc.text(spec.specificationType === 'PROVISIONAL' ? 'PROVISIONAL SPECIFICATION' : 'COMPLETE SPECIFICATION', 105, y, { align: 'center' });
        y += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('(See section 10 and rule 13)', 105, y, { align: 'center' });
        y += 12;
        doc.setFont('helvetica', 'bold');
        doc.text('1. TITLE OF THE INVENTION:', 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(spec.title || project?.title || 'UNTITLED INVENTION', 15, y);
        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('2. APPLICANT(S):', 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        if (project?.applicants && project.applicants.length > 0) {
            for (const app of project.applicants) {
                doc.text(`${app.name} (${app.nationality}), Address: ${app.address}`, 15, y);
                y += 6;
            }
        }
        else {
            doc.text('Applicant information to be designated upon official lodgment.', 15, y);
            y += 6;
        }
        y += 6;
        // All 11 Structured Sections
        const sections = [
            { heading: '3. ABSTRACT', content: spec.abstract },
            { heading: '4. FIELD OF THE INVENTION & BACKGROUND', content: spec.background },
            { heading: '5. TECHNICAL DEFECTS & PROBLEM STATEMENT', content: spec.problem },
            { heading: '6. PROPOSED TECHNICAL SOLUTION', content: spec.proposedSolution },
            { heading: '7. SUMMARY OF THE INVENTION', content: spec.summary },
            { heading: '8. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS', content: spec.detailedDescription },
            { heading: '9. TECHNICAL COMPONENTS & ASSEMBLIES', content: spec.technicalComponents },
            { heading: '10. WORKING PRINCIPLE & OPERATIONAL FLOW', content: spec.workingPrinciple },
            { heading: '11. TECHNICAL ADVANTAGES & IMPROVEMENTS', content: spec.advantages },
            { heading: '12. APPLICATIONS & EMBODIMENTS', content: spec.applications },
            { heading: '13. INDUSTRIAL APPLICABILITY', content: spec.industrialApplicability },
        ];
        for (const s of sections) {
            if (s.content) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(s.heading, 15, y);
                y += 6;
                doc.setFont('helvetica', 'normal');
                const splitText = doc.splitTextToSize(s.content, 180);
                doc.text(splitText, 15, y);
                y += splitText.length * 5 + 6;
            }
        }
        if (spec.specificationType !== 'PROVISIONAL' && project?.patentClaims && project.patentClaims.length > 0) {
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.text('WE CLAIM:', 15, y);
            y += 8;
            doc.setFont('helvetica', 'normal');
            for (const claim of project.patentClaims) {
                const claimText = `${claim.claimNumber}. ${claim.preamble} ${claim.body}`;
                const split = doc.splitTextToSize(claimText, 180);
                if (y + split.length * 5 > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(split, 15, y);
                y += split.length * 5 + 4;
            }
        }
        const uploadsDir = path_1.default.join(__dirname, '../../public/uploads/documents');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const filename = `Specification_${projectId}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadsDir, filename);
        const pdfOutput = doc.output('arraybuffer');
        fs_1.default.writeFileSync(filePath, Buffer.from(pdfOutput));
        return {
            fileUrl: `/uploads/documents/${filename}`,
            filename,
        };
    }
}
exports.SpecificationService = SpecificationService;
