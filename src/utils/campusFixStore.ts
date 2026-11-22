import {
  AiAnalysisResult,
  CampusFixState,
  IssueCategory,
  IssuePriority,
  MaintenanceTicket,
  RepairVerification,
  StudentNotification,
  TicketStatus,
  TrackingStep,
} from '../types/campusFix';
import {
  ASSETS,
  INITIAL_STATE,
  SAMPLE_ISSUE_PRESETS,
  TECHNICIANS,
} from '../data/seedData';

export const STORAGE_KEY = 'campusfix_ai_state_v1';

export function formatNowStamp(date: Date = new Date()): string {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${hours}:${mins}`;
}

export function generateTicketCode(existingTickets: MaintenanceTicket[]): string {
  const maxNumeric = existingTickets.reduce((max, t) => {
    const match = t.code.match(/(\d+)$/);
    if (!match) return max;
    const val = parseInt(match[1], 10);
    return Number.isNaN(val) ? max : Math.max(max, val);
  }, 4400);
  return `RF-${maxNumeric + 1}`;
}

export function classifyIssueInput(params: {
  sampleId?: string | null;
  building: string;
  room: string;
  description: string;
  fileName?: string;
}): AiAnalysisResult {
  if (params.sampleId) {
    const preset = SAMPLE_ISSUE_PRESETS.find((p) => p.id === params.sampleId);
    if (preset) {
      return {
        ...preset.aiResult,
        generatedDescription: preset.aiResult.generatedDescription
          .replace('Room A302', params.room || preset.room)
          .replace('Room 204', params.room || preset.room)
          .replace('Restroom 1F', params.room || preset.room),
      };
    }
  }

  const text = `${params.description} ${params.fileName || ''}`.toLowerCase();
  const locationLabel = `${params.building} ${params.room}`.trim() || 'Campus Facility';

  if (
    text.includes('ac') ||
    text.includes('air condition') ||
    text.includes('hvac') ||
    text.includes('cooling') ||
    text.includes('heat') ||
    text.includes('thermostat')
  ) {
    return {
      classification: 'Broken / Leaking Air Conditioner',
      category: 'HVAC',
      categoryDisplay: 'HVAC (Air Conditioning)',
      confidence: 96,
      suggestedPriority: 'High',
      generatedDescription: `HVAC unit in ${locationLabel} shows cooling failure or condensate leakage. Prompt inspection is recommended to prevent water damage and restore classroom climate.`,
    };
  }

  if (
    text.includes('water') ||
    text.includes('faucet') ||
    text.includes('sink') ||
    text.includes('pipe') ||
    text.includes('toilet') ||
    text.includes('leak') ||
    text.includes('plumb')
  ) {
    return {
      classification: 'Active Plumbing / Water Leak',
      category: 'Plumbing',
      categoryDisplay: 'Plumbing & Water Systems',
      confidence: 95,
      suggestedPriority: 'High',
      generatedDescription: `Water fixture in ${locationLabel} exhibits active leakage. Immediate plumbing dispatch is advised to prevent slip hazards and water waste.`,
    };
  }

  if (
    text.includes('light') ||
    text.includes('flicker') ||
    text.includes('bulb') ||
    text.includes('outlet') ||
    text.includes('power') ||
    text.includes('electric')
  ) {
    return {
      classification: 'Flickering / Faulty Electrical Fixture',
      category: 'Electrical',
      categoryDisplay: 'Electrical & Lighting',
      confidence: 94,
      suggestedPriority: 'Medium',
      generatedDescription: `Lighting or electrical fixture in ${locationLabel} is operating intermittently. Electrical technician inspection is recommended for ballast or circuit replacement.`,
    };
  }

  if (
    text.includes('elevator') ||
    text.includes('lock') ||
    text.includes('door') ||
    text.includes('alarm') ||
    text.includes('safety') ||
    text.includes('card')
  ) {
    return {
      classification: 'Building Access / Safety Hardware Fault',
      category: 'Safety & Access',
      categoryDisplay: 'Safety & Access Control',
      confidence: 93,
      suggestedPriority: 'High',
      generatedDescription: `Access or safety hardware in ${locationLabel} requires servicing to restore secure student entry and campus accessibility compliance.`,
    };
  }

  return {
    classification: 'General Facility Maintenance Issue',
    category: 'General Repair',
    categoryDisplay: 'General Facility Repair',
    confidence: 89,
    suggestedPriority: 'Medium',
    generatedDescription:
      params.description.trim().length > 20
        ? `${params.description.trim()} Reported at ${locationLabel} and triaged for standard maintenance review.`
        : `Facility issue detected in ${locationLabel}. Routed to campus operations for inspection and repair scheduling.`,
  };
}

export interface CreateTicketInput {
  title: string;
  description: string;
  building: string;
  room: string;
  category: IssueCategory;
  categoryDisplay: string;
  priority: IssuePriority;
  confidenceScore: number;
  beforePhoto: string;
  reporterName?: string;
}

export function validateNewReportInput(input: {
  building: string;
  room: string;
  description: string;
}): string | null {
  if (!input.building.trim()) return 'Please select a campus building.';
  if (!input.room.trim()) return 'Please select or enter a room / area.';
  if (input.description.trim().length < 8) {
    return 'Please describe the issue (at least 8 characters) or select a sample issue.';
  }
  return null;
}

export function createTicketInState(
  state: CampusFixState,
  input: CreateTicketInput,
  now: Date = new Date(),
): { nextState: CampusFixState; createdTicket: MaintenanceTicket } {
  const stamp = formatNowStamp(now);
  const code = generateTicketCode(state.tickets);
  const id = `ticket-${code.toLowerCase()}-${now.getTime()}`;

  const createdTicket: MaintenanceTicket = {
    id,
    code,
    title: input.title.trim() || 'Facility Maintenance Issue',
    description: input.description.trim(),
    building: input.building.trim(),
    room: input.room.trim(),
    category: input.category,
    categoryDisplay: input.categoryDisplay,
    priority: input.priority,
    status: 'AI Analyzed',
    assignedTo: null,
    dueBy: input.priority === 'High' ? 'Today, 5:00 PM' : 'Tomorrow, 10:00 AM',
    reporterName: input.reporterName || 'Alex Rivera',
    createdAt: now.toISOString(),
    relativeTime: 'Just now',
    confidenceScore: input.confidenceScore,
    beforePhoto: input.beforePhoto || ASSETS.ceilingLight,
    afterPhoto: null,
    trackingTimestamps: {
      submitted: stamp,
      ai_analyzed: stamp,
    },
    technicianUpdates: [
      {
        id: `upd-${id}-init`,
        timestamp: stamp,
        message: `AI Triage completed (${input.confidenceScore}% confidence): classified as ${input.categoryDisplay} with ${input.priority} priority.`,
        author: 'CampusFix AI Triage',
      },
    ],
  };

  const newNotification: StudentNotification = {
    id: `notif-${id}`,
    ticketId: id,
    title: `Report #${code} Submitted`,
    detail: `AI triaged your ${input.building} (${input.room}) report as ${input.priority} priority.`,
    time: 'Just now',
    type: 'update',
    unread: true,
  };

  return {
    createdTicket,
    nextState: {
      ...state,
      tickets: [createdTicket, ...state.tickets],
      notifications: [newNotification, ...state.notifications],
    },
  };
}

