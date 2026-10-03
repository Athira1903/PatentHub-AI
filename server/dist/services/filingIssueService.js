"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilingIssueService = void 0;
const db_1 = require("../config/db");
class FilingIssueService {
    /**
     * Performs an authoritative, rule-based Indian patent filing readiness audit.
     * Produces structured issues with direct deep-linking routes for resolution.
     */
    static async assessFilingReadiness(projectId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                applicants: true,
                inventors: true,
                specifications: { where: { isCurrent: true } },
                patentClaims: true,
                patentReferences: true,
                patentForms: true,
                projectReviews: { orderBy: { createdAt: 'desc' } },
                drawingFigures: true,
                deadlines: true,
                documents: true,
                members: true,
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const issues = [];
        let passedChecks = 0;
        const totalChecks = 12;
        const isProvisional = project.specificationType === 'PROVISIONAL';
        const currentSpec = project.specifications[0];
        const independentClaim = project.patentClaims.find((c) => c.claimType === 'INDEPENDENT');
        const latestReview = project.projectReviews[0];
        // Check 1: Invention Title & Abstract
        if (!project.title || project.title.trim().length < 5) {
            issues.push({
                id: 'issue-title',
                title: 'Invention title is missing or too brief',
                description: 'A precise, descriptive title of between 10 and 15 words is required for Form 1 and Form 2.',
                priority: 'CRITICAL',
                category: 'INVENTION_DETAILS',
                route: `/projects/${projectId}?tab=innovation&field=title`,
                fieldReference: 'title',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 2: Problem Statement & Proposed Technical Solution
        if (!project.problemStatement || !project.proposedSolution) {
            issues.push({
                id: 'issue-technical-definition',
                title: 'Technical problem and solution description incomplete',
                description: 'Provide an unambiguous explanation of the existing technical defect and your novel mechanism.',
                priority: 'HIGH',
                category: 'INVENTION_DETAILS',
                route: `/projects/${projectId}?tab=innovation&field=problem`,
                fieldReference: 'problemStatement',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 3: Legal Applicants
        if (project.applicants.length === 0) {
            issues.push({
                id: 'issue-applicant-missing',
                title: 'No legal applicant designated (Form 1)',
                description: 'Form 1 (Application for Grant of Patent) requires the legal entity name, full address, and nationality of the applicant.',
                priority: 'CRITICAL',
                category: 'APPLICANTS',
                route: `/projects/${projectId}?tab=innovation&section=applicant`,
                fieldReference: 'applicants',
                status: 'PENDING',
            });
        }
        else {
            const primaryApplicant = project.applicants[0];
            if (!primaryApplicant.address || !primaryApplicant.nationality) {
                issues.push({
                    id: 'issue-applicant-details',
                    title: 'Applicant postal address or nationality missing',
                    description: 'Indian Patent Office requires full postal address with PIN code and nationality for official correspondence.',
                    priority: 'HIGH',
                    category: 'APPLICANTS',
                    route: `/projects/${projectId}?tab=innovation&section=applicant`,
                    fieldReference: 'applicantAddress',
                    status: 'PENDING',
                });
            }
            else {
                passedChecks++;
            }
        }
        // Check 4: Legal Inventors
        if (project.inventors.length === 0) {
            issues.push({
                id: 'issue-inventor-missing',
                title: 'No named inventors declared (Form 5)',
                description: 'Under Section 10(6) of the Patents Act, 1970, true and first inventors must be identified with residential addresses.',
                priority: 'CRITICAL',
                category: 'INVENTORS',
                route: `/projects/${projectId}?tab=innovation&section=inventor`,
                fieldReference: 'inventors',
                status: 'PENDING',
            });
        }
        else {
            const unsignedInventors = project.inventors.filter((inv) => !inv.inventorshipDeclarationSigned);
            if (unsignedInventors.length > 0) {
                issues.push({
                    id: 'issue-inventor-declaration',
                    title: `Inventorship declaration pending for ${unsignedInventors.length} inventor(s)`,
                    description: 'Form 5 requires confirmation of inventorship declaration assent for all co-inventors.',
                    priority: 'MEDIUM',
                    category: 'INVENTORS',
                    route: `/projects/${projectId}?tab=innovation&section=inventor`,
                    fieldReference: 'inventorshipDeclaration',
                    status: 'PENDING',
                });
            }
            else {
                passedChecks++;
            }
        }
        // Check 5: Specification Abstract & Background
        if (!currentSpec || !currentSpec.abstract || currentSpec.abstract.trim().length < 50) {
            issues.push({
                id: 'issue-spec-abstract',
                title: 'Specification Abstract is missing or too concise',
                description: 'Rule 13(7) of Patent Rules, 2003 requires an abstract of up to 150 words summarizing the technical disclosure.',
                priority: 'HIGH',
                category: 'SPECIFICATION',
                route: `/projects/${projectId}?tab=draft&sub=spec&field=abstract`,
                fieldReference: 'specificationAbstract',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 6: Specification Detailed Description
        if (!currentSpec || !currentSpec.detailedDescription || currentSpec.detailedDescription.trim().length < 100) {
            issues.push({
                id: 'issue-spec-description',
                title: 'Detailed technical description incomplete',
                description: 'Provide a thorough working description enabling a person skilled in the art to replicate the invention.',
                priority: 'HIGH',
                category: 'SPECIFICATION',
                route: `/projects/${projectId}?tab=draft&sub=spec&field=detailedDescription`,
                fieldReference: 'specificationDescription',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 7: Claims Definition
        if (isProvisional) {
            // Provisional does not legally mandate claims
            passedChecks++;
        }
        else {
            if (!independentClaim) {
                issues.push({
                    id: 'issue-claims-independent',
                    title: 'Independent Claim 1 missing',
                    description: 'Complete specification must contain at least one independent claim defining the novel scope under Section 10(4)(c).',
                    priority: 'CRITICAL',
                    category: 'CLAIMS',
                    route: `/projects/${projectId}?tab=draft&sub=claims`,
                    fieldReference: 'independentClaim',
                    status: 'PENDING',
                });
            }
            else if (project.patentClaims.length < 2) {
                issues.push({
                    id: 'issue-claims-dependent',
                    title: 'Only 1 claim defined (Dependent claims recommended)',
                    description: 'Adding 2-5 dependent claims establishes fallback positions during patent office examination.',
                    priority: 'LOW',
                    category: 'CLAIMS',
                    route: `/projects/${projectId}?tab=draft&sub=claims`,
                    fieldReference: 'dependentClaims',
                    status: 'PENDING',
                });
                passedChecks++;
            }
            else {
                passedChecks++;
            }
        }
        // Check 8: Drawings & Figures
        if (project.patentCategory !== 'PROCESS' && project.drawingFigures.length === 0) {
            issues.push({
                id: 'issue-drawings-missing',
                title: 'No drawings or figures attached',
                description: 'Rule 15 of Patent Rules requires drawings illustrating parts referred to in the specification and claims.',
                priority: 'MEDIUM',
                category: 'DRAWINGS',
                route: `/projects/${projectId}?tab=draft&sub=drawings`,
                fieldReference: 'drawings',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 9: Prior Art Search & Comparison
        if (project.patentReferences.length === 0) {
            issues.push({
                id: 'issue-prior-art-empty',
                title: 'No prior-art citations reviewed in Research Lab',
                description: 'Documenting existing patent literature ensures your claims do not overlap with known prior art.',
                priority: 'MEDIUM',
                category: 'INVENTION_DETAILS',
                route: `/projects/${projectId}?tab=research`,
                fieldReference: 'priorArt',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 10: Substantive Review Status
        if (!latestReview || latestReview.decision !== 'APPROVED') {
            issues.push({
                id: 'issue-review-pending',
                title: latestReview?.decision === 'CHANGES_REQUESTED' ? 'Review feedback requires resolution' : 'Guide or Expert review pending',
                description: latestReview?.comments || 'A formal review evaluation must be approved before generating submission packages.',
                priority: 'HIGH',
                category: 'REVIEWS',
                route: `/projects/${projectId}?tab=review`,
                fieldReference: 'reviews',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 11: Mandatory Indian Forms
        const form1 = project.patentForms.find((f) => f.formType === 'Form 1');
        const form2 = project.patentForms.find((f) => f.formType === 'Form 2');
        if (!form1 || !form2) {
            issues.push({
                id: 'issue-forms-generated',
                title: 'Mandatory Indian Patent Forms (Form 1 & Form 2) need generation',
                description: 'Generate and review official Form 1 (Application for Grant) and Form 2 (Specification).',
                priority: 'HIGH',
                category: 'FORMS',
                route: `/projects/${projectId}?tab=filing`,
                fieldReference: 'patentForms',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Check 12: Statutory Deadlines
        const overdueDeadline = project.deadlines.find((d) => d.status === 'OVERDUE');
        if (overdueDeadline) {
            issues.push({
                id: 'issue-deadline-overdue',
                title: `Overdue statutory filing milestone: ${overdueDeadline.deadlineType}`,
                description: overdueDeadline.description || 'Statutory filing time limit under the Patents Act has elapsed.',
                priority: 'CRITICAL',
                category: 'DEADLINES',
                route: `/projects/${projectId}?tab=filing`,
                fieldReference: 'deadlines',
                status: 'PENDING',
            });
        }
        else {
            passedChecks++;
        }
        // Calculate score
        const overallScore = Math.min(100, Math.round((passedChecks / totalChecks) * 100));
        let status = 'INCOMPLETE';
        if (overallScore >= 90 && issues.filter((i) => i.priority === 'CRITICAL').length === 0) {
            status = 'READY';
        }
        else if (issues.some((i) => i.category === 'REVIEWS')) {
            status = 'REQUIRES_REVIEW';
        }
        else if (overallScore >= 60) {
            status = 'WARNING';
        }
        // Applicable Indian Patent Forms determination
        const applicableForms = [
            {
                formNumber: 'Form 1',
                name: 'Application for Grant of Patent',
                ruleReference: 'Section 7, 54 & 135 and Rule 20(1)',
                status: form1 ? 'COMPLETED' : project.applicants.length > 0 ? 'READY' : 'INCOMPLETE',
                description: 'Mandatory application declaring applicant, inventor details, category, and jurisdiction.',
            },
            {
                formNumber: 'Form 2',
                name: isProvisional ? 'Provisional Specification' : 'Complete Specification',
                ruleReference: 'Section 10 and Rule 13',
                status: form2 ? 'COMPLETED' : currentSpec?.abstract ? 'READY' : 'INCOMPLETE',
                description: isProvisional
                    ? 'Provisional specification describing the nature of the invention without formal claims.'
                    : 'Complete specification fully describing the invention, working principle, and patent claims.',
            },
            {
                formNumber: 'Form 3',
                name: 'Statement and Undertaking Regarding Foreign Applications',
                ruleReference: 'Section 8 and Rule 12',
                status: 'OPTIONAL',
                description: 'Required if the applicant has filed or intends to file corresponding patent applications in foreign jurisdictions.',
            },
            {
                formNumber: 'Form 5',
                name: 'Declaration as to Inventorship',
                ruleReference: 'Section 10(6) and Rule 13(6)',
                status: isProvisional ? 'NOT_APPLICABLE' : project.inventors.length > 0 ? 'READY' : 'INCOMPLETE',
                description: 'Mandatory with complete specification filed after provisional or conventional application.',
            },
            {
                formNumber: 'Form 18',
                name: 'Request for Examination of Application for Patent',
                ruleReference: 'Section 11B and Rule 24B(1)(i)',
                status: 'OPTIONAL',
                description: 'Required to initiate substantive examination by the Patent Office within 48 months of filing.',
            },
            {
                formNumber: 'Form 26',
                name: 'Form of Authorisation of a Patent Agent',
                ruleReference: 'Section 127, 132 and Rule 135',
                status: project.members.some((m) => m.role === 'PATENT_EXPERT') ? 'OPTIONAL' : 'NOT_APPLICABLE',
                description: 'Power of Attorney authorizing a Registered Patent Agent or Advocate to act on applicant behalf.',
            },
        ];
        return {
            overallScore,
            status,
            specificationType: project.specificationType || 'COMPLETE',
            completedRequirements: passedChecks,
            totalRequirements: totalChecks,
            issues,
            applicableForms,
            deadlines: project.deadlines.map((d) => ({
                id: d.id,
                deadlineType: d.deadlineType,
                dueDate: d.dueDate,
                status: d.status,
                description: d.description,
            })),
        };
    }
}
exports.FilingIssueService = FilingIssueService;
