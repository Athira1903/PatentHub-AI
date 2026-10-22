-- CreateTable
CREATE TABLE "RoadmapMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stageKey" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assignedToId" TEXT,
    "dependencyMilestoneId" TEXT,
    "taskId" TEXT,
    "deadlineId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "meetingUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "reminderMinutes" INTEGER,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "milestoneId" TEXT,
    "taskId" TEXT,
    "organizationId" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoadmapMilestone_projectId_orderIndex_idx" ON "RoadmapMilestone"("projectId", "orderIndex");
CREATE INDEX "RoadmapMilestone_projectId_status_idx" ON "RoadmapMilestone"("projectId", "status");
CREATE INDEX "RoadmapMilestone_assignedToId_idx" ON "RoadmapMilestone"("assignedToId");

-- CreateIndex
CREATE INDEX "CalendarEvent_projectId_startDate_idx" ON "CalendarEvent"("projectId", "startDate");
CREATE INDEX "CalendarEvent_createdById_startDate_idx" ON "CalendarEvent"("createdById", "startDate");
CREATE INDEX "CalendarEvent_organizationId_idx" ON "CalendarEvent"("organizationId");
CREATE INDEX "CalendarEvent_eventType_idx" ON "CalendarEvent"("eventType");

-- AddForeignKey
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PatentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_dependencyMilestoneId_fkey" FOREIGN KEY ("dependencyMilestoneId") REFERENCES "RoadmapMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PatentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "RoadmapMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