export function assignTechnicianInState(
  state: CampusFixState,
  params: {
    ticketId: string;
    technicianName: string;
    priority: IssuePriority;
    dueBy: string;
  },
  now: Date = new Date(),
): CampusFixState {
  const stamp = formatNowStamp(now);
  let targetCode = '';

  const updatedTickets = state.tickets.map((ticket) => {
    if (ticket.id !== params.ticketId) return ticket;
    targetCode = ticket.code;

    const nextStatus: TicketStatus =
      ticket.status === 'Submitted' || ticket.status === 'AI Analyzed'
        ? 'Assigned'
        : ticket.status;

    return {
      ...ticket,
      assignedTo: params.technicianName,
      priority: params.priority,
      dueBy: params.dueBy,
      status: nextStatus,
      relativeTime: 'Just now',
      trackingTimestamps: {
        ...ticket.trackingTimestamps,
        staff_assigned: ticket.trackingTimestamps.staff_assigned || stamp,
      },
      technicianUpdates: [
        ...ticket.technicianUpdates,
        {
          id: `upd-assign-${now.getTime()}`,
          timestamp: stamp,
          message: `Assigned to Tech. ${params.technicianName} (${params.priority} priority, due ${params.dueBy}).`,
          author: 'Facilities Dispatch',
        },
      ],
    };
  });

  if (!targetCode) return state;

  const notification: StudentNotification = {
    id: `notif-assign-${now.getTime()}`,
    ticketId: params.ticketId,
    title: `Report #${targetCode} Assigned`,
    detail: `${params.technicianName} has been assigned to your facility ticket.`,
    time: 'Just now',
    type: 'in_progress',
    unread: true,
  };

  return {
    ...state,
    tickets: updatedTickets,
    notifications: [notification, ...state.notifications],
  };
}

