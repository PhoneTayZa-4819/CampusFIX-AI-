import React, { useEffect, useRef, useState } from 'react';
import {
  Megaphone,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Bell,
  FileText,
  MapPin,
  HelpCircle,
  PlusCircle,
  ChevronRight,
  X,
  Home,
  ClipboardList,
  Layers,
  Gauge,
  Flag,
  Tag,
  Wrench,
  Edit3,
  AlertCircle,
  Copy,
} from 'lucide-react';
import {
  AiAnalysisResult,
  MaintenanceTicket,
  StudentNotification,
} from '../types/campusFix';
import {
  ASSETS,
  CAMPUS_BUILDINGS,
  SAMPLE_ISSUE_PRESETS,
} from '../data/seedData';
import {
  classifyIssueInput,
  findPossibleDuplicates,
  CreateTicketInput,
  validateNewReportInput,
} from '../utils/campusFixStore';
import { analyzeIssue } from '../utils/aiAnalysis';
import { ReportTrackingPanel } from './ReportTrackingPanel';

interface StudentPortalViewProps {
  tickets: MaintenanceTicket[];
  notifications: StudentNotification[];
  kpis: {
    studentTotal: number;
    studentInProgress: number;
    studentResolved: number;
  };
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string | null) => void;
  onCreateTicket: (input: CreateTicketInput) => MaintenanceTicket;
  onMarkNotificationsRead: () => void;
  onJumpToOperations: (ticketId?: string) => void;
}

type MobileTab = 'home' | 'report' | 'reports' | 'alerts';

