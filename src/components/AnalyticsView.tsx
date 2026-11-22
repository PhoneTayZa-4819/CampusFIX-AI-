import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Ticket,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { CampusFixState } from '../types/campusFix';
import { ASSETS, ISSUE_TRENDS_BY_RANGE } from '../data/seedData';
import { computeAnalyticsData } from '../utils/campusFixStore';

interface AnalyticsViewProps {
  state: CampusFixState;
  timeRange: string;
  kpis: {
    execTotal: number;
    execResolved: number;
    resolutionRate: number;
    avgResolutionHours: string;
    slaCompliance: number;
  };
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  state,
  timeRange,
  kpis,
}) => {
  const analytics = computeAnalyticsData(state);
  const trendSeries =
    ISSUE_TRENDS_BY_RANGE[timeRange] || ISSUE_TRENDS_BY_RANGE['Last 30 Days'];

  // Slightly bump the latest reported/resolved data point to reflect live demo submissions
  const liveDelta = Math.max(0, state.tickets.length - 9);
  const dynamicTrends = trendSeries.map((pt, idx) =>
    idx === trendSeries.length - 1
      ? {
          ...pt,
          reported: pt.reported + liveDelta,
          resolved:
            pt.resolved +
            Math.max(
              0,
              state.tickets.filter((t) => t.status === 'Resolved').length - 2,
            ),
        }
      : pt,
  );

  return (
    <div className="space-y-6">
      {/* Top 4 Executive KPI Cards (Mockup 4 Bottom) */}
      <section
        aria-label="Executive Analytics KPIs"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Issues</p>
            <p
              data-testid="exec-kpi-total"
              className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
            >
              {kpis.execTotal.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▼ -14% <span className="font-normal text-slate-500">vs. prior 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Resolved Issues</p>
            <p
              data-testid="exec-kpi-resolved"
              className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5"
            >
              {kpis.execResolved.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▲ {kpis.resolutionRate}%{' '}
              <span className="font-normal text-slate-500">resolution rate</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg. Resolution Time</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5">
              {kpis.avgResolutionHours}
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▼ -32% <span className="font-normal text-slate-500">(was 10.9 hrs)</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">SLA Performance</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-0.5">
              {kpis.slaCompliance}%
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              ▲ +4 pp <span className="font-normal text-slate-500">(target ≥ 95%)</span>
            </p>
          </div>
        </div>
      </section>

      {/* 4 Interactive Recharts Cards (Matches Mockup 4 Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Issue Trends (Reported vs Resolved Area/Line Chart) */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Issue Trends
              </h2>
              <p className="text-xs text-slate-500">{timeRange} · Reported vs. Resolved</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                Reported
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />
                Resolved
              </span>
            </div>
          </div>

          <div className="h-64 w-full" data-testid="chart-issue-trends">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dynamicTrends}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reported"
                  name="Reported"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  fill="url(#reportedGrad)"
                  dot={{ r: 3, fill: '#EA580C' }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#1E3A8A"
                  strokeWidth={2.5}
                  fill="url(#resolvedGrad)"
                  dot={{ r: 3, fill: '#1E3A8A' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Issue Categories (Donut Chart) */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Issue Categories
            </h2>
            <p className="text-xs text-slate-500">% of Total Campus Issues</p>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4"
            data-testid="chart-issue-categories"
          >
            <div className="sm:col-span-6 h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {analytics.categories.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} tickets`, 'Volume']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-xl font-extrabold text-[#0F172A] tabular-nums">
                  {kpis.execTotal.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">Issues</span>
              </div>
            </div>

            <div className="sm:col-span-6 space-y-2.5">
              {analytics.categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <span className="inline-flex items-center gap-2 text-slate-700 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="font-bold text-[#0F172A] tabular-nums shrink-0">
                    {cat.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chart 3: Building Performance (Horizontal Bar Chart) */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Building Performance
            </h2>
            <p className="text-xs text-slate-500">SLA Resolution Rate by Campus Building</p>
          </div>

          <div className="h-60 w-full" data-testid="chart-building-performance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.buildingPerformance}
                layout="vertical"
                margin={{ top: 4, right: 28, left: 16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: '#0F172A', fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Resolution Rate']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="rate"
                  fill="#16A34A"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 4: Workload Distribution (Donut Chart) */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Workload Distribution
            </h2>
            <p className="text-xs text-slate-500">Active Tickets Assigned Across Technicians</p>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4"
            data-testid="chart-workload-distribution"
          >
            <div className="sm:col-span-6 h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.workloadDistribution}
                    dataKey="value"
                    nameKey="fullName"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {analytics.workloadDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} active tickets`, 'Assigned']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-xl font-extrabold text-[#0F172A] tabular-nums">
                  {analytics.workloadTotal}
                </span>
                <span className="text-xs text-slate-500">Active</span>
              </div>
            </div>

            <div className="sm:col-span-6 space-y-2.5">
              {analytics.workloadDistribution.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <span className="inline-flex items-center gap-2 text-slate-700 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className="font-bold text-[#0F172A] tabular-nums shrink-0">
                    {entry.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Executive Impact Dark Navy Banner (Mockup 4 Bottom) */}
      <section className="rounded-2xl overflow-hidden bg-[#0F172A] text-white border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 items-center divide-y sm:divide-y-0 xl:divide-x divide-slate-700/70">
          <div className="p-4 sm:p-5 flex items-center gap-3.5 sm:col-span-2 xl:col-span-1">
            <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-700">
              <img
                src={ASSETS.campusHero}
                alt="University campus building"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-snug">
                A Smarter, More Resilient Campus
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                AI-powered maintenance ops
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#F97316] shrink-0" />
            <div>
              <p className="font-display text-lg font-extrabold tabular-nums">+3.4× ROI</p>
              <p className="text-xs text-slate-300">Annual facility savings</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#F97316] shrink-0" />
            <div>
              <p className="font-display text-lg font-extrabold tabular-nums">
                -42% Lower Downtime
              </p>
              <p className="text-xs text-slate-300">Faster triage &amp; dispatch</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#F97316] shrink-0" />
            <div>
              <p className="font-display text-lg font-extrabold tabular-nums">
                {kpis.slaCompliance}% SLA Performance
              </p>
              <p className="text-xs text-slate-300">Measurable campus-wide</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#F97316] shrink-0" />
            <div>
              <p className="font-display text-lg font-extrabold">Multi-Campus Scalable</p>
              <p className="text-xs text-slate-300">Built for universities</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
