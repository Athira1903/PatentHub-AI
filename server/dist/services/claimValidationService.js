"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimValidationService = void 0;
const db_1 = require("../config/db");
const claimService_1 = require("./claimService");
const activityService_1 = require("./activityService");
class ClaimValidationService {
    /**
     * Deterministic heuristic validator for antecedent basis and terminology consistency.
     * Checks for definite references ("the X", "said X") that lack prior indefinite introduction ("a X", "an X").
     */
    static validateAntecedents(claim) {
        const issues = [];
        const text = `${claim.preamble || ''} ${claim.body || ''}`.trim();
        if (!text) {
            return { valid: false, issues: [{ type: 'MISSING_LIMITATION', message: 'Claim text is completely empty.', severity: 'ERROR' }] };
        }
        // Common stop words to exclude from antecedent checks
        const stopWords = new Set([
            'invention', 'system', 'apparatus', 'method', 'device', 'process', 'step', 'means', 'group',
            'plurality', 'portion', 'first', 'second', 'third', 'said', 'the', 'same', 'above', 'prior',
            'following', 'art', 'scope', 'claim', 'claims', 'embodiment', 'accordance', 'further', 'wherein',
            'comprising', 'including', 'having', 'characterized', 'thereof', 'coupled', 'connected', 'configured'
        ]);
        // Tokenize into phrases and clauses
        // Look for patterns like "the <noun>" or "said <noun>"
        const definitePattern = /\b(?:the|said)\s+([a-zA-Z0-9_\-]+(?:\s+[a-zA-Z0-9_\-]+)?)\b/gi;
        const indefinitePattern = /\b(?:a|an|one|at\s+least\s+one|a\s+plurality\s+of)\s+([a-zA-Z0-9_\-]+(?:\s+[a-zA-Z0-9_\-]+)?)\b/gi;
        const introducedTerms = new Set();
        let indMatch;
        while ((indMatch = indefinitePattern.exec(text)) !== null) {
            const term = indMatch[1].toLowerCase().trim();
            const firstWord = term.split(/\s+/)[0];
            if (!stopWords.has(term))
                introducedTerms.add(term);
            if (!stopWords.has(firstWord))
                introducedTerms.add(firstWord);
        }
        let defMatch;
        while ((defMatch = definitePattern.exec(text)) !== null) {
            const term = defMatch[1].toLowerCase().trim();
            const firstWord = term.split(/\s+/)[0];
            const matchIndex = defMatch.index;
            if (stopWords.has(term) || stopWords.has(firstWord)) {
                continue;
            }
            // Check if term was introduced BEFORE this point in text
            const priorText = text.substring(0, matchIndex).toLowerCase();
            const isIntroducedPrior = priorText.includes(`a ${term}`) ||
                priorText.includes(`an ${term}`) ||
                priorText.includes(`one ${term}`) ||
                priorText.includes(`at least one ${term}`) ||
                priorText.includes(`a ${firstWord}`) ||
                priorText.includes(`an ${firstWord}`);
            if (!isIntroducedPrior && !introducedTerms.has(term) && !introducedTerms.has(firstWord)) {
                // Only add unique term warnings
                if (!issues.some((i) => i.term === term)) {
                    issues.push({
                        type: 'MISSING_ANTECEDENT',
                        term,
                        message: `The term "${term}" is referenced with a definite article ("the"/"said") without prior introductory basis ("a"/"an").`,
                        severity: 'WARNING'
                    });
                }
            }
        }
        // Check for vague non-technical adjectives
        const vagueWords = ['effective', 'good', 'cheap', 'best', 'revolutionary', 'optimal', 'smart', 'super'];
        for (const vague of vagueWords) {
            const regex = new RegExp(`\\b${vague}\\b`, 'i');
            if (regex.test(text)) {
                issues.push({
                    type: 'VAGUE_TERM',
                    term: vague,
                    message: `Subjective or promotional term "${vague}" found. Patent claims must use definite technical limitations.`,
                    severity: 'WARNING'
                });
            }
        }
        return {
            valid: !issues.some((i) => i.severity === 'ERROR'),
            issues
        };
    }
    /**
     * Validates a single patent claim.
     */
    static validateClaim(claim) {
        const errors = [];
        const warnings = [];
        if (!claim.claimNumber || claim.claimNumber <= 0 || !Number.isInteger(claim.claimNumber)) {
            errors.push('Claim number must be a positive integer.');
        }
        const type = (claim.claimType || '').toUpperCase();
        if (!['INDEPENDENT', 'DEPENDENT'].includes(type)) {
            errors.push('Claim type must be INDEPENDENT or DEPENDENT.');
        }
        if (type === 'INDEPENDENT' && claim.dependsOnNumber !== null && claim.dependsOnNumber !== undefined) {
            errors.push('Independent claims cannot have a parent claim dependency (dependsOnNumber must be null).');
        }
        if (type === 'DEPENDENT') {
            if (claim.dependsOnNumber === null || claim.dependsOnNumber === undefined) {
                errors.push('Dependent claims must specify a parent claim dependency (dependsOnNumber).');
            }
            else if (claim.dependsOnNumber === claim.claimNumber) {
                errors.push('Claim cannot depend on itself.');
            }
        }
        const body = (claim.body || '').trim();
        if (!body) {
            errors.push('Claim body cannot be empty.');
        }
        const antecedentRes = this.validateAntecedents({ preamble: claim.preamble, body: claim.body });
        for (const issue of antecedentRes.issues) {
            if (issue.severity === 'ERROR') {
                errors.push(issue.message);
            }
            else {
                warnings.push(issue.message);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            antecedentIssues: antecedentRes.issues
        };
    }
    /**
     * Validates a complete AI claim proposal structure.
     */
    static validateProposal(proposal) {
        const errors = [];
        const warnings = [];
        const claimsWithIssues = [];
        if (!proposal || !Array.isArray(proposal.claims) || proposal.claims.length === 0) {
            return {
                valid: false,
                claimCount: 0,
                errors: ['Proposal contains no valid claims list.'],
                warnings: [],
                claimsWithIssues: []
            };
        }
        const tempNums = new Set();
        for (const c of proposal.claims) {
            if (tempNums.has(c.temporaryNumber)) {
                errors.push(`Duplicate temporary claim number ${c.temporaryNumber} in proposal.`);
            }
            tempNums.add(c.temporaryNumber);
        }
        // Validate dependency graph for cycles
        const dependencyList = proposal.claims.map((c) => ({
            claimNumber: c.temporaryNumber,
            dependsOnNumber: c.dependsOnNumber ?? null
        }));
        if (claimService_1.ClaimService.hasDependencyCycle(dependencyList)) {
            errors.push('Claim dependency cycle detected in proposal.');
        }
        for (const c of proposal.claims) {
            const claimVal = this.validateClaim({
                claimNumber: c.temporaryNumber,
                claimType: c.claimType,
                dependsOnNumber: c.dependsOnNumber,
                preamble: c.preamble,
                body: c.body
            });
            if (!claimVal.valid) {
                errors.push(...claimVal.errors.map((e) => `[Claim ${c.temporaryNumber}] ${e}`));
            }
            if (claimVal.warnings.length > 0) {
                warnings.push(...claimVal.warnings.map((w) => `[Claim ${c.temporaryNumber}] ${w}`));
            }
            if (claimVal.antecedentIssues.length > 0) {
                claimsWithIssues.push({
                    temporaryNumber: c.temporaryNumber,
                    issues: claimVal.antecedentIssues
                });
            }
        }
        return {
            valid: errors.length === 0,
            claimCount: proposal.claims.length,
            errors,
            warnings,
            claimsWithIssues
        };
    }
    /**
     * Imports an AI proposal transactionally into the project.
     * Remaps temporary numbers to start after existing project claims, preserving dependency trees.
     */
    static async importProposal(projectId, userId, proposal) {
        // 1. Validate proposal structure
        const valResult = this.validateProposal(proposal);
        if (!valResult.valid) {
            throw new Error(`Cannot import invalid proposal: ${valResult.errors.join('; ')}`);
        }
        // 2. Fetch existing claims for project offset
        const existingClaims = await db_1.prisma.patentClaim.findMany({
            where: { projectId },
            select: { claimNumber: true, orderIndex: true }
        });
        const maxClaimNum = existingClaims.reduce((max, c) => Math.max(max, c.claimNumber), 0);
        const maxOrderIndex = existingClaims.reduce((max, c) => Math.max(max, c.orderIndex), -1);
        // 3. Collect valid project drawing components for verification
        const projectComponents = await db_1.prisma.drawingComponent.findMany({
            where: {
                figure: { projectId }
            },
            select: { id: true }
        });
        const validComponentIds = new Set(projectComponents.map((c) => c.id));
        // 4. Build remapped claims and elements
        const remappingMap = new Map();
        proposal.claims.forEach((c) => {
            remappingMap.set(c.temporaryNumber, maxClaimNum + c.temporaryNumber);
        });
        // 5. Execute transactional creation
        return await db_1.prisma.$transaction(async (tx) => {
            const createdClaims = [];
            for (let i = 0; i < proposal.claims.length; i++) {
                const c = proposal.claims[i];
                const newClaimNumber = remappingMap.get(c.temporaryNumber);
                const newDependsOnNumber = c.dependsOnNumber !== null && c.dependsOnNumber !== undefined
                    ? remappingMap.get(c.dependsOnNumber) ?? null
                    : null;
                const claimRecord = await tx.patentClaim.create({
                    data: {
                        projectId,
                        claimNumber: newClaimNumber,
                        claimType: c.claimType,
                        dependsOnNumber: newDependsOnNumber,
                        preamble: (c.preamble || '').trim(),
                        body: (c.body || '').trim(),
                        status: 'DRAFT',
                        orderIndex: maxOrderIndex + 1 + i
                    }
                });
                // Insert elements if provided
                if (Array.isArray(c.elements) && c.elements.length > 0) {
                    for (const el of c.elements) {
                        const elementName = (el.elementName || '').trim();
                        const elementText = (el.elementText || '').trim();
                        if (!elementName || !elementText)
                            continue;
                        const componentId = el.suggestedComponentId && validComponentIds.has(el.suggestedComponentId)
                            ? el.suggestedComponentId
                            : null;
                        await tx.claimElement.create({
                            data: {
                                claimId: claimRecord.id,
                                elementName: elementName.substring(0, 200),
                                elementText,
                                componentId
                            }
                        });
                    }
                }
                createdClaims.push(claimRecord);
            }
            // 6. Log Activity
            await activityService_1.ActivityService.createActivity(projectId, userId, `Imported AI claim proposal with ${createdClaims.length} claims (Claims #${createdClaims[0].claimNumber}–#${createdClaims[createdClaims.length - 1].claimNumber}).`, 'CLAIM', { count: createdClaims.length });
            return createdClaims;
        });
    }
}
exports.ClaimValidationService = ClaimValidationService;
