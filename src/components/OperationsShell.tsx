import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  Calendar,
  Wrench,
  GraduationCap,
} from 'lucide-react';
import { AppView } from '../types/campusFix';

export type OpsSection =
  | 'overview'
  | 'tickets'
  | 'technicians'
  | 'buildings';

interface OperationsShellProps {
  mode: 'operations' | 'analytics';
  activeSection: OpsSection;
  onSelectSection: (section: OpsSection) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const OperationsShell: React.FC<OperationsShellProps> = ({
  mode,
  activeSection,
  onSelectSection,
  timeRange,
  onTimeRangeChange,
  onNavigate,
  children,
}) => {
  const sidebarItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      id: 'ops',
      label: 'Operations Dashboard',
      icon: LayoutDashboard,
      isActive: mode === 'operations' && activeSection === 'overview',
      onClick: () => {
        onSelectSection('overview');
        onNavigate('operations');
      },
    },
    {
      id: 'exec',
      label: 'Executive Dashboard',
      icon: Briefcase,
      isActive: mode === 'analytics',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'tickets',
      label: 'Tickets & Work Orders',
      icon: ClipboardList,
      isActive: mode === 'operations' && activeSection === 'tickets',
      onClick: () => {
        onSelectSection('tickets');
        onNavigate('operations');
      },
    },
    {
      id: 'techs',
      label: 'Technicians',
      icon: Users,
      isActive: mode === 'operations' && activeSection === 'technicians',
      onClick: () => {
        onSelectSection('technicians');
        onNavigate('operations');
      },
    },
    {
      id: 'buildings',
      label: 'Buildings & Assets',
      icon: Building2,
      isActive: mode === 'operations' && activeSection === 'buildings',
      onClick: () => {
        onSelectSection('buildings');
        onNavigate('operations');
      },
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      isActive: false,
      onClick: () => onNavigate('analytics'),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] pb-20 lg:pb-10">
      <div className="max-w-[1440px] mx-auto flex">
        {/* Desktop Left Sidebar (Mockup 4) */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4">
          <p className="px-3 py-2 text-xs font-bold text-slate-400 tracking-wide">
            Campus Operations
          </p>
          <nav aria-label="Operations Sidebar" className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    item.isActive
                      ? 'bg-[#EA580C] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => onNavigate('student')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#0F172A] bg-[#F5F7FA] hover:bg-orange-50 hover:text-[#EA580C] transition-colors cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 shrink-0 text-[#EA580C]" />
              <span>Preview Student View</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 space-y-6">
          {/* Workspace Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#EA580C]">
                AI-Powered Campus Maintenance
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {mode === 'operations'
                  ? 'Maintenance Operations Dashboard'
                  : 'Executive Dashboard — Campus Maintenance Analytics'}
              </h1>
              <p className="text-sm text-slate-600">
                {mode === 'operations'
                  ? 'Real-time maintenance operations, technician dispatch, and repair activity across campus.'
                  : 'Enterprise visibility into maintenance performance, service levels, and campus facility health.'}
              </p>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="relative inline-flex items-center">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <select
                  aria-label="Select analytics time range"
                  value={timeRange}
                  onChange={(e) => onTimeRangeChange(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-[#0F172A] shadow-2xs focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 cursor-pointer"
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Semester">This Semester</option>
                </select>
              </div>
            </div>
          </div>

          {/* Segmented View Toggle: Operations (Staff View) | Executive Analytics (Admin View) */}
          <div
            role="tablist"
            aria-label="Workspace Role View"
            className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'operations'}
              onClick={() => onNavigate('operations')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'operations'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Operations (Staff View)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'analytics'}
              onClick={() => onNavigate('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'analytics'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Executive Analytics (Admin View)</span>
            </button>
          </div>

          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Mockup 4 Mobile) */}
      <nav
        aria-label="Operations Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 grid grid-cols-4 gap-1"
      >
        <button
          type="button"
          onClick={() => {
            onSelectSection('overview');
            onNavigate('operations');
          }}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold ${
            mode === 'operations' && activeSection === 'overview'
              ? 'text-[#EA580C]'
              : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSelectSection('tickets');
            onNavigate('operations');
          }}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold ${
            mode === 'operations' && activeSection === 'tickets'
              ? 'text-[#EA580C]'
              : 'text-slate-500'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span>Tickets</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold ${
            mode === 'analytics' ? 'text-[#EA580C]' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Analytics</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('student')}
          className="flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold text-slate-500"
        >
          <GraduationCap className="w-5 h-5 mb-0.5" />
          <span>Student</span>
        </button>
      </nav>
    </div>
  );
};
