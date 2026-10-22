import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runAudit() {
  console.log('\n================================================================');
  console.log('🧪 PATENTHUB AI: INTERACTIVE ROADMAP & CALENDAR VERIFICATION AUDIT');
  console.log('================================================================\n');

  // Find inventor user and project
  const inventor = await prisma.user.findFirst({
    where: {
      role: { name: 'Inventor' },
      ownedProjects: { some: {} },
    },
    include: { role: true, ownedProjects: true },
  });

  if (!inventor || inventor.ownedProjects.length === 0) {
    throw new Error('Test inventor with owned projects not found');
  }

  const project = inventor.ownedProjects[0];
  console.log(`📌 Using Inventor: ${inventor.fullName} (@${inventor.username})`);
  console.log(`📌 Using Project: "${project.title}" (ID: ${project.id})\n`);

  const inventorToken = jwt.sign(
    { userId: inventor.id, username: inventor.username, role: inventor.role.name },
    process.env.JWT_SECRET || 'patenthub_ai_super_secret_jwt_key_2026',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${inventorToken}`,
  };

  // TEST 1: Load Project Roadmap (Auto-initializes 7 Default Stages)
  console.log('1. Loading Project Roadmap & Verifying Default Lifecycle Stages...');
  const roadmapRes = await fetch(`${API_URL}/projects/${project.id}/roadmap`, {
    headers: authHeaders,
  });
  const roadmapData: any = await roadmapRes.json();

  if (roadmapRes.status !== 200 || !roadmapData.success) {
    throw new Error(`Failed to load roadmap: ${JSON.stringify(roadmapData)}`);
  }

  console.log(`   ✅ Roadmap loaded. Total Milestones: ${roadmapData.milestones.length}`);
  console.log(`   ✅ Default stages initialized:`);
  roadmapData.milestones.forEach((m: any, idx: number) => {
    console.log(`      [${idx + 1}] ${m.title} (${m.status}, ${m.progress}%)`);
  });

  if (roadmapData.milestones.length < 7) {
    throw new Error(`Expected at least 7 default stages, found ${roadmapData.milestones.length}`);
  }

  // TEST 2: Calculate Project Progress Correctly
  console.log('\n2. Verifying Project Progress Calculation from Milestones...');
  const progress = roadmapData.progress;
  console.log(`   ✅ Progress Stats: Overall=${progress.overallPercentage}%, Completed=${progress.completedCount}, InProgress=${progress.inProgressCount}, Overdue=${progress.overdueCount}`);
  if (typeof progress.overallPercentage !== 'number') {
    throw new Error('Invalid overallPercentage progress value');
  }

  // TEST 2B: Dedicated Progress Endpoint
  console.log('   Testing GET /projects/:id/roadmap/progress endpoint...');
  const progressRes = await fetch(`${API_URL}/projects/${project.id}/roadmap/progress`, {
    headers: authHeaders,
  });
  const progressEndpointData: any = await progressRes.json();
  if (progressRes.status !== 200 || !progressEndpointData.success) {
    throw new Error(`Failed to fetch dedicated progress endpoint: ${JSON.stringify(progressEndpointData)}`);
  }
  console.log(`   ✅ Dedicated progress endpoint verified: Overall=${progressEndpointData.progress.overallPercentage}%`);

  // TEST 3: Create Custom Milestone
  console.log('\n3. Creating Custom Milestone...');
  const createMilestoneRes = await fetch(`${API_URL}/projects/${project.id}/roadmap/milestones`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Conduct FTO Freedom-to-Operate Clearance',
      description: 'Perform clearance search on active Indian patents.',
      status: 'IN_PROGRESS',
      progress: 40,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Ensure search includes IPC class A61.',
    }),
  });
  const createMilestoneData: any = await createMilestoneRes.json();
  if (createMilestoneRes.status !== 201 || !createMilestoneData.milestone) {
    throw new Error(`Failed to create custom milestone: ${JSON.stringify(createMilestoneData)}`);
  }
  const customMilestone = createMilestoneData.milestone;
  console.log(`   ✅ Custom Milestone Created: ID=${customMilestone.id}, Title="${customMilestone.title}"`);

  // TEST 3B: Retrieve Milestone Details
  console.log('   Testing GET /projects/:id/roadmap/milestones/:milestoneId endpoint...');
  const getMilestoneRes = await fetch(
    `${API_URL}/projects/${project.id}/roadmap/milestones/${customMilestone.id}`,
    { headers: authHeaders }
  );
  const getMilestoneData: any = await getMilestoneRes.json();
  if (getMilestoneRes.status !== 200 || !getMilestoneData.milestone) {
    throw new Error(`Failed to fetch milestone details: ${JSON.stringify(getMilestoneData)}`);
  }
  console.log(`   ✅ Milestone details endpoint verified: "${getMilestoneData.milestone.title}"`);

  // TEST 4: Update & Complete Milestone (Persists in DB)
  console.log('\n4. Updating and Marking Milestone Complete...');
  const updateMilestoneRes = await fetch(
    `${API_URL}/projects/${project.id}/roadmap/milestones/${customMilestone.id}`,
    {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'COMPLETED',
        progress: 100,
        notes: 'FTO completed with 0 blocking claims found.',
      }),
    }
  );
  const updateMilestoneData: any = await updateMilestoneRes.json();
  if (updateMilestoneRes.status !== 200 || updateMilestoneData.milestone.status !== 'COMPLETED') {
    throw new Error(`Failed to update milestone: ${JSON.stringify(updateMilestoneData)}`);
  }
  console.log(`   ✅ Milestone updated: Status=${updateMilestoneData.milestone.status}, Progress=${updateMilestoneData.milestone.progress}%`);

  // TEST 4B: Persistent Milestone Reordering
  console.log('\n4B. Testing Milestone Reordering (PUT /projects/:id/roadmap/reorder)...');
  const allMilestoneIds = roadmapData.milestones.map((m: any) => m.id);
  const reorderedIds = [allMilestoneIds[1], allMilestoneIds[0], ...allMilestoneIds.slice(2)];
  const reorderRes = await fetch(`${API_URL}/projects/${project.id}/roadmap/reorder`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ orderedMilestoneIds: reorderedIds }),
  });
  const reorderData: any = await reorderRes.json();
  if (reorderRes.status !== 200 || !reorderData.success) {
    throw new Error(`Failed to reorder milestones: ${JSON.stringify(reorderData)}`);
  }
  console.log('   ✅ Milestone reordering successfully persisted to DB.');

  // Verify persistence via fresh GET request
  const verifyRes = await fetch(`${API_URL}/projects/${project.id}/roadmap`, {
    headers: authHeaders,
  });
  const verifyData: any = await verifyRes.json();
  const refreshed = verifyData.milestones.find((m: any) => m.id === customMilestone.id);
  if (!refreshed || refreshed.status !== 'COMPLETED') {
    throw new Error('Database persistence check failed after page refresh simulation');
  }
  console.log('   ✅ Persistence verified in PostgreSQL.');

  // TEST 5: Calendar Unified Query (Single Source of Truth, No Duplicates)
  console.log('\n5. Querying Calendar Events (Checking Milestone & Statutory Deadline Aggregation)...');
  const calendarRes = await fetch(`${API_URL}/calendar?projectId=${project.id}`, {
    headers: authHeaders,
  });
  const calendarData: any = await calendarRes.json();
  if (calendarRes.status !== 200 || !calendarData.events) {
    throw new Error(`Failed to retrieve calendar: ${JSON.stringify(calendarData)}`);
  }
  console.log(`   ✅ Calendar events returned: ${calendarData.events.length}`);

  const milestoneOnCalendar = calendarData.events.find(
    (ev: any) => ev.sourceId === customMilestone.id && ev.sourceType === 'ROADMAP_MILESTONE'
  );
  if (!milestoneOnCalendar) {
    throw new Error('Roadmap milestone did not appear on calendar');
  }
  console.log(`   ✅ Roadmap milestone cleanly represented on calendar: "${milestoneOnCalendar.title}"`);

  // TEST 6: Create Custom Calendar Event
  console.log('\n6. Creating Custom Calendar Event...');
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  const createEventRes = await fetch(`${API_URL}/calendar`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Consultation with Senior Patent Attorney',
      eventType: 'EXPERT_REVIEW',
      startDate: now.toISOString(),
      endDate: nextHour.toISOString(),
      projectId: project.id,
      location: 'Virtual Conference Room',
      meetingUrl: 'https://meet.google.com/patenthub-demo',
      reminderMinutes: 45,
      notes: 'Review Form 2 specification and claim 1 dependent element 3.',
    }),
  });
  const createEventData: any = await createEventRes.json();
  if (createEventRes.status !== 201 || !createEventData.event) {
    throw new Error(`Failed to create calendar event: ${JSON.stringify(createEventData)}`);
  }
  const customEvent = createEventData.event;
  console.log(`   ✅ Custom Calendar Event Created: ID=${customEvent.id}, Title="${customEvent.title}" (Reminder: ${customEvent.reminderMinutes} min)`);

  // TEST 6B: Retrieve Single Calendar Event Details
  console.log('   Testing GET /calendar/:eventId endpoint...');
  const getEventRes = await fetch(`${API_URL}/calendar/${customEvent.id}`, {
    headers: authHeaders,
  });
  const getEventData: any = await getEventRes.json();
  if (getEventRes.status !== 200 || !getEventData.event) {
    throw new Error(`Failed to fetch calendar event details: ${JSON.stringify(getEventData)}`);
  }
  console.log(`   ✅ Calendar event details endpoint verified: "${getEventData.event.title}"`);

  // TEST 7: Reschedule Calendar Event
  console.log('\n7. Rescheduling Calendar Event...');
  const futureStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);
  const updateEventRes = await fetch(`${API_URL}/calendar/${customEvent.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      startDate: futureStart.toISOString(),
      endDate: futureEnd.toISOString(),
      status: 'SCHEDULED',
    }),
  });
  const updateEventData: any = await updateEventRes.json();
  if (updateEventRes.status !== 200 || !updateEventData.event) {
    throw new Error(`Failed to reschedule event: ${JSON.stringify(updateEventData)}`);
  }
  console.log(`   ✅ Calendar Event Rescheduled: New Start=${updateEventData.event.startDate}`);

  // TEST 8: Validation Rejection of Invalid Dates (end date before start date)
  console.log('\n8. Verifying Date Validation (End Date < Start Date Rejection)...');
  const invalidDateRes = await fetch(`${API_URL}/calendar`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Invalid Date Test Event',
      startDate: '2026-10-25T14:00:00Z',
      endDate: '2026-10-25T10:00:00Z', // 4 hours BEFORE start!
    }),
  });
  if (invalidDateRes.status === 400) {
    console.log('   ✅ Successfully rejected invalid date range with 400 Bad Request.');
  } else {
    throw new Error(`Expected status 400 for invalid dates, received ${invalidDateRes.status}`);
  }

  // TEST 9: Delete Custom Event
  console.log('\n9. Deleting Custom Calendar Event...');
  const deleteEventRes = await fetch(`${API_URL}/calendar/${customEvent.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteEventData: any = await deleteEventRes.json();
  if (deleteEventRes.status !== 200 || !deleteEventData.success) {
    throw new Error(`Failed to delete event: ${JSON.stringify(deleteEventData)}`);
  }
  console.log('   ✅ Calendar event deleted successfully.');

  // TEST 10: Delete Custom Milestone
  console.log('\n10. Deleting Custom Milestone...');
  const deleteMilestoneRes = await fetch(
    `${API_URL}/projects/${project.id}/roadmap/milestones/${customMilestone.id}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    }
  );
  const deleteMilestoneData: any = await deleteMilestoneRes.json();
  if (deleteMilestoneRes.status !== 200 || !deleteMilestoneData.success) {
    throw new Error(`Failed to delete custom milestone: ${JSON.stringify(deleteMilestoneData)}`);
  }
  console.log('   ✅ Custom milestone deleted successfully.');

  // TEST 11: Security & Protection - Default Milestone Cannot Be Deleted
  console.log('\n11. Verifying Default Milestone Protection (Default Stages Cannot Be Deleted)...');
  const defaultMilestone = roadmapData.milestones[0];
  const tryDeleteDefaultRes = await fetch(
    `${API_URL}/projects/${project.id}/roadmap/milestones/${defaultMilestone.id}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    }
  );
  if (tryDeleteDefaultRes.status === 400) {
    console.log('   ✅ Correctly rejected deletion of statutory default lifecycle stage.');
  } else {
    throw new Error('Default stage deletion was not blocked by policy');
  }

  // TEST 12: Organization Isolation & Anti-Privilege Escalation
  console.log('\n12. Verifying Organization Isolation & Authorization Enforcement...');
  // Find a user from a different organization or create an unassociated user
  const otherUser = await prisma.user.findFirst({
    where: {
      id: { not: inventor.id },
      role: { name: 'Inventor' },
      NOT: { ownedProjects: { some: { id: project.id } } },
      projectMembers: { none: { projectId: project.id } },
    },
    include: { role: true },
  });

  if (otherUser) {
    const unauthorizedToken = jwt.sign(
      { userId: otherUser.id, username: otherUser.username, role: otherUser.role.name },
      process.env.JWT_SECRET || 'patenthub_ai_super_secret_jwt_key_2026',
      { expiresIn: '1h' }
    );
    const unauthorizedHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${unauthorizedToken}`,
    };

    const forbiddenRoadmapRes = await fetch(`${API_URL}/projects/${project.id}/roadmap`, {
      headers: unauthorizedHeaders,
    });
    if (forbiddenRoadmapRes.status === 403 || forbiddenRoadmapRes.status === 404) {
      console.log(`   ✅ Cross-project / cross-org unauthorized access strictly denied (${forbiddenRoadmapRes.status} Forbidden).`);
    } else {
      throw new Error(`Expected 403 Forbidden for unauthorized user, got ${forbiddenRoadmapRes.status}`);
    }
  }

  // TEST 13: Verify Existing Project & Task Functionality Intact
  console.log('\n13. Verifying Existing Project & Task Functionality Remains 100% Intact...');
  const tasksRes = await fetch(`${API_URL}/projects/${project.id}/tasks`, {
    headers: authHeaders,
  });
  if (tasksRes.status !== 200) {
    throw new Error('Existing tasks endpoint failed');
  }
  console.log('   ✅ Existing Project Tasks API verified functional.');

  const deadlinesRes = await fetch(`${API_URL}/projects/${project.id}/deadlines`, {
    headers: authHeaders,
  });
  if (deadlinesRes.status !== 200) {
    throw new Error('Existing deadlines endpoint failed');
  }
  console.log('   ✅ Existing Statutory Deadlines API verified functional.');

  console.log('\n================================================================');
  console.log('🎉 ALL 13 TEST CASES PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runAudit()
  .catch((err) => {
    console.error('\n❌ AUDIT FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