export interface StatusUpdateParams {
  ticketId: string;
  status: TicketStatus;
  note?: string;
  /** After-repair photo taken by the technician (used when resolving). */
  afterPhoto?: string | null;
  verification?: RepairVerification | null;
}

export function updateTicketStatusInState(
  state: CampusFixState,
  params: StatusUpdateParams,
  now: Date = new Date(),
): CampusFixState {
  const stamp = formatNowStamp(now);
  let targetTicket: MaintenanceTicket | null = null;

  const updatedTickets = state.tickets.map((ticket) => {
    if (ticket.id !== params.ticketId) return ticket;
    targetTicket = ticket;

    const nextTimestamps = { ...ticket.trackingTimestamps };
    if (!nextTimestamps.submitted) nextTimestamps.submitted = stamp;
    if (!nextTimestamps.ai_analyzed) nextTimestamps.ai_analyzed = stamp;

    if (
      params.status === 'Assigned' ||
      params.status === 'In Progress' ||
      params.status === 'On Site' ||
      params.status === 'Pending Parts' ||
      params.status === 'Resolved'
    ) {
      nextTimestamps.staff_assigned = nextTimestamps.staff_assigned || stamp;
    }

    if (
      params.status === 'In Progress' ||
      params.status === 'On Site' ||
      params.status === 'Pending Parts' ||
      params.status === 'Resolved'
    ) {
      nextTimestamps.repairing = nextTimestamps.repairing || stamp;
    }

    if (params.status === 'Resolved') {
      nextTimestamps.resolved = stamp;
    }

    const defaultAfterPhoto =
      ticket.category === 'HVAC' ? ASSETS.acLeakAfter : ticket.beforePhoto;

    const updateMessage =
      params.note && params.note.trim().length > 0
        ? params.note.trim()
        : params.status === 'Resolved'
          ? 'Repair completed and tested. Facility is now working normally.'
          : `Status updated to ${params.status}.`;

    return {
      ...ticket,
      status: params.status,
      assignedTo: ticket.assignedTo || 'Jordan Mills',
      dueBy: params.status === 'Resolved' ? 'Completed' : ticket.dueBy,
      relativeTime: 'Just now',
      afterPhoto:
        params.status === 'Resolved'
          ? params.afterPhoto || ticket.afterPhoto || defaultAfterPhoto
          : ticket.afterPhoto,
      aiVerification:
        params.status === 'Resolved'
          ? (params.verification ?? ticket.aiVerification ?? null)
          : ticket.aiVerification,
      trackingTimestamps: nextTimestamps,
      technicianUpdates: [
        ...ticket.technicianUpdates,
        {
          id: `upd-status-${now.getTime()}`,
          timestamp: stamp,
          message: updateMessage,
          author: ticket.assignedTo || 'Facilities Ops',
        },
      ],
    };
  });

  if (!targetTicket) return state;

  const t = targetTicket as MaintenanceTicket;
  const notification: StudentNotification = {
    id: `notif-status-${now.getTime()}`,
    ticketId: params.ticketId,
    title: `Report #${t.code} ${params.status}`,
    detail:
      params.note && params.note.trim().length > 0
        ? params.note.trim()
        : `Your ${t.building} report status changed to ${params.status}.`,
    time: 'Just now',
    type: params.status === 'Resolved' ? 'resolved' : 'in_progress',
    unread: true,
  };

  return {
    ...state,
    tickets: updatedTickets,
    notifications: [notification, ...state.notifications],
  };
}

export function getTrackingSteps(ticket: MaintenanceTicket): TrackingStep[] {
  const statusStageMap: Record<TicketStatus, number> = {
    Submitted: 0,
    'AI Analyzed': 1,
    Assigned: 2,
    'In Progress': 3,
    'On Site': 3,
    'Pending Parts': 3,
    Resolved: 4,
  };

  const currentIdx = statusStageMap[ticket.status];
  const definitions: Array<{ key: TrackingStep['key']; label: string }> = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'ai_analyzed', label: 'AI Analyzed' },
    { key: 'staff_assigned', label: 'Staff Assigned' },
    { key: 'repairing', label: 'Repairing' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return definitions.map((def, idx) => ({
    key: def.key,
    label: def.label,
    timestamp: ticket.trackingTimestamps[def.key] || null,
    completed: idx <= currentIdx,
    active: idx === currentIdx,
  }));
}

