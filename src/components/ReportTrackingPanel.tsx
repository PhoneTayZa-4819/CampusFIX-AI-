import React from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Wrench,
  ImageIcon,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { VerificationResult } from './OperationsView';
import { MaintenanceTicket } from '../types/campusFix';
import { getTrackingSteps } from '../utils/campusFixStore';

interface ReportTrackingPanelProps {
  ticket: MaintenanceTicket;
  onBack: () => void;
  onJumpToOperations?: () => void;
}

export const ReportTrackingPanel: React.FC<ReportTrackingPanelProps> = ({
  ticket,
  onBack,
  onJumpToOperations,
}) => {
  const steps = getTrackingSteps(ticket);
  const isResolved = ticket.status === 'Resolved';

  const statusTone = isResolved
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : ticket.status === 'Pending Parts'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-sky-700 bg-sky-50 border-sky-200';

  const priorityTone =
    ticket.priority === 'High'
      ? 'text-red-700'
      : ticket.priority === 'Medium'
        ? 'text-amber-700'
        : 'text-slate-600';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#EA580C] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Dashboard</span>
        </button>

        {onJumpToOperations && (
          <button
            type="button"
            onClick={onJumpToOperations}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#0F172A] bg-white border border-slate-200 hover:border-[#EA580C] hover:text-[#EA580C] transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Update as Staff in Operations</span>
          </button>
        )}
      </div>

      {/* Main Tracking Card (Matches Mockup 3) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] tabular-nums">
                Report Tracking — {ticket.code}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusTone}`}
              >
                {isResolved ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {ticket.status}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800">{ticket.title}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {ticket.building} · {ticket.room}
              </span>
              <span aria-hidden="true">·</span>
              <span>{ticket.categoryDisplay}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-semibold ${priorityTone}`}>
                {ticket.priority} Priority
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                AI Confidence {ticket.confidenceScore}%
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
            <p>
              Assigned Tech:{' '}
              <span className="font-semibold text-[#0F172A]">
                {ticket.assignedTo || 'Pending Dispatch'}
              </span>
            </p>
            <p>
              Target SLA:{' '}
              <span className="font-medium text-slate-700">{ticket.dueBy}</span>
            </p>
          </div>
        </div>

        {/* 5-Step Progress Stepper */}
        <div className="px-6 py-7 border-b border-slate-100 bg-[#FAFBFC]">
          {/* Desktop Horizontal Stepper */}
          <ol
            aria-label="Report resolution progress"
            className="hidden md:grid grid-cols-5 gap-2 relative"
          >
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <li
                  key={step.key}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Connector line to next step */}
                  {!isLast && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 ${
                        steps[index + 1].completed
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Circle Indicator */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      step.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    } ${step.active && step.completed ? 'ring-4 ring-emerald-100' : ''}`}
                  >
                    {step.completed ? (
                      <Check className="w-4 h-4 stroke-[2.75]" />
                    ) : (
                      <span className="text-xs font-semibold tabular-nums">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <p
                    className={`mt-2.5 text-sm font-bold ${
                      step.completed ? 'text-[#0F172A]' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {step.timestamp || 'Pending'}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* Mobile Vertical Stepper */}
          <ol
            aria-label="Report resolution progress mobile"
            className="md:hidden space-y-3"
          >
            {steps.map((step, index) => (
              <li key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                      step.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-0.5 h-6 mt-1 ${
                        steps[index + 1].completed ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-xl px-3.5 py-2.5 border ${
                    step.active
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <p className="text-sm font-bold text-[#0F172A]">{step.label}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {step.timestamp || 'Waiting for next update'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Before / After Repair Photos + Technician Updates Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Before & After Photos */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
                <img
                  src={ticket.beforePhoto}
                  alt={`Before repair photo for ${ticket.title}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-xs font-semibold inline-flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Before Repair
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Submitted by {ticket.reporterName} · {ticket.trackingTimestamps.submitted}
              </p>
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-50 border border-slate-200 flex items-center justify-center">
                {ticket.afterPhoto ? (
                  <>
                    <img
                      src={ticket.afterPhoto}
                      alt={`After repair verification photo for ${ticket.title}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-emerald-700/90 text-white text-xs font-semibold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      After Repair
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      After-Repair Photo Pending
                    </p>
                    <p className="text-xs text-slate-500">
                      Verification photo appears automatically once facilities marks this
                      ticket Resolved.
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {ticket.afterPhoto
                  ? `Verified by ${ticket.assignedTo || 'Facilities Team'}`
                  : 'Awaiting repair completion'}
              </p>
              {ticket.aiVerification && (
                <VerificationResult verification={ticket.aiVerification} />
              )}
            </div>

            {/* Issue Description Summary */}
            <div className="sm:col-span-2 rounded-xl bg-[#F5F7FA] p-4 border border-slate-200/70">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Reported Problem Summary
              </p>
              <p className="text-sm text-[#0F172A] leading-relaxed">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Technician Updates Timeline */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-[#FAFBFC] p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/70">
              <Wrench className="w-4 h-4 text-[#EA580C]" />
              <h3 className="font-display text-base font-bold text-[#0F172A]">
                Technician Updates
              </h3>
            </div>

            {ticket.technicianUpdates.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <ShieldAlert className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                No technician updates logged yet.
              </div>
            ) : (
              <ol className="space-y-4 relative flex-1">
                {ticket.technicianUpdates.map((upd, idx) => (
                  <li key={upd.id} className="relative pl-6">
                    {idx < ticket.technicianUpdates.length - 1 && (
                      <span
                        className="absolute left-[7px] top-3 bottom-[-20px] w-0.5 bg-orange-200"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-[#EA580C] ring-4 ring-orange-100"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-bold text-[#0F172A] tabular-nums">
                      {upd.timestamp} ·{' '}
                      <span className="font-medium text-slate-500">{upd.author}</span>
                    </p>
                    <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">
                      {upd.message}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
