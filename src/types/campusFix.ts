export type AppView = 'landing' | 'student' | 'operations' | 'analytics';

export type IssuePriority = 'High' | 'Medium' | 'Low';

export type IssueCategory =
  | 'HVAC'
  | 'Plumbing'
  | 'Electrical'
  | 'General Repair'
  | 'Safety & Access'
  | 'Other';

export type TicketStatus =
  | 'Submitted'
  | 'AI Analyzed'
  | 'Assigned'
  | 'In Progress'
  | 'On Site'
  | 'Pending Parts'
  | 'Resolved';

export type TrackingStepKey =
  | 'submitted'
  | 'ai_analyzed'
  | 'staff_assigned'
  | 'repairing'
  | 'resolved';

export interface TrackingStep {
  key: TrackingStepKey;
  label: string;
  timestamp: string | null;
  completed: boolean;
  active: boolean;
}

export interface TechnicianUpdate {
  id: string;
  timestamp: string;
  message: string;
  author: string;
}

export interface AiAnalysisResult {
  classification: string;
  category: IssueCategory;
  categoryDisplay: string;
  confidence: number;
  suggestedPriority: IssuePriority;
  generatedDescription: string;
  /** 'gemini' when the real model answered, 'fallback' for the local keyword classifier. */
  source?: 'gemini' | 'fallback';
}

export interface RepairVerification {
  verdict: 'resolved' | 'not_resolved' | 'unclear';
  confidence: number;
  summary: string;
}

export interface MaintenanceTicket {
  id: string;
  code: string;
  title: string;
  description: string;
  building: string;
  room: string;
  category: IssueCategory;
  categoryDisplay: string;
  priority: IssuePriority;
  status: TicketStatus;
  assignedTo: string | null;
  dueBy: string;
  reporterName: string;
  createdAt: string;
  relativeTime: string;
  confidenceScore: number;
  beforePhoto: string;
  afterPhoto: string | null;
  /** Gemini's before/after comparison, set when the ticket is resolved with a check. */
  aiVerification?: RepairVerification | null;
  trackingTimestamps: Partial<Record<TrackingStepKey, string>>;
  technicianUpdates: TechnicianUpdate[];
}

export interface StudentNotification {
  id: string;
  ticketId: string;
  title: string;
  detail: string;
  time: string;
  type: 'resolved' | 'in_progress' | 'update';
  unread: boolean;
}

export interface TechnicianProfile {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  specialty: IssueCategory;
  avatarBg: string;
  baseLoad: number;
}

export interface SampleIssuePreset {
  id: string;
  label: string;
  fileName: string;
  fileSize: string;
  photo: string;
  afterPhoto: string;
  building: string;
  room: string;
  initialDescription: string;
  aiResult: AiAnalysisResult;
}

export interface CampusFixState {
  tickets: MaintenanceTicket[];
  notifications: StudentNotification[];
  baseHistoricalCounts: {
    studentTotalOffset: number;
    studentInProgressOffset: number;
    studentResolvedOffset: number;
    opsAssignedOffset: number;
    opsHighPriorityOffset: number;
    execTotalOffset: number;
    execResolvedOffset: number;
  };
}