const ANALYSIS_STAGES = [
  'Reading the photo',
  'Identifying the fault',
  'Checking for safety risks',
  'Setting the priority',
  'Writing the technician brief',
];

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  tickets,
  notifications,
  kpis,
  selectedTicketId,
  onSelectTicket,
  onCreateTicket,
  onMarkNotificationsRead,
  onJumpToOperations,
}) => {
  const reportFormRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mobileTab, setMobileTab] = useState<MobileTab>('home');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(ASSETS.ceilingLight);
  const [photoName, setPhotoName] = useState<string>('ceiling-light.jpg (1.9 MB)');
  const [hasPhoto, setHasPhoto] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [building, setBuilding] = useState<string>('North Hall');
  const [room, setRoom] = useState<string>('Room 204');
  const [description, setDescription] = useState<string>(
    "The ceiling light is flickering and sometimes turns off. It's been happening for the last few days.",
  );

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeStage, setAnalyzeStage] = useState<number>(0);

  // Walk through the analysis stages while Gemini works, holding on the last one.
  useEffect(() => {
    if (!isAnalyzing) {
      setAnalyzeStage(0);
      return;
    }
    const id = window.setInterval(() => {
      setAnalyzeStage((s) => Math.min(s + 1, ANALYSIS_STAGES.length - 1));
    }, 2600);
    return () => window.clearInterval(id);
  }, [isAnalyzing]);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [editableAiDescription, setEditableAiDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<MaintenanceTicket | null>(null);

  const [infoModal, setInfoModal] = useState<'campus' | 'faq' | null>(null);
  const [showAllReports, setShowAllReports] = useState<boolean>(false);

  const selectedTicket = selectedTicketId
    ? tickets.find((t) => t.id === selectedTicketId) || null
    : null;

  const availableRooms = CAMPUS_BUILDINGS[building] || ['Room 101'];
  const currentStep = submittedTicket ? 3 : aiResult ? 2 : 1;
  const duplicates = aiResult
    ? findPossibleDuplicates(tickets, { building, room, category: aiResult.category })
    : [];

  const handleBuildingChange = (nextBuilding: string) => {
    setBuilding(nextBuilding);
    const nextRooms = CAMPUS_BUILDINGS[nextBuilding] || ['Main Floor'];
    setRoom(nextRooms[0]);
    setFormError(null);
  };

  const handleSelectSample = (sampleId: string) => {
    const preset = SAMPLE_ISSUE_PRESETS.find((s) => s.id === sampleId);
    if (!preset) return;
    setSelectedSampleId(preset.id);
    setPhotoPreview(preset.photo);
    setPhotoName(`${preset.fileName} (${preset.fileSize})`);
    setHasPhoto(true);
    setBuilding(preset.building);
    setRoom(preset.room);
    setDescription(preset.initialDescription);
    setAiResult(null);
    setEditableAiDescription('');
    setSubmittedTicket(null);
    setFormError(null);
  };

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a JPG, PNG, or WEBP image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
        setPhotoName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
        setHasPhoto(true);
        setSelectedSampleId(null);
        setAiResult(null);
        setSubmittedTicket(null);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithAi = () => {
    const validationError = validateNewReportInput({
      building,
      room,
      description,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setSubmittedTicket(null);
    setIsAnalyzing(true);

    analyzeIssue({
      sampleId: selectedSampleId,
      building,
      room,
      description,
      fileName: photoName,
      photoUrl: hasPhoto ? photoPreview : null,
    }).then((analysis) => {
      setAiResult(analysis);
      setEditableAiDescription(analysis.generatedDescription);
      setIsAnalyzing(false);
    });
  };

  const handleSubmitReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalDesc = (aiResult ? editableAiDescription : description).trim();
    const validationError = validateNewReportInput({
      building,
      room,
      description: finalDesc,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    const analysis =
      aiResult ||
      classifyIssueInput({
        sampleId: selectedSampleId,
        building,
        room,
        description: finalDesc,
        fileName: photoName,
      });

    const created = onCreateTicket({
      title: analysis.classification,
      description: finalDesc,
      building,
      room,
      category: analysis.category,
      categoryDisplay: analysis.categoryDisplay,
      priority: analysis.suggestedPriority,
      confidenceScore: analysis.confidence,
      beforePhoto: hasPhoto ? photoPreview : ASSETS.ceilingLight,
    });

    setSubmittedTicket(created);
    setAiResult(null);
  };

  const handleStartAnotherReport = () => {
    setSubmittedTicket(null);
    setAiResult(null);
    setSelectedSampleId(null);
    setDescription('');
    setFormError(null);
  };

  const scrollToForm = () => {
    setMobileTab('report');
    onSelectTicket(null);
    window.setTimeout(() => {
      reportFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // If a specific report is open, display the dedicated 5-Step Tracking View (Mockup 3)
  if (selectedTicket) {
    return (
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <ReportTrackingPanel
          ticket={selectedTicket}
          onBack={() => onSelectTicket(null)}
          onJumpToOperations={() => onJumpToOperations(selectedTicket.id)}
        />
      </main>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] pb-24 md:pb-12">
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Welcome Hero Banner with Campus Photo (Mockup 2) */}
        <section className="relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 p-6 sm:p-8 relative z-10 space-y-2.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" aria-hidden="true" />
                <span>Student Dashboard · Fall Semester</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Welcome Back, <span className="text-[#EA580C]">Alex!</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-md leading-relaxed">
                Report campus facility issues in seconds, let AI triage priority, and
                track repairs from submission to verified completion.
              </p>
            </div>

            <div className="hidden lg:block lg:col-span-6 relative h-48 overflow-hidden">
              <img
                src={ASSETS.campusHero}
                alt="Sunlit university campus academic building"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-white via-white/35 to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        {/* Top 3 Dynamic KPI Cards (Mockup 2) */}
        <section
          aria-label="Student Report Metrics"
          className="grid grid-cols-3 gap-3 sm:gap-5"
        >
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#EA580C] hidden sm:flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p
                data-testid="student-kpi-total"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {kpis.studentTotal}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                Total Reports
              </p>
              <p className="hidden sm:block text-xs text-slate-500">All time</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 hidden sm:flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p
                data-testid="student-kpi-in-progress"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {kpis.studentInProgress}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                In Progress
              </p>
              <p className="hidden sm:block text-xs text-slate-500">
                Currently being worked on
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 hidden sm:flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p
                data-testid="student-kpi-resolved"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums"
              >
                {kpis.studentResolved}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                Resolved
              </p>
              <p className="hidden sm:block text-xs text-slate-500">
                Fixed and closed
              </p>
            </div>
          </div>
        </section>

        {/* Main 3-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dark Navy CTA + Quick Actions */}
          <aside
            className={`lg:col-span-3 space-y-5 ${
              mobileTab !== 'home' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Dark Navy Report an Issue Card */}
            <div className="rounded-2xl bg-[#132238] text-white p-6 border border-slate-800 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-bold text-white">
                  Report an Issue
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Spotted a problem on campus? Tell us what&apos;s wrong, add a photo, and
                  AI routes it to the right team.
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToForm}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#F97316] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>Report an Issue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Quick Actions
              </h2>
              <div className="divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="w-full py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-[#EA580C]" />
                    Report an Issue
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tickets[0]) onSelectTicket(tickets[0].id);
                  }}
                  className="w-full py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#EA580C]" />
                    Track My Reports
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setInfoModal('campus')}
                  className="w-full py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#EA580C]" />
                    View Campus Buildings
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setInfoModal('faq')}
                  className="w-full py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#EA580C]" />
                    Help &amp; FAQ
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </aside>

          {/* Center Column: Interactive 3-Step Report an Issue + AI Analysis Result */}
          <section
            ref={reportFormRef}
            className={`lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 ${
              mobileTab === 'reports' || mobileTab === 'alerts'
                ? 'hidden lg:block'
                : 'block'
            }`}
          >
            {/* Header + 3-Step Indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#EA580C]" />
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">
                    Report an Issue
                  </h2>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Step {currentStep} of 3
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                {[
                  { num: 1, label: 'Details' },
                  { num: 2, label: 'AI Review' },
                  { num: 3, label: 'Submitted' },
                ].map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] tabular-nums ${
                          currentStep >= s.num
                            ? 'bg-[#EA580C] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {currentStep > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                      </span>
                      <span
                        className={
                          currentStep >= s.num ? 'text-[#0F172A]' : 'text-slate-400'
                        }
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full ${
                          currentStep > s.num ? 'bg-[#EA580C]' : 'bg-slate-200'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Quick Sample Issue Presets for Fast Live Demoing */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">
                Quick Demo Samples (1-Click Fill)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_ISSUE_PRESETS.map((sample) => {
                  const active = selectedSampleId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap truncate ${
                        active
                          ? 'bg-orange-50 border-[#EA580C] text-[#EA580C]'
                          : 'bg-[#F5F7FA] border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {sample.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3 Confirmation Banner */}
            {submittedTicket ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-emerald-950">
                      Report #{submittedTicket.code} Submitted!
                    </h3>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      Your report for <strong>{submittedTicket.building}</strong> (
                      {submittedTicket.room}) is now live in the Facilities Operations
                      queue with <strong>{submittedTicket.priority}</strong> priority.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectTicket(submittedTicket.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#F97316] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <span>Track 5-Step Progress</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onJumpToOperations(submittedTicket.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#132238] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Open in Staff Ops</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAnotherReport}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium cursor-pointer"
                  >
                    Report Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {/* Photo Preview + Drag-and-Drop Uploader */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0F172A]">
                    Add a Photo{' '}
                    <span className="font-normal text-slate-400">(Recommended for AI)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Selected Photo Frame with Scanning Overlay */}
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
                      {hasPhoto ? (
                        <>
                          <img
                            src={photoPreview}
                            alt="Uploaded facility maintenance issue preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {!isAnalyzing && (
                            <button
                              type="button"
                              onClick={() => setHasPhoto(false)}
                              aria-label="Remove selected photo"
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/75 text-white hover:bg-slate-900 flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent px-2.5 py-1.5">
                            <p className="text-[11px] text-white truncate font-medium">
                              {photoName}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                          <UploadCloud className="w-6 h-6 mb-1" />
                          <span className="text-xs">No photo selected</span>
                        </div>
                      )}

                      {/* Smooth 1-Second AI Laser Scanning Animation */}
                      {isAnalyzing && (
                        <div
                          aria-live="polite"
                          className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-3"
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-1 bg-[#F97316] shadow-[0_0_16px_4px_rgba(249,115,22,0.8)] animate-ai-scan"
                            aria-hidden="true"
                          />
                          <Sparkles className="w-6 h-6 text-[#F97316] mb-1.5" />
                          <p className="text-xs font-bold tracking-wide">
                            Gemini is analyzing...
                          </p>
                          <p
                            key={analyzeStage}
                            className="text-[11px] text-slate-200 mt-0.5 animate-fade-in"
                          >
                            {ANALYSIS_STAGES[analyzeStage]}
                          </p>
                          <div className="mt-2 flex gap-1" aria-hidden="true">
                            {ANALYSIS_STAGES.map((_, i) => (
                              <span
                                key={i}
                                className={`h-1 w-5 rounded-full transition-colors duration-300 ${
                                  i <= analyzeStage ? 'bg-[#F97316]' : 'bg-white/25'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Drag & Drop Target */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFileSelected(e.dataTransfer.files?.[0]);
                      }}
                      className={`rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-colors ${
                        isDragging
                          ? 'border-[#EA580C] bg-orange-50/70'
                          : 'border-slate-200 bg-[#FAFBFC] hover:border-slate-300'
                      }`}
                    >
                      <UploadCloud className="w-6 h-6 text-slate-500 mb-2" />
                      <p className="text-sm font-semibold text-[#0F172A]">Upload Photo</p>
                      <p className="text-xs text-slate-500 mt-0.5 mb-2.5">
                        Drag &amp; drop or choose JPG, PNG
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        id="issue-photo-upload"
                        onChange={(e) => handleFileSelected(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0F172A] hover:border-[#EA580C] hover:text-[#EA580C] transition-colors cursor-pointer"
                      >
                        Browse Image
                      </button>
                    </div>
                  </div>
                </div>

                {/* Building & Room Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="report-building"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Building <span className="text-[#EA580C]">*</span>
                    </label>
                    <select
                      id="report-building"
                      value={building}
                      onChange={(e) => handleBuildingChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                    >
                      {Object.keys(CAMPUS_BUILDINGS).map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="report-room"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Room / Area <span className="text-[#EA580C]">*</span>
                    </label>
                    <select
                      id="report-room"
                      value={room}
                      onChange={(e) => {
                        setRoom(e.target.value);
                        setFormError(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                    >
                      {availableRooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Problem Description (shown before AI analysis completes) */}
                {!aiResult && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="report-description"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Problem Description <span className="text-[#EA580C]">*</span>
                      </label>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {description.length} / 250
                      </span>
                    </div>
                    <textarea
                      id="report-description"
                      rows={3}
                      maxLength={250}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="Describe what is broken or unsafe..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 resize-none"
                    />
                  </div>
                )}

                {/* AI Analysis Result Card (Mockup 3) */}
                {aiResult && (
                  <div
                    data-testid="ai-analysis-result"
                    className="rounded-2xl border border-orange-200 bg-[#FFFBF7] p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-orange-100">
                      <div className="inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#EA580C]" />
                        <h3 className="font-display text-sm font-bold text-[#0F172A]">
                          AI Analysis Result
                        </h3>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                        title={
                          aiResult.source === 'gemini'
                            ? 'Analyzed by Google Gemini from your photo and description'
                            : 'AI service unavailable — analyzed offline from your description'
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {aiResult.source === 'gemini' ? 'Analyzed by Gemini' : 'Analyzed (offline)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                      <div className="flex items-start gap-2.5">
                        <Tag className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Issue Classification</p>
                          <p className="font-bold text-[#0F172A]">
                            {aiResult.classification}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Layers className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Category</p>
                          <p className="font-bold text-[#0F172A]">
                            {aiResult.categoryDisplay}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Gauge className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
                        <div className="w-full">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Confidence Score</span>
                            <span className="font-bold text-[#0F172A] tabular-nums">
                              {aiResult.confidence}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-orange-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#EA580C]"
                              style={{ width: `${aiResult.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Flag className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Suggested Priority</p>
                          <span
                            className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                              aiResult.suggestedPriority === 'High'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : aiResult.suggestedPriority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {aiResult.suggestedPriority}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Editable AI-Generated Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="ai-generated-description"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#EA580C]" />
                          AI-Generated Description (Editable)
                        </label>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {editableAiDescription.length} / 250
                        </span>
                      </div>
                      <textarea
                        id="ai-generated-description"
                        rows={3}
                        maxLength={250}
                        value={editableAiDescription}
                        onChange={(e) => setEditableAiDescription(e.target.value)}
                        className="w-full rounded-xl border border-orange-200 bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 resize-none"
                      />
                    </div>

                    {/* Possible duplicate reports */}
                    {duplicates.length > 0 && (
                      <div
                        role="note"
                        className="rounded-xl border border-sky-200 bg-sky-50 p-3 space-y-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <Copy className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-sky-900">
                              {duplicates[0].sameRoom
                                ? 'This looks already reported'
                                : `Similar open ${aiResult.category} report in ${building}`}
                            </p>
                            <p className="text-[11px] text-sky-800 mt-0.5">
                              Follow the existing report instead of filing a new one, so
                              technicians aren&apos;t sent twice.
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-1.5">
                          {duplicates.map(({ ticket, sameRoom }) => (
                            <li key={ticket.id}>
                              <button
                                type="button"
                                onClick={() => onSelectTicket(ticket.id)}
                                className="w-full flex items-center gap-2.5 rounded-lg bg-white border border-sky-100 hover:border-sky-300 px-2.5 py-2 text-left cursor-pointer transition-colors"
                              >
                                <img
                                  src={ticket.beforePhoto}
                                  alt=""
                                  className="w-9 h-9 rounded-md object-cover shrink-0"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-xs font-semibold text-[#0F172A] truncate">
                                    {ticket.code} · {ticket.title}
                                  </span>
                                  <span className="block text-[11px] text-slate-500 truncate">
                                    {ticket.room}
                                    {sameRoom ? ' (same room)' : ''} · {ticket.status} ·{' '}
                                    {ticket.relativeTime}
                                  </span>
                                </span>
                                <span className="text-[11px] font-bold text-sky-700 shrink-0">
                                  Track it
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Validation Error */}
                {formError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Primary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleAnalyzeWithAi}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#EA580C] bg-white hover:bg-orange-50 border border-[#EA580C] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isAnalyzing
                        ? 'Scanning...'
                        : aiResult
                          ? 'Re-Analyze with AI'
                          : 'Analyze with AI'}
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#F97316] shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span>Submit Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Right Column: Notifications + My Recent Reports */}
          <div className="lg:col-span-4 space-y-5">
            {/* Notifications Card */}
            <section
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5 ${
                mobileTab === 'report' || mobileTab === 'reports'
                  ? 'hidden lg:block'
                  : 'block'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#EA580C]" />
                  <h2 className="font-display text-base font-bold text-[#0F172A]">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-[#EA580C] tabular-nums">
                      ({unreadCount})
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkNotificationsRead}
                    className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTicket(item.ticketId)}
                    className="w-full py-2.5 text-left flex items-start gap-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.type === 'resolved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.type === 'in_progress'
                            ? 'bg-orange-50 text-[#EA580C]'
                            : 'bg-sky-50 text-sky-600'
                      }`}
                    >
                      {item.type === 'resolved' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : item.type === 'in_progress' ? (
                        <Wrench className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0F172A] truncate">
                          {item.title}
                        </p>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* My Recent Reports Card */}
            <section
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5 ${
                mobileTab === 'report' || mobileTab === 'alerts'
                  ? 'hidden lg:block'
                  : 'block'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#EA580C]" />
                  <h2 className="font-display text-base font-bold text-[#0F172A]">
                    My Recent Reports
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllReports((prev) => !prev)}
                  className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                >
                  {showAllReports ? 'Show Less' : 'View All →'}
                </button>
              </div>

              <div
                data-testid="student-recent-reports"
                className="divide-y divide-slate-100"
              >
                {(showAllReports ? tickets : tickets.slice(0, 4)).map((report) => {
                  const isResolved = report.status === 'Resolved';
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => onSelectTicket(report.id)}
                      className="w-full py-3 flex items-center gap-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                    >
                      <div className="w-14 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={report.beforePhoto}
                          alt={report.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#0F172A]">
                            {report.code}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isResolved
                                ? 'text-emerald-700'
                                : report.status === 'Pending Parts'
                                  ? 'text-amber-700'
                                  : 'text-[#EA580C]'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {report.building} — {report.room}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#EA580C] transition-colors">
                            {report.title}
                          </p>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                            {report.relativeTime}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Mockup 2 Mobile) */}
      <nav
        aria-label="Student Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 grid grid-cols-4 gap-1"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'report', label: 'Report', icon: PlusCircle },
            { id: 'reports', label: 'My Reports', icon: Layers },
            { id: 'alerts', label: 'Alerts', icon: Bell },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                active ? 'text-[#EA580C]' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Action Modals (Campus Directory & FAQ) */}
      {infoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0F172A] px-5 py-4 flex items-center justify-between text-white">
              <h3 className="font-display text-base font-bold">
                {infoModal === 'campus'
                  ? 'Campus Buildings Directory'
                  : 'Student Maintenance Help & FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {infoModal === 'campus' ? (
                Object.entries(CAMPUS_BUILDINGS).map(([bldg, rooms]) => (
                  <div
                    key={bldg}
                    className="rounded-xl border border-slate-200/80 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{bldg}</p>
                      <p className="text-xs text-slate-500">{rooms.join(' · ')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleBuildingChange(bldg);
                        setInfoModal(null);
                        scrollToForm();
                      }}
                      className="text-xs font-semibold text-[#EA580C] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Report Here →
                    </button>
                  </div>
                ))
              ) : (
                <div className="space-y-3 text-sm text-slate-600">
                  <div>
                    <p className="font-bold text-[#0F172A]">
                      How fast are High Priority issues dispatched?
                    </p>
                    <p className="mt-1">
                      AI triage flags leaks, HVAC failures, and safety hardware within
                      seconds, targeting same-day dispatch under a 7.4-hour average
                      resolution window.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F172A]">
                      How do I see technician updates?
                    </p>
                    <p className="mt-1">
                      Click any ticket under &quot;My Recent Reports&quot; to open the
                      5-step tracker with live timestamps, before/after repair photos, and
                      technician field notes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
