import { prisma } from '../config/db';
import { PatentClaim, ClaimElement } from '@prisma/client';
import { ActivityService } from './activityService';

export interface CreateClaimInput {
  claimNumber: number;
  claimType: 'INDEPENDENT' | 'DEPENDENT';
  dependsOnNumber?: number | null;
  preamble?: string;
  body: string;
  status?: 'DRAFT' | 'REVIEWED' | 'APPROVED';
  linkedFigures?: string | null;
  orderIndex?: number;
}

export interface UpdateClaimInput {
  claimNumber?: number;
  claimType?: 'INDEPENDENT' | 'DEPENDENT';
  dependsOnNumber?: number | null;
  preamble?: string;
  body?: string;
  status?: 'DRAFT' | 'REVIEWED' | 'APPROVED';
  linkedFigures?: string | null;
  orderIndex?: number;
}

export interface CreateClaimElementInput {
  elementName: string;
  elementText: string;
  componentId?: string | null;
}

export interface UpdateClaimElementInput {
  elementName?: string;
  elementText?: string;
  componentId?: string | null;
}

const componentInclude = {
  select: {
    id: true,
    figureId: true,
    referenceNumber: true,
    componentName: true,
    description: true,
    figure: {
      select: {
        id: true,
        figureNumber: true,
        title: true
      }
    }
  }
};

export class ClaimService {
  /**
   * Cycle detection helper in a claim dependency graph.
   * Each dependent claim has at most one parent dependency (functional directed graph).
   */
  static hasDependencyCycle(
    claims: Array<{ claimNumber: number; dependsOnNumber: number | null }>
  ): boolean {
    const adj = new Map<number, number>();
    for (const c of claims) {
      if (c.dependsOnNumber !== null && c.dependsOnNumber !== undefined) {
        adj.set(c.claimNumber, c.dependsOnNumber);
      }
    }

    for (const startNode of adj.keys()) {
      const visited = new Set<number>();
      let curr: number | undefined = startNode;
      while (curr !== undefined) {
        if (visited.has(curr)) {
          return true; // Cycle detected
        }
        visited.add(curr);
        curr = adj.get(curr);
      }
    }
    return false;
  }

  /**
   * Retrieves all claims for a project ordered by orderIndex asc, claimNumber asc.
   * Includes claim elements with linked drawing component and figure callouts.
   */
  static async getProjectClaims(projectId: string): Promise<PatentClaim[]> {
    return await prisma.patentClaim.findMany({
      where: { projectId },
      orderBy: [
        { orderIndex: 'asc' },
        { claimNumber: 'asc' }
      ],
      include: {
        claimElements: {
          orderBy: { createdAt: 'asc' },
          include: {
            component: componentInclude
          }
        }
      }
    });
  }