export function filterTickets(
  tickets: MaintenanceTicket[],
  priorityFilter: 'All' | IssuePriority,
  searchQuery: string = '',
): MaintenanceTicket[] {
  const q = searchQuery.trim().toLowerCase();
  return tickets.filter((t) => {
    const matchesPriority =
      priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesSearch =
      !q ||
      t.code.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.building.toLowerCase().includes(q) ||
      t.room.toLowerCase().includes(q) ||
      (t.assignedTo || 'unassigned').toLowerCase().includes(q);
    return matchesPriority && matchesSearch;
  });
}

export function computeKpis(state: CampusFixState) {
  const liveTotal = state.tickets.length;
  const liveResolved = state.tickets.filter((t) => t.status === 'Resolved').length;
  const liveInProgress = state.tickets.filter((t) => t.status !== 'Resolved').length;
  const liveHighPriorityActive = state.tickets.filter(
    (t) => t.priority === 'High' && t.status !== 'Resolved',
  ).length;
  const liveMediumActive = state.tickets.filter(
    (t) => t.priority === 'Medium' && t.status !== 'Resolved',
  ).length;
  const liveLowActive = state.tickets.filter(
    (t) => t.priority === 'Low' && t.status !== 'Resolved',
  ).length;

  const studentTotal = state.baseHistoricalCounts.studentTotalOffset + liveTotal;
  const studentInProgress =
    state.baseHistoricalCounts.studentInProgressOffset + liveInProgress;
  const studentResolved =
    state.baseHistoricalCounts.studentResolvedOffset + liveResolved;

  const opsAssigned = state.baseHistoricalCounts.opsAssignedOffset + liveInProgress;
  const opsHighPriority =
    state.baseHistoricalCounts.opsHighPriorityOffset + liveHighPriorityActive;

  const execTotal = state.baseHistoricalCounts.execTotalOffset + liveTotal;
  const execResolved = state.baseHistoricalCounts.execResolvedOffset + liveResolved;
  const resolutionRate = Math.min(
    99,
    Math.round((execResolved / Math.max(1, execTotal)) * 100),
  );

  return {
    studentTotal,
    studentInProgress,
    studentResolved,
    opsAssigned,
    opsHighPriority,
    opsActiveTotal: 31 + liveInProgress,
    opsHighBreakdown: 4 + liveHighPriorityActive,
    opsMediumBreakdown: 15 + liveMediumActive,
    opsLowBreakdown: 11 + liveLowActive,
    execTotal,
    execResolved,
    resolutionRate,
    slaCompliance: resolutionRate,
    avgResolutionHours: '7.4 hrs',
  };
}

export function computeTeamWorkload(tickets: MaintenanceTicket[]) {
  return TECHNICIANS.map((tech) => {
    const activeAssigned = tickets.filter(
      (t) => t.assignedTo === tech.name && t.status !== 'Resolved',
    ).length;
    return {
      ...tech,
      activeTickets: tech.baseLoad + activeAssigned,
    };
  }).sort((a, b) => b.activeTickets - a.activeTickets);
}

