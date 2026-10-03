"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadlineService = void 0;
const db_1 = require("../config/db");
class DeadlineService {
    /**
     * Automatically calculates and synchronizes statutory Indian patent deadlines
     * based on recorded filing events (Section 9(1) and Section 11B of the Patents Act, 1970).
     */
    static async syncProjectDeadlines(projectId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                filingEvents: true,
                deadlines: true,
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const now = new Date();
        // 1. Check for Provisional Filing Event
        const provisionalEvent = project.filingEvents.find((e) => e.eventType === 'PROVISIONAL_FILING');
        if (provisionalEvent) {
            const provisionalDate = new Date(provisionalEvent.filingDate);
            const completeDueDate = new Date(provisionalDate);
            completeDueDate.setMonth(completeDueDate.getMonth() + 12); // Exactly 12 months under Section 9(1)
            let status = 'PENDING';
            const daysUntilDue = Math.ceil((completeDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) {
                status = 'OVERDUE';
            }
            else if (daysUntilDue <= 60) {
                status = 'APPROACHING';
            }
            const existingDeadline = project.deadlines.find((d) => d.deadlineType === 'COMPLETE_SPECIFICATION_FILING');
            if (existingDeadline) {
                await db_1.prisma.deadline.update({
                    where: { id: existingDeadline.id },
                    data: {
                        dueDate: completeDueDate,
                        status,
                        referenceEvent: 'PROVISIONAL_FILING',
                        description: `Complete specification must be filed within 12 months of provisional application (${daysUntilDue} days remaining).`,
                    },
                });
            }
            else {
                await db_1.prisma.deadline.create({
                    data: {
                        projectId,
                        deadlineType: 'COMPLETE_SPECIFICATION_FILING',
                        referenceEvent: 'PROVISIONAL_FILING',
                        dueDate: completeDueDate,
                        status,
                        description: `Statutory 12-month complete specification deadline under Section 9(1) of the Indian Patents Act, 1970.`,
                    },
                });
            }
        }
        // Refresh and update status for all existing deadlines
        const allDeadlines = await db_1.prisma.deadline.findMany({
            where: { projectId },
            orderBy: { dueDate: 'asc' },
        });
        for (const d of allDeadlines) {
            if (d.status !== 'MET') {
                const diffDays = Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                let computedStatus = d.status;
                if (diffDays < 0)
                    computedStatus = 'OVERDUE';
                else if (diffDays <= 60)
                    computedStatus = 'APPROACHING';
                else
                    computedStatus = 'PENDING';
                if (computedStatus !== d.status) {
                    await db_1.prisma.deadline.update({
                        where: { id: d.id },
                        data: { status: computedStatus },
                    });
                }
            }
        }
        return await db_1.prisma.deadline.findMany({
            where: { projectId },
            orderBy: { dueDate: 'asc' },
        });
    }
    /**
     * Records a formal filing event and triggers automatic deadline computation.
     */
    static async recordFilingEvent(projectId, data) {
        const event = await db_1.prisma.filingEvent.create({
            data: {
                projectId,
                eventType: data.eventType,
                filingDate: data.filingDate || new Date(),
                applicationNumber: data.applicationNumber,
                cbrNumber: data.cbrNumber,
                description: data.description,
                createdBy: data.createdBy,
            },
        });
        // If provisional was filed, ensure project specification type is set to PROVISIONAL
        if (data.eventType === 'PROVISIONAL_FILING') {
            await db_1.prisma.patentProject.update({
                where: { id: projectId },
                data: { specificationType: 'PROVISIONAL' },
            });
        }
        await this.syncProjectDeadlines(projectId);
        return event;
    }
}
exports.DeadlineService = DeadlineService;
