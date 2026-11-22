import { useEffect, useMemo, useState } from 'react';
import {
  AppView,
  CampusFixState,
  IssuePriority,
  MaintenanceTicket,
  TicketStatus,
} from './types/campusFix';
import { INITIAL_STATE } from './data/seedData';
import {
  assignTechnicianInState,
  computeKpis,
  createTicketInState,
  CreateTicketInput,
  loadPersistedState,
  savePersistedState,
  StatusUpdateParams,
  updateTicketStatusInState,
} from './utils/campusFixStore';
import { BrandHeader } from './components/BrandHeader';
import { LandingView } from './components/LandingView';
import { StudentPortalView } from './components/StudentPortalView';
import { OperationsShell, OpsSection } from './components/OperationsShell';
import { OperationsView } from './components/OperationsView';
import { AnalyticsView } from './components/AnalyticsView';

function resolveInitialView(): AppView {
  if (typeof window === 'undefined') return 'landing';
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') return 'student';
  const viewParam = params.get('view');
  if (
    viewParam === 'landing' ||
    viewParam === 'student' ||
    viewParam === 'operations' ||
    viewParam === 'analytics'
  ) {
    return viewParam;
  }
  return 'landing';
}

export default function App() {
  const [state, setState] = useState<CampusFixState>(() => loadPersistedState());
  const [activeView, setActiveView] = useState<AppView>(() => resolveInitialView());
  const [selectedStudentTicketId, setSelectedStudentTicketId] = useState<string | null>(
    null,
  );
  const [selectedOpsTicketId, setSelectedOpsTicketId] = useState<string | null>(null);
  const [opsSection, setOpsSection] = useState<OpsSection>('overview');
  const [timeRange, setTimeRange] = useState<string>('Last 30 Days');

  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  const kpis = useMemo(() => computeKpis(state), [state]);
  const unreadNotifications = useMemo(
    () => state.notifications.filter((n) => n.unread).length,
    [state.notifications],
  );

  const handleSelectView = (view: AppView) => {
    setActiveView(view);
    if (view === 'student') {
      setSelectedStudentTicketId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateTicket = (input: CreateTicketInput): MaintenanceTicket => {
    const { nextState, createdTicket } = createTicketInState(state, input);
    setState(nextState);
    setSelectedOpsTicketId(createdTicket.id);
    return createdTicket;
  };

  const handleAssignTechnician = (params: {
    ticketId: string;
    technicianName: string;
    priority: IssuePriority;
    dueBy: string;
  }) => {
    setState((prev) => assignTechnicianInState(prev, params));
  };

  const handleUpdateTicketStatus = (params: StatusUpdateParams) => {
    setState((prev) => updateTicketStatusInState(prev, params));
  };

  const handleMarkNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, unread: false })),
    }));
  };

  const handleResetDemo = () => {
    setState(INITIAL_STATE);
    setSelectedStudentTicketId(null);
    setSelectedOpsTicketId(INITIAL_STATE.tickets[0]?.id || null);
  };

  const handleJumpToOperations = (ticketId?: string) => {
    if (ticketId) {
      setSelectedOpsTicketId(ticketId);
    }
    setOpsSection('overview');
    setActiveView('operations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewInStudentTracker = (ticketId: string) => {
    setSelectedStudentTicketId(ticketId);
    setActiveView('student');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0F172A]">
      <BrandHeader
        activeView={activeView}
        onSelectView={handleSelectView}
        onResetDemo={handleResetDemo}
        unreadNotifications={unreadNotifications}
      />

      {activeView === 'landing' && (
        <LandingView
          kpis={kpis}
          recentTickets={state.tickets}
          onNavigate={handleSelectView}
        />
      )}

      {activeView === 'student' && (
        <StudentPortalView
          tickets={state.tickets}
          notifications={state.notifications}
          kpis={kpis}
          selectedTicketId={selectedStudentTicketId}
          onSelectTicket={setSelectedStudentTicketId}
          onCreateTicket={handleCreateTicket}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onJumpToOperations={handleJumpToOperations}
        />
      )}

      {(activeView === 'operations' || activeView === 'analytics') && (
        <OperationsShell
          mode={activeView}
          activeSection={opsSection}
          onSelectSection={setOpsSection}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onNavigate={handleSelectView}
        >
          {activeView === 'operations' ? (
            <OperationsView
              tickets={state.tickets}
              activeSection={opsSection}
              selectedTicketId={selectedOpsTicketId}
              onSelectTicketId={setSelectedOpsTicketId}
              kpis={kpis}
              onAssignTechnician={handleAssignTechnician}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onViewInStudentTracker={handleViewInStudentTracker}
            />
          ) : (
            <AnalyticsView state={state} timeRange={timeRange} kpis={kpis} />
          )}
        </OperationsShell>
      )}
    </div>
  );
}