export function computeAnalyticsData(state: CampusFixState) {
  const categoryBase: Record<IssueCategory, { count: number; color: string }> = {
    HVAC: { count: 356, color: '#1E40AF' },
    Plumbing: { count: 204, color: '#0EA5E9' },
    Electrical: { count: 218, color: '#F97316' },
    'General Repair': { count: 179, color: '#16A34A' },
    'Safety & Access': { count: 114, color: '#FACC15' },
    Other: { count: 178, color: '#94A3B8' },
  };

  for (const t of state.tickets) {
    if (categoryBase[t.category]) {
      categoryBase[t.category].count += 1;
    }
  }

  const totalCat = Object.values(categoryBase).reduce((sum, c) => sum + c.count, 0);
  const categories = (Object.keys(categoryBase) as IssueCategory[]).map((name) => {
    const value = categoryBase[name].count;
    return {
      name,
      value,
      pct: Math.round((value / Math.max(1, totalCat)) * 100),
      color: categoryBase[name].color,
    };
  });

  const buildingPerformance = [
    { name: 'Science Hall', rate: 98 },
    { name: 'Library', rate: 97 },
    { name: 'Student Union', rate: 95 },
    { name: 'Arts Center', rate: 94 },
    { name: 'Residence Hall A', rate: 92 },
  ].map((b) => {
    const buildingTickets = state.tickets.filter((t) => t.building === b.name);
    const resolvedBoost = buildingTickets.filter((t) => t.status === 'Resolved').length;
    const unresolvedDip = buildingTickets.filter((t) => t.status !== 'Resolved').length;
    const adjusted = Math.max(
      85,
      Math.min(99, b.rate + (resolvedBoost > unresolvedDip ? 1 : 0)),
    );
    return { ...b, rate: adjusted };
  });

  const workloadList = computeTeamWorkload(state.tickets);
  const unassignedActive =
    7 + state.tickets.filter((t) => !t.assignedTo && t.status !== 'Resolved').length;

  const workloadColors = ['#EA580C', '#0EA5E9', '#16A34A', '#FACC15', '#1E3A8A'];
  const workloadEntries = [
    ...workloadList.map((w, idx) => ({
      name: w.shortName,
      fullName: w.name,
      value: w.activeTickets,
      color: workloadColors[idx % workloadColors.length],
    })),
    {
      name: 'Unassigned',
      fullName: 'Unassigned',
      value: unassignedActive,
      color: '#94A3B8',
    },
  ];
  const workloadTotal = workloadEntries.reduce((sum, w) => sum + w.value, 0);
  const workloadDistribution = workloadEntries.map((w) => ({
    ...w,
    pct: Math.round((w.value / Math.max(1, workloadTotal)) * 100),
  }));

  return {
    categories,
    buildingPerformance,
    workloadDistribution,
    workloadTotal,
  };
}

export function loadPersistedState(): CampusFixState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<CampusFixState>;
    if (!Array.isArray(parsed.tickets) || parsed.tickets.length === 0) {
      return INITIAL_STATE;
    }
    return {
      tickets: parsed.tickets,
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : INITIAL_STATE.notifications,
      baseHistoricalCounts:
        parsed.baseHistoricalCounts || INITIAL_STATE.baseHistoricalCounts,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function savePersistedState(state: CampusFixState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or storage restriction errors cleanly
  }
}

export interface DuplicateMatch {
  ticket: MaintenanceTicket;
  sameRoom: boolean;
}

/**
 * Open reports that look like the same problem: same building and the
 * category the AI assigned. Same-room matches rank first.
 */
export function findPossibleDuplicates(
  tickets: MaintenanceTicket[],
  params: { building: string; room: string; category: IssueCategory },
): DuplicateMatch[] {
  return tickets
    .filter(
      (t) =>
        t.status !== 'Resolved' &&
        t.building === params.building &&
        t.category === params.category,
    )
    .map((ticket) => ({ ticket, sameRoom: ticket.room === params.room }))
    .sort((a, b) => Number(b.sameRoom) - Number(a.sameRoom))
    .slice(0, 2);
}

export interface TechnicianSuggestion {
  name: string;
  specialty: IssueCategory;
  activeTickets: number;
  reason: string;
}

/**
 * Picks the technician for a ticket: a specialist in the ticket's category
 * if there is one, otherwise the least-loaded general repair tech.
 */
export function suggestTechnician(
  tickets: MaintenanceTicket[],
  ticket: MaintenanceTicket,
): TechnicianSuggestion {
  const workload = computeTeamWorkload(tickets);
  const specialists = workload.filter((w) => w.specialty === ticket.category);
  const pool = specialists.length
    ? specialists
    : workload.filter((w) => w.specialty === 'General Repair');
  const pick = [...(pool.length ? pool : workload)].sort(
    (a, b) => a.activeTickets - b.activeTickets,
  )[0];
  const lightest = Math.min(...workload.map((w) => w.activeTickets));
  const reason = specialists.length
    ? `${ticket.categoryDisplay} specialist · ${pick.activeTickets} active jobs`
    : `No ${ticket.category} specialist — general repair, ${pick.activeTickets} active jobs`;
  return {
    name: pick.name,
    specialty: pick.specialty,
    activeTickets: pick.activeTickets,
    reason: pick.activeTickets === lightest ? `${reason} (lightest load)` : reason,
  };
}
