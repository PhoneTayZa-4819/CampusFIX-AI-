import React, { useEffect, useRef, useState } from 'react';
import {
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  UserCheck,
  Users,
  Search,
  Edit3,
  History,
  BarChart2,
  ExternalLink,
  Building2,
  Sparkles,
  Camera,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
} from 'lucide-react';
import {
  IssuePriority,
  MaintenanceTicket,
  RepairVerification,
  TicketStatus,
} from '../types/campusFix';
import { verifyRepairPhotos } from '../utils/aiAnalysis';
import {
  ASSETS,
  CAMPUS_BUILDINGS,
  DUE_BY_OPTIONS,
  TECHNICIANS,
} from '../data/seedData';
import {
  computeTeamWorkload,
  filterTickets,
  StatusUpdateParams,
  suggestTechnician,
} from '../utils/campusFixStore';
import { OpsSection } from './OperationsShell';

interface OperationsViewProps {
  tickets: MaintenanceTicket[];
  activeSection: OpsSection;
  selectedTicketId: string | null;
  onSelectTicketId: (id: string) => void;
  kpis: {
    opsAssigned: number;
    opsHighPriority: number;
    opsActiveTotal: number;
    opsHighBreakdown: number;
    opsMediumBreakdown: number;
    opsLowBreakdown: number;
    avgResolutionHours: string;
    slaCompliance: number;
  };
  onAssignTechnician: (params: {
    ticketId: string;
    technicianName: string;
    priority: IssuePriority;
    dueBy: string;
  }) => void;
  onUpdateTicketStatus: (params: StatusUpdateParams) => void;
  onViewInStudentTracker: (ticketId: string) => void;
}

const VERDICT_STYLES = {
  resolved: {
    Icon: ShieldCheck,
    label: 'AI verified: repair looks complete',
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: 'text-emerald-600',
  },
  not_resolved: {
    Icon: ShieldAlert,
    label: 'AI check: fault still visible',
    box: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
  },
  unclear: {
    Icon: ShieldQuestion,
    label: 'AI check: cannot confirm from this photo',
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-600',
  },
} as const;