  /**
   * Retrieves a single claim by its ID within a specific project.
   */
  static async getClaimById(projectId: string, claimId: string): Promise<PatentClaim> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      include: {
        claimElements: {
          orderBy: { createdAt: 'asc' },
          include: {
            component: componentInclude
          }
        }
      }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    return claim;
  }

  /**
   * Creates a new independent or dependent claim with dependency hierarchy verification.
   */
  static async createClaim(
    projectId: string,
    userId: string,
    input: CreateClaimInput
  ): Promise<PatentClaim> {
    // 1. Validate claimNumber
    const claimNumber = Number(input.claimNumber);
    if (!Number.isInteger(claimNumber) || claimNumber <= 0) {
      throw new Error('Claim number must be a positive integer.');
    }

    // 2. Validate claimType
    const validTypes = ['INDEPENDENT', 'DEPENDENT'];
    const claimType = (input.claimType || '').toUpperCase() as 'INDEPENDENT' | 'DEPENDENT';
    if (!validTypes.includes(claimType)) {
      throw new Error('Invalid claim type. Must be INDEPENDENT or DEPENDENT.');
    }

    // 3. Validate status
    const validStatuses = ['DRAFT', 'REVIEWED', 'APPROVED'];
    const status = input.status ? (input.status.toUpperCase() as any) : 'DRAFT';
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid claim status. Must be DRAFT, REVIEWED, or APPROVED.');
    }

    // 4. Validate body
    const body = (input.body || '').trim();
    if (!body) {
      throw new Error('Claim body cannot be empty.');
    }
    const preamble = (input.preamble || '').trim();

    // 5. Validate dependency semantics
    let dependsOnNumber: number | null = null;
    if (claimType === 'INDEPENDENT') {
      if (input.dependsOnNumber !== null && input.dependsOnNumber !== undefined) {
        throw new Error('Independent claims cannot specify a parent dependency (dependsOnNumber must be null).');
      }
      dependsOnNumber = null;
    } else {
      // DEPENDENT claim
      if (input.dependsOnNumber === null || input.dependsOnNumber === undefined) {
        throw new Error('Dependent claims must specify a parent claim number (dependsOnNumber).');
      }

      dependsOnNumber = Number(input.dependsOnNumber);
      if (!Number.isInteger(dependsOnNumber) || dependsOnNumber <= 0) {
        throw new Error('dependsOnNumber must be a positive integer.');
      }

      if (dependsOnNumber === claimNumber) {
        throw new Error('Claim cannot depend on itself.');
      }
    }

    // 6. Fetch existing project claims for project isolation, duplicate, and parent verification
    const existingClaims = await prisma.patentClaim.findMany({
      where: { projectId },
      select: { claimNumber: true, dependsOnNumber: true, orderIndex: true }
    });

    // 7. Check unique claim number within project
    if (existingClaims.some((c) => c.claimNumber === claimNumber)) {
      throw new Error(`Claim number ${claimNumber} already exists in this project.`);
    }

    // 8. For dependent claims, verify parent existence and graph cycle
    if (claimType === 'DEPENDENT') {
      const parentExists = existingClaims.some((c) => c.claimNumber === dependsOnNumber);
      if (!parentExists) {
        throw new Error(`Referenced parent claim ${dependsOnNumber} does not exist in this project.`);
      }

      // Check for cycles with hypothetical addition
      const hypotheticalGraph = [
        ...existingClaims,
        { claimNumber, dependsOnNumber: dependsOnNumber! }
      ];
      if (this.hasDependencyCycle(hypotheticalGraph)) {
        throw new Error('Claim dependency cycle detected.');
      }
    }

    // 9. Determine orderIndex (defaults to next position)
    let orderIndex = input.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      orderIndex = existingClaims.length;
    }

    // 10. Persist new claim
    const newClaim = await prisma.patentClaim.create({
      data: {
        projectId,
        claimNumber,
        claimType,
        dependsOnNumber,
        preamble,
        body,
        status,
        orderIndex,
        linkedFigures: input.linkedFigures?.trim() || null
      },
      include: {
        claimElements: {
          include: {
            component: componentInclude
          }
        }
      }
    });

    // 11. Audit log
    await ActivityService.createActivity(
      projectId,
      userId,
      `Created ${claimType.toLowerCase()} claim #${claimNumber}.`,
      'CLAIM',
      { claimId: newClaim.id, claimNumber, claimType, dependsOnNumber }
    );

    return newClaim;
  }

  /**
   * Updates an existing claim, preserving ID and validating dependency hierarchy.
   */
  static async updateClaim(
    projectId: string,
    userId: string,
    claimId: string,
    input: UpdateClaimInput
  ): Promise<PatentClaim> {
    const existingClaim = await prisma.patentClaim.findUnique({
      where: { id: claimId }
    });

    if (!existingClaim || existingClaim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    const allProjectClaims = await prisma.patentClaim.findMany({
      where: { projectId },
      select: { id: true, claimNumber: true, dependsOnNumber: true }
    });

    // 1. Validate target claimNumber
    let targetClaimNumber = existingClaim.claimNumber;
    if (input.claimNumber !== undefined && input.claimNumber !== null) {
      targetClaimNumber = Number(input.claimNumber);
      if (!Number.isInteger(targetClaimNumber) || targetClaimNumber <= 0) {
        throw new Error('Claim number must be a positive integer.');
      }

      if (targetClaimNumber !== existingClaim.claimNumber) {
        const duplicate = allProjectClaims.some(
          (c) => c.id !== claimId && c.claimNumber === targetClaimNumber
        );
        if (duplicate) {
          throw new Error(`Claim number ${targetClaimNumber} already exists in this project.`);
        }

        // Check if other claims depend on the old claim number
        const dependentClaims = allProjectClaims.filter(
          (c) => c.id !== claimId && c.dependsOnNumber === existingClaim.claimNumber
        );
        if (dependentClaims.length > 0) {
          const depNums = dependentClaims.map((c) => c.claimNumber).join(', ');
          throw new Error(
            `Cannot change claim number from ${existingClaim.claimNumber} to ${targetClaimNumber} because other claims (${depNums}) depend on it. Update dependent claims first.`
          );
        }
      }
    }

    // 2. Validate target claimType and dependsOnNumber
    let targetClaimType = existingClaim.claimType as 'INDEPENDENT' | 'DEPENDENT';
    if (input.claimType !== undefined) {
      const validTypes = ['INDEPENDENT', 'DEPENDENT'];
      const cType = input.claimType.toUpperCase() as 'INDEPENDENT' | 'DEPENDENT';
      if (!validTypes.includes(cType)) {
        throw new Error('Invalid claim type. Must be INDEPENDENT or DEPENDENT.');
      }
      targetClaimType = cType;
    }

    let targetDependsOn: number | null = existingClaim.dependsOnNumber;
    if (input.dependsOnNumber !== undefined) {
      targetDependsOn = input.dependsOnNumber;
    }

    if (targetClaimType === 'INDEPENDENT') {
      if (targetDependsOn !== null && targetDependsOn !== undefined) {
        throw new Error('Independent claims cannot specify a parent dependency (dependsOnNumber must be null).');
      }
      targetDependsOn = null;
    } else {
      // DEPENDENT claim
      if (targetDependsOn === null || targetDependsOn === undefined) {
        throw new Error('Dependent claims must specify a parent claim number (dependsOnNumber).');
      }

      targetDependsOn = Number(targetDependsOn);
      if (!Number.isInteger(targetDependsOn) || targetDependsOn <= 0) {
        throw new Error('dependsOnNumber must be a positive integer.');
      }

      if (targetDependsOn === targetClaimNumber) {
        throw new Error('Claim cannot depend on itself.');
      }

      const parentExists = allProjectClaims.some(
        (c) => c.id !== claimId && c.claimNumber === targetDependsOn
      );
      if (!parentExists) {
        throw new Error(`Referenced parent claim ${targetDependsOn} does not exist in this project.`);
      }

      // Cycle detection on updated graph
      const updatedGraph = allProjectClaims.map((c) =>
        c.id === claimId
          ? { claimNumber: targetClaimNumber, dependsOnNumber: targetDependsOn }
          : { claimNumber: c.claimNumber, dependsOnNumber: c.dependsOnNumber }
      );
      if (this.hasDependencyCycle(updatedGraph)) {
        throw new Error('Claim dependency cycle detected.');
      }
    }

    // 3. Validate status
    let status = existingClaim.status;
    if (input.status !== undefined) {
      const validStatuses = ['DRAFT', 'REVIEWED', 'APPROVED'];
      const s = input.status.toUpperCase();
      if (!validStatuses.includes(s)) {
        throw new Error('Invalid claim status. Must be DRAFT, REVIEWED, or APPROVED.');
      }
      status = s;
    }

    // 4. Validate body
    let body = existingClaim.body;
    if (input.body !== undefined) {
      const b = input.body.trim();
      if (!b) {
        throw new Error('Claim body cannot be empty.');
      }
      body = b;
    }

    const preamble = input.preamble !== undefined ? input.preamble.trim() : existingClaim.preamble;
    const linkedFigures =
      input.linkedFigures !== undefined
        ? input.linkedFigures?.trim() || null
        : existingClaim.linkedFigures;
    const orderIndex = input.orderIndex !== undefined ? input.orderIndex : existingClaim.orderIndex;

    // 5. Update claim
    const updatedClaim = await prisma.patentClaim.update({
      where: { id: claimId },
      data: {
        claimNumber: targetClaimNumber,
        claimType: targetClaimType,
        dependsOnNumber: targetDependsOn,
        preamble,
        body,
        status,
        orderIndex,
        linkedFigures
      },
      include: {
        claimElements: {
          include: {
            component: componentInclude
          }
        }
      }
    });

    // 6. Audit log
    await ActivityService.createActivity(
      projectId,
      userId,
      `Updated claim #${targetClaimNumber}.`,
      'CLAIM',
      { claimId, claimNumber: targetClaimNumber, claimType: targetClaimType, dependsOnNumber: targetDependsOn }
    );

    return updatedClaim;
  }

  /**
   * Deletes a claim safely. Rejects deletion if other claims depend on it.
   */
  static async deleteClaim(
    projectId: string,
    userId: string,
    claimId: string
  ): Promise<{ success: boolean; deletedClaimId: string; deletedClaimNumber: number }> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    // Check if other claims depend on this claim
    const dependentClaims = await prisma.patentClaim.findMany({
      where: {
        projectId,
        dependsOnNumber: claim.claimNumber
      },
      select: { claimNumber: true }
    });

    if (dependentClaims.length > 0) {
      const depNumbers = dependentClaims.map((c) => c.claimNumber).join(', ');
      throw new Error(
        `Cannot delete claim ${claim.claimNumber} because other claims (${depNumbers}) depend on it. Remove or reassign dependencies first.`
      );
    }

    // Delete claim (Cascade removes ClaimElements)
    await prisma.patentClaim.delete({
      where: { id: claimId }
    });

    // Audit log
    await ActivityService.createActivity(
      projectId,
      userId,
      `Deleted claim #${claim.claimNumber}.`,
      'CLAIM',
      { claimId, claimNumber: claim.claimNumber }
    );

    return {
      success: true,
      deletedClaimId: claimId,
      deletedClaimNumber: claim.claimNumber
    };
  }

  /**
   * Reorders project claims transactionally by updating orderIndex.
   * claimNumber is strictly preserved.
   */
  static async reorderClaims(
    projectId: string,
    userId: string,
    orderedClaimIds: string[]
  ): Promise<PatentClaim[]> {
    if (!Array.isArray(orderedClaimIds) || orderedClaimIds.length === 0) {
      throw new Error('orderedClaimIds must be a non-empty array of claim IDs.');
    }

    // Check duplicates
    if (new Set(orderedClaimIds).size !== orderedClaimIds.length) {
      throw new Error('Duplicate claim IDs provided in reorder request.');
    }

    const projectClaims = await prisma.patentClaim.findMany({
      where: { projectId },
      select: { id: true }
    });

    if (orderedClaimIds.length !== projectClaims.length) {
      throw new Error('Reorder list must contain all claims belonging to the project.');
    }

    const projectClaimIdSet = new Set(projectClaims.map((c) => c.id));
    for (const id of orderedClaimIds) {
      if (!projectClaimIdSet.has(id)) {
        throw new Error('Invalid claim ID or claim belongs to another project.');
      }
    }

    // Execute transactional update of orderIndex
    await prisma.$transaction(
      orderedClaimIds.map((id, index) =>
        prisma.patentClaim.update({
          where: { id },
          data: { orderIndex: index }
        })
      )
    );

    // Audit log
    await ActivityService.createActivity(
      projectId,
      userId,
      'Reordered project claims hierarchy.',
      'CLAIM',
      { count: orderedClaimIds.length }
    );

    return await this.getProjectClaims(projectId);
  }

  /**
   * Helper to validate that a claim belongs to a project before sub-element linkage.
   */
  static async validateClaimOwnership(claimId: string, projectId: string): Promise<boolean> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { projectId: true }
    });
    return claim?.projectId === projectId;
  }

  // =========================================================================
  // CLAIM ELEMENT MANAGEMENT & DRAWING COMPONENT LINKING (STEP 3)
  // =========================================================================

  /**
   * Retrieves all technical elements for a given claim.
   */
  static async getClaimElements(projectId: string, claimId: string): Promise<ClaimElement[]> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { id: true, projectId: true }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    return await prisma.claimElement.findMany({
      where: { claimId },
      orderBy: { createdAt: 'asc' },
      include: {
        component: componentInclude
      }
    });
  }

  /**
   * Creates a new technical element for a specific claim.
   */
  static async createClaimElement(
    projectId: string,
    claimId: string,
    userId: string,
    input: CreateClaimElementInput
  ): Promise<ClaimElement> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { id: true, projectId: true, claimNumber: true }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    const elementName = (input.elementName || '').trim();
    if (!elementName) {
      throw new Error('Element name is required and cannot be empty.');
    }
    if (elementName.length > 200) {
      throw new Error('Element name cannot exceed 200 characters.');
    }

    const elementText = (input.elementText || '').trim();
    if (!elementText) {
      throw new Error('Element text is required and cannot be empty.');
    }

    let validComponentId: string | null = null;
    if (input.componentId) {
      const comp = await prisma.drawingComponent.findUnique({
        where: { id: input.componentId },
        include: {
          figure: {
            select: { projectId: true }
          }
        }
      });

      if (!comp || comp.figure.projectId !== projectId) {
        throw new Error('Drawing component not found or belongs to another project.');
      }
      validComponentId = comp.id;
    }

    const newElement = await prisma.claimElement.create({
      data: {
        claimId,
        elementName,
        elementText,
        componentId: validComponentId
      },
      include: {
        component: componentInclude
      }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Added technical element "${elementName}" to claim #${claim.claimNumber}.`,
      'CLAIM',
      { claimId, elementId: newElement.id, elementName, componentId: validComponentId }
    );

    return newElement;
  }

  /**
   * Updates an existing claim element.
   */
  static async updateClaimElement(
    projectId: string,
    claimId: string,
    elementId: string,
    userId: string,
    input: UpdateClaimElementInput
  ): Promise<ClaimElement> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { id: true, projectId: true, claimNumber: true }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    const existingElement = await prisma.claimElement.findUnique({
      where: { id: elementId }
    });

    if (!existingElement || existingElement.claimId !== claimId) {
      throw new Error('Claim element not found or does not belong to this claim.');
    }

    let elementName = existingElement.elementName;
    if (input.elementName !== undefined) {
      elementName = input.elementName.trim();
      if (!elementName) {
        throw new Error('Element name is required and cannot be empty.');
      }
      if (elementName.length > 200) {
        throw new Error('Element name cannot exceed 200 characters.');
      }
    }

    let elementText = existingElement.elementText;
    if (input.elementText !== undefined) {
      elementText = input.elementText.trim();
      if (!elementText) {
        throw new Error('Element text is required and cannot be empty.');
      }
    }

    let targetComponentId = existingElement.componentId;
    if (input.componentId !== undefined) {
      if (input.componentId === null) {
        targetComponentId = null;
      } else {
        const comp = await prisma.drawingComponent.findUnique({
          where: { id: input.componentId },
          include: {
            figure: {
              select: { projectId: true }
            }
          }
        });

        if (!comp || comp.figure.projectId !== projectId) {
          throw new Error('Drawing component not found or belongs to another project.');
        }
        targetComponentId = comp.id;
      }
    }

    const updatedElement = await prisma.claimElement.update({
      where: { id: elementId },
      data: {
        elementName,
        elementText,
        componentId: targetComponentId
      },
      include: {
        component: componentInclude
      }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Updated technical element "${elementName}" on claim #${claim.claimNumber}.`,
      'CLAIM',
      { claimId, elementId, elementName, componentId: targetComponentId }
    );

    return updatedElement;
  }

  /**
   * Deletes a claim element.
   */
  static async deleteClaimElement(
    projectId: string,
    claimId: string,
    elementId: string,
    userId: string
  ): Promise<{ success: boolean; deletedElementId: string }> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { id: true, projectId: true, claimNumber: true }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    const existingElement = await prisma.claimElement.findUnique({
      where: { id: elementId }
    });

    if (!existingElement || existingElement.claimId !== claimId) {
      throw new Error('Claim element not found or does not belong to this claim.');
    }

    await prisma.claimElement.delete({
      where: { id: elementId }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Deleted technical element "${existingElement.elementName}" from claim #${claim.claimNumber}.`,
      'CLAIM',
      { claimId, elementId }
    );

    return {
      success: true,
      deletedElementId: elementId
    };
  }

  /**
   * Links a claim element to a specific drawing component within the same project.
   */
  static async linkClaimElementToComponent(
    projectId: string,
    claimId: string,
    elementId: string,
    userId: string,
    componentId: string
  ): Promise<ClaimElement> {
    if (!componentId || !componentId.trim()) {
      throw new Error('Drawing component ID is required.');
    }

    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { id: true, projectId: true, claimNumber: true }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    const existingElement = await prisma.claimElement.findUnique({
      where: { id: elementId }
    });

    if (!existingElement || existingElement.claimId !== claimId) {
      throw new Error('Claim element not found or does not belong to this claim.');
    }

    const comp = await prisma.drawingComponent.findUnique({
      where: { id: componentId },
      include: {
        figure: {
          select: { projectId: true, figureNumber: true, title: true }
        }
      }
    });

    if (!comp || comp.figure.projectId !== projectId) {
      throw new Error('Drawing component not found or belongs to another project.');
    }

    const updated = await prisma.claimElement.update({
      where: { id: elementId },
      data: { componentId: comp.id },
      include: {
        component: componentInclude
      }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Linked element "${existingElement.elementName}" to drawing component [${comp.referenceNumber}] ${comp.componentName}.`,
      'CLAIM',
      { claimId, elementId, componentId: comp.id, referenceNumber: comp.referenceNumber }
    );

    return updated;
  }

  /**
   * Unlinks drawing component from a claim element.
   */
  static async unlinkClaimElementFromComponent(
    projectId: string,
    claimId: string,
    elementId: string,
    userId: string
  ): Promise<ClaimElement> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      select: { id: true, projectId: true, claimNumber: true }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    const existingElement = await prisma.claimElement.findUnique({
      where: { id: elementId }
    });

    if (!existingElement || existingElement.claimId !== claimId) {
      throw new Error('Claim element not found or does not belong to this claim.');
    }

    const updated = await prisma.claimElement.update({
      where: { id: elementId },
      data: { componentId: null },
      include: {
        component: componentInclude
      }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Unlinked drawing component from element "${existingElement.elementName}".`,
      'CLAIM',
      { claimId, elementId }
    );

    return updated;
  }

  /**
   * Synchronizes structured PatentClaim records to the IPO Form 2 specification claims schedule.
   */
  static async syncClaimsToForm2(
    projectId: string,
    userId: string
  ): Promise<{ success: boolean; claimsCount: number; formattedClaimsText: string; formId: string }> {
    const claims = await prisma.patentClaim.findMany({
      where: { projectId },
      orderBy: [
        { orderIndex: 'asc' },
        { claimNumber: 'asc' }
      ]
    });

    if (claims.length === 0) {
      throw new Error('No structured claims exist for this project to sync.');
    }

    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    const formattedClaimsList = claims.map((c) => {
      let claimHeader = `${c.claimNumber}. `;
      if (c.preamble && c.preamble.trim()) {
        claimHeader += `${c.preamble.trim()} `;
      } else if (c.claimType === 'DEPENDENT' && c.dependsOnNumber) {
        claimHeader += `The system of claim ${c.dependsOnNumber}, wherein `;
      }
      return `${claimHeader}${c.body.trim()}`;
    });

    const formattedClaimsText = formattedClaimsList.join('\n\n');

    // Find existing Form 2
    const existingForm = await prisma.patentForm.findFirst({
      where: { projectId, formType: 'Form 2' }
    });

    let targetForm;
    if (existingForm) {
      const currentData = (existingForm.formData as any) || {};
      targetForm = await prisma.patentForm.update({
        where: { id: existingForm.id },
        data: {
          formData: {
            ...currentData,
            claimsCount: claims.length,
            claimsText: formattedClaimsText
          }
        }
      });
    } else {
      targetForm = await prisma.patentForm.create({
        data: {
          projectId,
          formType: 'Form 2',
          status: 'DRAFT',
          formData: {
            specificationType: 'COMPLETE',
            title: project.title,
            preamble: 'The following specification particularly describes the invention and the manner in which it is to be performed.',
            abstract: project.innovationIdea || '',
            problemStatement: project.problemStatement || '',
            proposedSolution: project.proposedSolution || '',
            novelFeatures: project.novelFeatures || '',
            claimsCount: claims.length,
            claimsText: formattedClaimsText
          }
        }
      });
    }

    await ActivityService.createActivity(
      projectId,
      userId,
      `Synchronized ${claims.length} structured claims to IPO Form 2 Claims Schedule.`,
      'CLAIM',
      { claimsCount: claims.length, formId: targetForm.id }
    );

    return {
      success: true,
      claimsCount: claims.length,
      formattedClaimsText,
      formId: targetForm.id
    };
  }
}
