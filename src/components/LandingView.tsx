import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  Check,
  Zap,
  BrainCircuit,
  Layers,
  BarChart3,
  Camera,
  Cpu,
  Wrench,
  LineChart,
  TrendingDown,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AppView, MaintenanceTicket } from '../types/campusFix';
import { ASSETS } from '../data/seedData';
import { CampusFixLogo } from './BrandHeader';

interface LandingViewProps {
  kpis: {
    studentTotal: number;
    studentResolved: number;
    resolutionRate: number;
  };
  recentTickets: MaintenanceTicket[];
  onNavigate: (view: AppView) => void;
}

const FEATURES = [
  {
    title: 'Faster Issue Resolution',
    description:
      'Turn student reports into dispatched work orders quickly and reduce campus downtime.',
    icon: Zap,
    highlighted: true,
  },
  {
    title: 'AI Triage & Prioritization',
    description:
      'Automatically classify issues from photos and suggest priority for faster, smarter handling.',
    icon: BrainCircuit,
    highlighted: false,
  },
  {
    title: 'Transparent Tracking',
    description:
      'Real-time status updates, technician notes, and before/after proof for students and staff.',
    icon: Layers,
    highlighted: false,
  },
  {
    title: 'Operational Efficiency',
    description:
      'Optimize maintenance resources with building performance analytics and workload insights.',
    icon: BarChart3,
    highlighted: false,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Capture Issue',
    description: 'Students report a facility problem with a photo and building location.',
    icon: Camera,
  },
  {
    step: 2,
    title: 'AI Analysis',
    description: 'AI classifies the issue (e.g., HVAC, electrical, plumbing) and sets priority.',
    icon: Cpu,
  },
  {
    step: 3,
    title: 'Assign & Repair',
    description: 'A work order is assigned to a technician who repairs and updates status.',
    icon: Wrench,
  },
  {
    step: 4,
    title: 'Analytics & Reporting',
    description: 'Administrators monitor SLA performance, trends, and campus facility health.',
    icon: LineChart,
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  kpis,
  recentTickets,
  onNavigate,
}) => {
  const [overviewOpen, setOverviewOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0F172A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-[#F5F7FA] border-b border-slate-200/70">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] tracking-tight">
                <Zap className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>AI-Powered Campus Maintenance</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.08] text-[#0F172A] [text-wrap:balance]">
                Smarter Campus Maintenance,{' '}
                <span className="text-[#EA580C]">Powered by AI</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                A unified, AI-driven platform to report, triage, and resolve campus
                facility issues — keeping your university safe, functional, and
                student-ready.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('student')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#F97316] shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#EA580C]"
                >
                  <span>Get a Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setOverviewOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[#0F172A] bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch 2-Min Overview</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs sm:text-sm font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#EA580C]" />
                  For Universities
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#EA580C]" />
                  Enterprise-Ready
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#EA580C]" />
                  AI-Powered
                </span>
              </div>
            </div>

            {/* Hero Right: Interactive Live Laptop + Phone Device Showcase */}
            <div className="lg:col-span-7 relative">
              <div className="relative mx-auto max-w-[680px]">
                {/* Soft Warm Halo Behind Devices */}
                <div
                  className="absolute -inset-4 bg-gradient-to-tr from-[#F97316]/12 via-slate-200/30 to-sky-100/40 rounded-3xl blur-2xl pointer-events-none"
                  aria-hidden="true"
                />

                {/* Laptop Frame */}
                <div className="relative bg-[#0F172A] rounded-2xl p-2 sm:p-2.5 shadow-xl border border-slate-800">
                  <div className="bg-[#F8FAFC] rounded-xl overflow-hidden border border-slate-200/80">
                    {/* Mini Laptop Top Chrome */}
                    <div className="bg-[#132238] px-3.5 py-2 flex items-center justify-between text-white">
                      <span className="text-xs font-display font-bold tracking-tight">
                        CampusFix <span className="text-[#F97316]">AI</span>
                      </span>
                      <span className="text-[11px] text-slate-300">
                        Campus Maintenance Dashboard · Last 30 Days
                      </span>
                    </div>

                    <div className="grid grid-cols-12 min-h-[285px]">
                      {/* Mini Sidebar */}
                      <div className="hidden sm:flex col-span-3 bg-[#132238] text-slate-300 p-2.5 flex-col gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => onNavigate('operations')}
                          className="text-left px-2.5 py-1.5 rounded-md bg-[#EA580C] text-white font-semibold cursor-pointer"
                        >
                          Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('operations')}
                          className="text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 cursor-pointer"
                        >
                          Tickets
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('student')}
                          className="text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 cursor-pointer"
                        >
                          Student Intake
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('analytics')}
                          className="text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 cursor-pointer"
                        >
                          Analytics
                        </button>
                      </div>

                      {/* Mini Dashboard Content */}
                      <div className="col-span-12 sm:col-span-9 p-3.5 space-y-3">
                        {/* 4 Mini KPI Tiles */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                            <p className="text-sm font-bold text-[#0F172A] tabular-nums">
                              {kpis.studentTotal}
                            </p>
                            <p className="text-[10px] text-slate-500">Active Tickets</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                            <p className="text-sm font-bold text-emerald-700 tabular-nums">
                              {kpis.studentResolved + 204}
                            </p>
                            <p className="text-[10px] text-slate-500">Resolved</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                            <p className="text-sm font-bold text-[#EA580C] tabular-nums">
                              1.8d
                            </p>
                            <p className="text-[10px] text-slate-500">Avg. Response</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                            <p className="text-sm font-bold text-[#0F172A] tabular-nums">
                              {kpis.resolutionRate}%
                            </p>
                            <p className="text-[10px] text-slate-500">Closure Rate</p>
                          </div>
                        </div>

                        {/* Mini Trend & Donut Preview */}
                        <div className="grid grid-cols-12 gap-2.5">
                          <div className="col-span-7 bg-white rounded-lg p-2.5 border border-slate-200/80">
                            <p className="text-[11px] font-semibold text-[#0F172A] mb-1.5">
                              Issue Trends
                            </p>
                            <svg
                              viewBox="0 0 220 72"
                              className="w-full h-16"
                              aria-label="Issue resolution trend preview"
                            >
                              <defs>
                                <linearGradient id="heroTrendFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.32" />
                                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
                                </linearGradient>
                              </defs>
                              <path
                                d="M0 58 Q 28 36, 56 44 T 112 30 T 168 20 T 220 26 L 220 72 L 0 72 Z"
                                fill="url(#heroTrendFill)"
                              />
                              <path
                                d="M0 58 Q 28 36, 56 44 T 112 30 T 168 20 T 220 26"
                                fill="none"
                                stroke="#EA580C"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>

                          <div className="col-span-5 bg-white rounded-lg p-2.5 border border-slate-200/80 flex flex-col justify-between">
                            <p className="text-[11px] font-semibold text-[#0F172A]">
                              Top Issue Types
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <svg viewBox="0 0 40 40" className="w-12 h-12 shrink-0" aria-hidden="true">
                                <circle cx="20" cy="20" r="14" fill="none" stroke="#1E40AF" strokeWidth="6" strokeDasharray="32 56" />
                                <circle cx="20" cy="20" r="14" fill="none" stroke="#F97316" strokeWidth="6" strokeDasharray="24 64" strokeDashoffset="-32" />
                                <circle cx="20" cy="20" r="14" fill="none" stroke="#0EA5E9" strokeWidth="6" strokeDasharray="18 70" strokeDashoffset="-56" />
                                <circle cx="20" cy="20" r="14" fill="none" stroke="#16A34A" strokeWidth="6" strokeDasharray="14 74" strokeDashoffset="-74" />
                              </svg>
                              <div className="text-[10px] text-slate-600 space-y-0.5 tabular-nums">
                                <p>Electrical · 32%</p>
                                <p>Plumbing · 24%</p>
                                <p>HVAC · 18%</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mini Recent Tickets */}
                        <div className="bg-white rounded-lg p-2.5 border border-slate-200/80">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] font-semibold text-[#0F172A]">
                              Recent Tickets
                            </p>
                            <button
                              type="button"
                              onClick={() => onNavigate('operations')}
                              className="text-[10px] font-semibold text-[#EA580C] hover:underline cursor-pointer"
                            >
                              Open Queue →
                            </button>
                          </div>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {recentTickets.slice(0, 2).map((ticket) => (
                              <div
                                key={ticket.id}
                                className="py-1.5 flex items-center justify-between gap-2"
                              >
                                <span className="font-mono text-slate-700 font-medium">
                                  {ticket.code}
                                </span>
                                <span className="truncate text-[#0F172A] flex-1">
                                  {ticket.title}
                                </span>
                                <span className="text-slate-500 hidden sm:inline">
                                  {ticket.building}
                                </span>
                                <span className="text-[#EA580C] font-semibold">
                                  {ticket.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlapping Mobile App Preview Card */}
                <button
                  type="button"
                  onClick={() => onNavigate('student')}
                  className="hidden sm:block absolute -left-5 -bottom-6 w-[188px] bg-[#0F172A] rounded-[22px] p-1.5 shadow-2xl border border-slate-700 text-left transition-transform duration-200 hover:-translate-y-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                  aria-label="Open Student Mobile Reporting Experience"
                >
                  <div className="bg-white rounded-[17px] overflow-hidden">
                    <div className="bg-[#132238] px-3 py-2 text-white text-[10px] font-display font-bold">
                      CampusFix <span className="text-[#F97316]">AI</span>
                    </div>
                    <div className="p-2.5 space-y-2">
                      <p className="text-xs font-bold text-[#0F172A]">Report an Issue</p>
                      <div className="rounded-lg overflow-hidden aspect-[4/3] bg-slate-100">
                        <img
                          src={ASSETS.ceilingLight}
                          alt="Flickering classroom ceiling light sample"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                        <p className="text-[10px] font-semibold text-[#EA580C]">
                          AI Detection
                        </p>
                        <p className="text-xs font-bold text-[#0F172A]">
                          Broken Light · High
                        </p>
                      </div>
                      <div className="w-full py-1.5 rounded-lg bg-[#EA580C] text-white text-center text-[11px] font-semibold">
                        Submit Report
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Feature Cards Row */}
          <div className="mt-14 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`rounded-2xl p-6 border transition-shadow duration-150 ${
                    feat.highlighted
                      ? 'bg-[#FFF5EC] border-orange-200/80 shadow-xs'
                      : 'bg-white border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-[#EA580C] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-display text-base font-bold text-[#0F172A] leading-snug">
                        {feat.title}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How CampusFix AI Works Section */}
      <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            How <span className="text-[#EA580C]">CampusFix AI</span> Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            From a smartphone photo to a verified fix — in 4 connected steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
          {HOW_IT_WORKS_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative flex items-stretch">
                <div className="w-full bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-full bg-[#EA580C] text-white text-xs font-bold inline-flex items-center justify-center tabular-nums">
                      {item.step}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Step 0{item.step}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#132238] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#0F172A] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div
                    className="hidden md:flex items-center justify-center absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-[#EA580C]"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Proven Impact Dark Navy Banner */}
        <div className="mt-12 rounded-2xl overflow-hidden bg-[#0F172A] text-white border border-slate-800 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-700/70">
            {/* Campus Photo + Title */}
            <div className="lg:col-span-4 relative flex items-center gap-4 p-5 sm:p-6">
              <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
                <img
                  src={ASSETS.campusHero}
                  alt="University main academic hall"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold leading-snug text-white">
                  Proven Impact for a Better Campus
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Measurable maintenance outcomes campus-wide
                </p>
              </div>
            </div>

            {/* Metric 1 */}
            <div className="lg:col-span-3 p-5 sm:p-6 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#F97316] flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums">
                  68%
                </p>
                <p className="text-xs text-slate-300">
                  Faster Response Time (vs. manual)
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="lg:col-span-3 p-5 sm:p-6 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#F97316] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums">
                  {kpis.resolutionRate}%
                </p>
                <p className="text-xs text-slate-300">
                  Issue Closure Rate (within target SLA)
                </p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="lg:col-span-2 p-5 sm:p-6 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#F97316] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums">
                  {kpis.studentTotal}
                </p>
                <p className="text-xs text-slate-300">Active Tickets</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Deep Navy Footer */}
      <footer className="mt-auto bg-[#0B1324] text-slate-400 border-t border-slate-800/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <CampusFixLogo compact />
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-300">
            <button
              type="button"
              onClick={() => onNavigate('student')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('operations')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Maintenance Operations
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Executive Analytics
            </button>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 CampusFix AI. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 2-Min Interactive Overview Modal */}
      {overviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="overview-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0F172A] px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h2 id="overview-modal-title" className="font-display text-lg font-bold">
                  CampusFix AI — Live Prototype Walkthrough
                </h2>
                <p className="text-xs text-slate-300">
                  Every role below shares live state in real time
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverviewOpen(false)}
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label="Close walkthrough modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 bg-[#F5F7FA] border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-[#EA580C]">01. Student Intake</span>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Photo + AI Triage
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pick a sample issue or upload any photo, run AI classification, and
                    submit directly to facilities.
                  </p>
                </div>
                <div className="rounded-xl p-4 bg-[#F5F7FA] border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-[#EA580C]">02. Staff Dispatch</span>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Assign & Repair
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    New tickets appear instantly at the top of the queue. Assign a tech
                    and log live status updates.
                  </p>
                </div>
                <div className="rounded-xl p-4 bg-[#F5F7FA] border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-[#EA580C]">03. Live Sync</span>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    5-Step Tracking & ROI
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Students see the 5-step tracker and technician notes update live while
                    admins monitor campus analytics.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOverviewOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverviewOpen(false);
                    onNavigate('student');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#F97316] cursor-pointer"
                >
                  <span>Start Student Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