export const VerificationResult: React.FC<{ verification: RepairVerification }> = ({
  verification,
}) => {
  const style = VERDICT_STYLES[verification.verdict];
  return (
    <div role="status" className={`rounded-lg border p-2.5 flex items-start gap-2 ${style.box}`}>
      <style.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.icon}`} />
      <div className="min-w-0">
        <p className="text-xs font-bold">
          {style.label}{' '}
          <span className="font-semibold opacity-70 tabular-nums">
            ({verification.confidence}%)
          </span>
        </p>
        <p className="text-[11px] mt-0.5 leading-snug">{verification.summary}</p>
      </div>
    </div>
  );
};

const ALL_STATUSES: TicketStatus[] = [
  'Submitted',
  'AI Analyzed',
  'Assigned',
  'In Progress',
  'On Site',
  'Pending Parts',
  'Resolved',
];

export const OperationsView: React.FC<OperationsViewProps> = ({
  tickets,
  activeSection,
  selectedTicketId,
  onSelectTicketId,
  kpis,
  onAssignTechnician,
  onUpdateTicketStatus,
  onViewInStudentTracker,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'All' | IssuePriority>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  const selectedTicketRef = useRef<string | null>(null);
  selectedTicketRef.current = selectedTicket?.id ?? null;

  const [assignTech, setAssignTech] = useState<string>(
    selectedTicket?.assignedTo || TECHNICIANS[0].name,
  );
  const [assignPriority, setAssignPriority] = useState<IssuePriority>(
    selectedTicket?.priority || 'High',
  );
  const [assignDueBy, setAssignDueBy] = useState<string>(
    selectedTicket?.dueBy && DUE_BY_OPTIONS.includes(selectedTicket.dueBy)
      ? selectedTicket.dueBy
      : DUE_BY_OPTIONS[0],
  );

  const [statusChoice, setStatusChoice] = useState<TicketStatus>(
    selectedTicket?.status || 'In Progress',
  );
  const [statusNote, setStatusNote] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [verification, setVerification] = useState<RepairVerification | null>(null);
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'failed'>('idle');

  // A new ticket starts a fresh repair check.
  useEffect(() => {
    setAfterPhoto(null);
    setVerification(null);
    setVerifyState('idle');
  }, [selectedTicket?.id]);

  const chooseAfterPhoto = (url: string | null) => {
    setAfterPhoto(url);
    setVerification(null);
    setVerifyState('idle');
  };

  const handleAfterPhotoFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') chooseAfterPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyRepair = async () => {
    if (!selectedTicket || !afterPhoto) return;
    const ticketId = selectedTicket.id;
    setVerifyState('checking');
    setVerification(null);
    const result = await verifyRepairPhotos({
      beforeUrl: selectedTicket.beforePhoto,
      afterUrl: afterPhoto,
      issue: `${selectedTicket.title} - ${selectedTicket.description}`,
      location: `${selectedTicket.building}, ${selectedTicket.room}`,
    });
    // Ignore a late answer for a ticket that is no longer selected.
    if (ticketId !== selectedTicketRef.current) return;
    setVerification(result);
    setVerifyState(result ? 'idle' : 'failed');
  };

  useEffect(() => {
    if (!selectedTicket) return;
    setAssignTech(
      selectedTicket.assignedTo || suggestTechnician(tickets, selectedTicket).name,
    );
    setAssignPriority(selectedTicket.priority);
    setAssignDueBy(
      DUE_BY_OPTIONS.includes(selectedTicket.dueBy)
        ? selectedTicket.dueBy
        : DUE_BY_OPTIONS[0],
    );
    setStatusChoice(selectedTicket.status);
  }, [selectedTicket?.id, selectedTicket?.assignedTo, selectedTicket?.status, selectedTicket?.priority]);

  const techSuggestion =
    selectedTicket && selectedTicket.status !== 'Resolved'
      ? suggestTechnician(tickets, selectedTicket)
      : null;

  const showRepairCheck =
    !!selectedTicket && statusChoice === 'Resolved' && selectedTicket.status !== 'Resolved';

  const filteredTickets = filterTickets(tickets, priorityFilter, searchQuery);
  const workload = computeTeamWorkload(tickets);
  const maxWorkload = Math.max(15, ...workload.map((w) => w.activeTickets));

  const highCount = tickets.filter((t) => t.priority === 'High').length;
  const mediumCount = tickets.filter((t) => t.priority === 'Medium').length;
  const lowCount = tickets.filter((t) => t.priority === 'Low').length;

  const recentActivity = tickets
    .flatMap((t) =>
      t.technicianUpdates.map((u) => ({
        id: u.id,
        ticketId: t.id,
        code: t.code,
        building: t.building,
        message: u.message,
        timestamp: u.timestamp,
      })),
    )
    .slice(0, 5);

  const showFeedback = (msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => {
      setFeedbackBanner((current) => (current === msg ? null : current));
    }, 4000);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    onAssignTechnician({
      ticketId: selectedTicket.id,
      technicianName: assignTech,
      priority: assignPriority,
      dueBy: assignDueBy,
    });
    showFeedback(
      `Ticket ${selectedTicket.code} assigned to ${assignTech} (${assignPriority} priority). Student tracking updated.`,
    );
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const resolving = statusChoice === 'Resolved';
    onUpdateTicketStatus({
      ticketId: selectedTicket.id,
      status: statusChoice,
      note: statusNote,
      afterPhoto: resolving ? afterPhoto : undefined,
      verification: resolving ? verification : undefined,
    });
    setStatusNote('');
    showFeedback(
      `Ticket ${selectedTicket.code} updated to "${statusChoice}". Student 5-step tracker synced live.`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Sync Feedback Toast Banner */}
      {feedbackBanner && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-emerald-900"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {feedbackBanner}
          </span>
          {selectedTicket && (
            <button
              type="button"
              onClick={() => onViewInStudentTracker(selectedTicket.id)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              <span>Inspect Student 5-Step View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top 4 KPI Cards (Mockup 4 Top) */}
      <section
        aria-label="Operations Key Performance Indicators"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Assigned Tickets</p>
            <p
              data-testid="ops-kpi-assigned"
              className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
            >
              {kpis.opsAssigned}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▲ +12% <span className="font-normal text-slate-500">vs. prior 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">High Priority</p>
            <p
              data-testid="ops-kpi-high"
              className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
            >
              {kpis.opsHighPriority}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▼ -21% <span className="font-normal text-slate-500">(faster response)</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Avg. Resolution Time</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5">
              {kpis.avgResolutionHours}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▼ -32% <span className="font-normal text-slate-500">vs. prior 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">SLA Compliance</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5">
              {kpis.slaCompliance}%
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▲ +4 pp <span className="font-normal text-slate-500">(target ≥ 95%)</span>
            </p>
          </div>
        </div>
      </section>

      {/* Optional Buildings Directory View when Sidebar "Buildings & Assets" is active */}
      {activeSection === 'buildings' && (
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#EA580C]" />
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Campus Buildings &amp; Active Ticket Load
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Object.entries(CAMPUS_BUILDINGS).map(([bldg, rooms]) => {
              const bldgTickets = tickets.filter((t) => t.building === bldg);
              const openCount = bldgTickets.filter((t) => t.status !== 'Resolved').length;
              return (
                <div
                  key={bldg}
                  className="rounded-xl border border-slate-200/80 p-4 bg-[#FAFBFC] space-y-1.5"
                >
                  <p className="font-display text-sm font-bold text-[#0F172A]">{bldg}</p>
                  <p className="text-xs text-slate-500">
                    {rooms.length} monitored zones ·{' '}
                    <span className="font-semibold text-[#EA580C] tabular-nums">
                      {openCount} open
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main 3-Column Operations Grid (Matches Mockup 4 Top) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: My Assigned Tickets + Technician Assignment */}
        <div className="xl:col-span-3 space-y-5">
          {/* My Assigned Tickets Card */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#EA580C]" />
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                My Assigned Tickets
              </h2>
            </div>

            <div>
              <p className="font-display text-3xl font-extrabold text-[#0F172A] tabular-nums">
                {kpis.opsActiveTotal}
              </p>
              <p className="text-xs text-slate-500">Active Assignments</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                  High
                </span>
                <span className="font-bold text-[#0F172A] tabular-nums">
                  {kpis.opsHighBreakdown}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
                  Medium
                </span>
                <span className="font-bold text-[#0F172A] tabular-nums">
                  {kpis.opsMediumBreakdown}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true" />
                  Low
                </span>
                <span className="font-bold text-[#0F172A] tabular-nums">
                  {kpis.opsLowBreakdown}
                </span>
              </div>
            </div>
          </section>

          {/* Technician Assignment Panel */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#EA580C]" />
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  Technician Assignment
                </h2>
              </div>
            </div>

            {selectedTicket && (
              <p className="text-xs text-slate-500">
                Selected Ticket:{' '}
                <span className="font-mono font-bold text-[#0F172A]">
                  {selectedTicket.code}
                </span>
              </p>
            )}

            {techSuggestion && (
              <div className="rounded-xl border border-orange-200 bg-[#FFFBF7] p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#EA580C]">
                    AI Suggested
                  </p>
                  <p className="text-sm font-bold text-[#0F172A]">{techSuggestion.name}</p>
                  <p className="text-[11px] text-slate-600">{techSuggestion.reason}</p>
                </div>
                {assignTech === techSuggestion.name &&
                assignPriority === selectedTicket?.priority ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 shrink-0 self-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignTech(techSuggestion.name);
                      if (selectedTicket) setAssignPriority(selectedTicket.priority);
                    }}
                    className="shrink-0 self-center text-xs font-bold text-[#EA580C] hover:text-[#C2410C] border border-orange-200 hover:border-orange-300 bg-white rounded-lg px-2.5 py-1 cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="ops-assign-tech"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Assign To
                </label>
                <select
                  id="ops-assign-tech"
                  value={assignTech}
                  onChange={(e) => setAssignTech(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                >
                  {TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.name}>
                      {tech.name} ({tech.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="ops-assign-priority"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Priority
                </label>
                <select
                  id="ops-assign-priority"
                  value={assignPriority}
                  onChange={(e) => setAssignPriority(e.target.value as IssuePriority)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ops-assign-due"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Due By
                </label>
                <select
                  id="ops-assign-due"
                  value={assignDueBy}
                  onChange={(e) => setAssignDueBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                >
                  {DUE_BY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#F97316] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Assign Ticket
              </button>
            </form>
          </section>
        </div>

        {/* Center Column: Issue Queue Table + Recent Repair Activity & Team Workload */}
        <div className="xl:col-span-6 space-y-5 min-w-0">
          {/* Issue Queue Card */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  Issue Queue{' '}
                  <span className="font-normal text-slate-500 text-sm">
                    (All Tickets)
                  </span>
                </h2>

                {/* Filter Buttons: All / High / Medium / Low */}
                <div
                  role="group"
                  aria-label="Filter queue by priority"
                  className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl"
                >
                  {(
                    [
                      { key: 'All', label: `All (${tickets.length})` },
                      { key: 'High', label: `High (${highCount})` },
                      { key: 'Medium', label: `Medium (${mediumCount})` },
                      { key: 'Low', label: `Low (${lowCount})` },
                    ] as const
                  ).map((f) => {
                    const active = priorityFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setPriorityFilter(f.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                          active
                            ? 'bg-[#EA580C] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Search tickets by code, issue, building, or technician"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket #, issue, building, or technician..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-[#FAFBFC] text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                />
              </div>
            </div>

            {/* Responsive Queue Table */}
            <div className="overflow-x-auto">
              <table
                data-testid="ops-issue-queue"
                className="w-full text-left border-collapse text-xs sm:text-sm"
              >
                <thead>
                  <tr className="border-b border-slate-100 bg-[#FAFBFC] text-slate-500 text-xs">
                    <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Ticket #</th>
                    <th className="py-2.5 px-3 font-semibold">Issue / Location</th>
                    <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Building</th>
                    <th className="py-2.5 px-3 font-semibold">Priority</th>
                    <th className="py-2.5 px-3 font-semibold hidden md:table-cell">Assigned To</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                        No tickets match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const isSelected = selectedTicket?.id === ticket.id;
                      const techProfile = TECHNICIANS.find(
                        (t) => t.name === ticket.assignedTo,
                      );
                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => onSelectTicketId(ticket.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50/70'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicketId(ticket.id);
                              }}
                              className="font-mono text-xs font-bold text-[#1E40AF] hover:underline cursor-pointer"
                            >
                              {ticket.code}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-[#0F172A] leading-snug">
                              {ticket.title}
                            </p>
                            <p className="text-xs text-slate-500 sm:hidden">
                              {ticket.building} · {ticket.room}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-slate-600 hidden sm:table-cell whitespace-nowrap">
                            {ticket.building}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-xs font-bold ${
                                ticket.priority === 'High'
                                  ? 'text-red-700'
                                  : ticket.priority === 'Medium'
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3 hidden md:table-cell whitespace-nowrap">
                            {ticket.assignedTo ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-700">
                                <span
                                  className="w-6 h-6 rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor:
                                      techProfile?.avatarBg || '#1E3A5F',
                                  }}
                                >
                                  {techProfile?.initials || 'OP'}
                                </span>
                                <span className="text-xs font-medium">
                                  {techProfile?.shortName || ticket.assignedTo}
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-[#EA580C]">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                                ticket.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ticket.status === 'On Site'
                                    ? 'bg-violet-50 text-violet-700'
                                    : ticket.status === 'Pending Parts'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-sky-50 text-sky-700'
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom Split: Recent Repair Activity + Team Workload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Recent Repair Activity */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#EA580C]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    Recent Repair Activity
                  </h2>
                </div>
              </div>
              <ul className="space-y-2.5">
                {recentActivity.map((act) => (
                  <li
                    key={act.id}
                    className="flex items-start justify-between gap-2 text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectTicketId(act.ticketId)}
                        className="font-mono font-bold text-[#1E40AF] hover:underline mr-1.5 cursor-pointer"
                      >
                        {act.code}
                      </button>
                      <span className="text-slate-700">{act.message}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{act.building}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                      {act.timestamp}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Team Workload Progress Bars */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#EA580C]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    Team Workload{' '}
                    <span className="font-normal text-slate-500">(Active Tickets)</span>
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {workload.map((tech, idx) => {
                  const pct = Math.min(100, Math.round((tech.activeTickets / maxWorkload) * 100));
                  return (
                    <div key={tech.id} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-4 font-semibold text-[#0F172A] truncate">
                        {tech.shortName}
                      </span>
                      <div className="col-span-6 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              idx === 0
                                ? '#EA580C'
                                : idx === 1
                                  ? '#F97316'
                                  : '#FB923C',
                          }}
                        />
                      </div>
                      <span className="col-span-2 text-right font-bold text-[#0F172A] tabular-nums">
                        {tech.activeTickets}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Status Update Panel (Mockup 4 Top Right) */}
        <section className="xl:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#EA580C]" />
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Status Update
            </h2>
          </div>

          {selectedTicket ? (
            <>
              <div className="rounded-xl bg-[#F5F7FA] p-3.5 border border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Ticket</span>
                  <span className="font-mono text-xs font-bold text-[#1E40AF]">
                    {selectedTicket.code}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] leading-snug">
                  {selectedTicket.title}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedTicket.building} · {selectedTicket.room}
                </p>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="ops-status-select"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Current Status
                  </label>
                  <select
                    id="ops-status-select"
                    value={statusChoice}
                    onChange={(e) => setStatusChoice(e.target.value as TicketStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ops-status-note"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Add Update (Optional)
                  </label>
                  <textarea
                    id="ops-status-note"
                    rows={4}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g., Replaced air filter and tested cooling system."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 resize-none"
                  />
                </div>

                {showRepairCheck && (
                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#EA580C]" />
                      <p className="text-xs font-bold text-[#0F172A]">
                        After-Repair Photo &amp; AI Check
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <figure className="space-y-1">
                        <img
                          src={selectedTicket.beforePhoto}
                          alt="Before repair"
                          className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200"
                        />
                        <figcaption className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          Before
                        </figcaption>
                      </figure>
                      <figure className="space-y-1">
                        {afterPhoto ? (
                          <img
                            src={afterPhoto}
                            alt="After repair"
                            className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <label className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-slate-300 hover:border-[#EA580C] flex flex-col items-center justify-center text-center text-[11px] text-slate-500 cursor-pointer">
                            <Camera className="w-4 h-4 mb-1" />
                            Upload photo
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => handleAfterPhotoFile(e.target.files?.[0])}
                            />
                          </label>
                        )}
                        <figcaption className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          After
                        </figcaption>
                      </figure>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500">Demo:</span>
                      <button
                        type="button"
                        onClick={() => chooseAfterPhoto(ASSETS.acLeakAfter)}
                        className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:border-[#EA580C] font-semibold text-slate-700 cursor-pointer"
                      >
                        Repaired AC photo
                      </button>
                      <button
                        type="button"
                        onClick={() => chooseAfterPhoto(selectedTicket.beforePhoto)}
                        className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:border-[#EA580C] font-semibold text-slate-700 cursor-pointer"
                      >
                        Unchanged photo
                      </button>
                      {afterPhoto && (
                        <button
                          type="button"
                          onClick={() => chooseAfterPhoto(null)}
                          className="px-2 py-0.5 rounded-md font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyRepair}
                      disabled={!afterPhoto || verifyState === 'checking'}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-orange-200 bg-white text-xs font-bold text-[#EA580C] hover:border-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {verifyState === 'checking' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Gemini is comparing the photos...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Verify Repair with AI
                        </>
                      )}
                    </button>

                    {verification && <VerificationResult verification={verification} />}
                    {verifyState === 'failed' && (
                      <p className="text-[11px] text-slate-500">
                        AI check unavailable right now. You can still resolve the ticket.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 rounded-xl text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer ${
                    showRepairCheck && verification?.verdict === 'not_resolved'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-[#EA580C] hover:bg-[#F97316]'
                  }`}
                >
                  {showRepairCheck && verification?.verdict === 'not_resolved'
                    ? 'Resolve Anyway'
                    : 'Update Status'}
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onViewInStudentTracker(selectedTicket.id)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#0F172A] hover:border-[#EA580C] hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  <span>View 5-Step Student Tracker</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Select a ticket from the Issue Queue to update its status.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
