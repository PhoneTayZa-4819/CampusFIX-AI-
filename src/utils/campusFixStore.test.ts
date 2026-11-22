import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE, ASSETS } from '../data/seedData';
import {
  assignTechnicianInState,
  classifyIssueInput,
  computeAnalyticsData,
  computeKpis,
  computeTeamWorkload,
  createTicketInState,
  filterTickets,
  getTrackingSteps,
  updateTicketStatusInState,
  validateNewReportInput,
} from './campusFixStore';

test('classifyIssueInput returns accurate HVAC analysis for Leaking AC sample', () => {
  const result = classifyIssueInput({
    sampleId: 'sample-ac',
    building: 'Science Hall',
    room: 'Room A302',
    description: 'AC leaking water',
  });
  assert.equal(result.category, 'HVAC');
  assert.equal(result.suggestedPriority, 'High');
  assert.equal(result.confidence, 96);
  assert.match(result.classification, /Air Conditioner/i);
});

test('classifyIssueInput classifies free-text electrical issue accurately', () => {
  const result = classifyIssueInput({
    building: 'North Hall',
    room: 'Room 312',
    description: 'Ceiling fluorescent bulb is flickering constantly near the whiteboard.',
  });
  assert.equal(result.category, 'Electrical');
  assert.equal(result.suggestedPriority, 'Medium');
  assert.ok(result.confidence >= 90);
});

test('validateNewReportInput enforces required building, room, and description', () => {
  assert.ok(validateNewReportInput({ building: '', room: 'Room 101', description: 'Valid issue text' }));
  assert.ok(validateNewReportInput({ building: 'North Hall', room: '', description: 'Valid issue text' }));
  assert.ok(validateNewReportInput({ building: 'North Hall', room: '204', description: 'short' }));
  assert.equal(
    validateNewReportInput({
      building: 'North Hall',
      room: 'Room 204',
      description: 'Water dripping near entrance',
    }),
    null,
  );
});

test('end-to-end connected flow: student submit -> staff assign -> staff resolve updates KPIs and 5-step timeline', () => {
  const beforeKpis = computeKpis(INITIAL_STATE);
  const fixedNow = new Date('2026-11-22T12:00:00Z');

  // 1. Student submits new report
  const { nextState: afterSubmit, createdTicket } = createTicketInState(
    INITIAL_STATE,
    {
      title: 'Broken / Leaking Air Conditioner',
      description: 'Water dripping down wall below AC unit in Room A302.',
      building: 'Science Hall',
      room: 'Room A302',
      category: 'HVAC',
      categoryDisplay: 'HVAC (Air Conditioning)',
      priority: 'High',
      confidenceScore: 96,
      beforePhoto: ASSETS.acLeakBefore,
    },
    fixedNow,
  );

  assert.equal(afterSubmit.tickets[0].id, createdTicket.id);
  const afterSubmitKpis = computeKpis(afterSubmit);
  assert.equal(afterSubmitKpis.studentTotal, beforeKpis.studentTotal + 1);
  assert.equal(afterSubmitKpis.studentInProgress, beforeKpis.studentInProgress + 1);
  assert.equal(afterSubmitKpis.opsHighPriority, beforeKpis.opsHighPriority + 1);

  const stepsAfterSubmit = getTrackingSteps(afterSubmit.tickets[0]);
  assert.equal(stepsAfterSubmit.filter((s) => s.completed).length, 2); // Submitted + AI Analyzed

  // 2. Staff assigns Jordan Mills
  const workloadBefore = computeTeamWorkload(afterSubmit.tickets).find(
    (t) => t.name === 'Jordan Mills',
  )!;

  const afterAssign = assignTechnicianInState(
    afterSubmit,
    {
      ticketId: createdTicket.id,
      technicianName: 'Jordan Mills',
      priority: 'High',
      dueBy: 'Today, 5:00 PM',
    },
    fixedNow,
  );

  const assignedTicket = afterAssign.tickets.find((t) => t.id === createdTicket.id)!;
  assert.equal(assignedTicket.assignedTo, 'Jordan Mills');
  assert.equal(assignedTicket.status, 'Assigned');
  assert.equal(getTrackingSteps(assignedTicket).filter((s) => s.completed).length, 3);

  const workloadAfter = computeTeamWorkload(afterAssign.tickets).find(
    (t) => t.name === 'Jordan Mills',
  )!;
  assert.equal(workloadAfter.activeTickets, workloadBefore.activeTickets + 1);

  // 3. Staff updates status to Resolved with technician note
  const afterResolve = updateTicketStatusInState(
    afterAssign,
    {
      ticketId: createdTicket.id,
      status: 'Resolved',
      note: 'Cleared drain line and tested cooling.',
    },
    fixedNow,
  );

  const resolvedTicket = afterResolve.tickets.find((t) => t.id === createdTicket.id)!;
  assert.equal(resolvedTicket.status, 'Resolved');
  assert.ok(resolvedTicket.afterPhoto);
  assert.equal(getTrackingSteps(resolvedTicket).filter((s) => s.completed).length, 5);
  assert.equal(
    resolvedTicket.technicianUpdates[resolvedTicket.technicianUpdates.length - 1].message,
    'Cleared drain line and tested cooling.',
  );

  const afterResolveKpis = computeKpis(afterResolve);
  assert.equal(afterResolveKpis.studentResolved, beforeKpis.studentResolved + 1);
  assert.equal(afterResolveKpis.studentInProgress, beforeKpis.studentInProgress);
});

test('filterTickets and computeAnalyticsData return consistent results', () => {
  const highOnly = filterTickets(INITIAL_STATE.tickets, 'High');
  assert.ok(highOnly.length > 0);
  assert.ok(highOnly.every((t) => t.priority === 'High'));

  const searchScience = filterTickets(INITIAL_STATE.tickets, 'All', 'Science Hall');
  assert.ok(searchScience.length > 0);
  assert.ok(searchScience.every((t) => t.building === 'Science Hall'));

  const analytics = computeAnalyticsData(INITIAL_STATE);
  assert.equal(analytics.categories.length, 6);
  assert.equal(analytics.buildingPerformance.length, 5);
  assert.ok(analytics.workloadTotal > 0);
});
