import React, { useState } from 'react';
import {
  Menu,
  X,
  RotateCcw,
  GraduationCap,
  Wrench,
  BarChart3,
  Globe,
} from 'lucide-react';
import { AppView } from '../types/campusFix';

interface BrandHeaderProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onResetDemo: () => void;
  unreadNotifications: number;
}

export function CampusFixLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width={compact ? 26 : 30}
        height={compact ? 26 : 30}
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M18 2.5L31.5 10.25V14.8L24.8 18.6V14.1L18 10.2L11.2 14.1V21.9L18 25.8L24.8 21.9V18.6L31.5 22.4V25.75L18 33.5L4.5 25.75V10.25L18 2.5Z"
          fill="#F97316"
        />
        <path
          d="M18 2.5L31.5 10.25V14.8L24.8 18.6V14.1L18 10.2V2.5Z"
          fill="#EA580C"
        />
      </svg>
      <span className="font-display text-lg font-extrabold tracking-tight text-white">
        CampusFix <span className="text-[#F97316]">AI</span>
      </span>
    </span>
  );
}

const ROLE_TABS: Array<{
  id: AppView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'landing', label: 'Landing', shortLabel: 'Landing', icon: Globe },
  { id: 'student', label: 'Student Portal', shortLabel: 'Student', icon: GraduationCap },
  { id: 'operations', label: 'Staff Ops', shortLabel: 'Staff Ops', icon: Wrench },
  { id: 'analytics', label: 'Executive Analytics', shortLabel: 'Analytics', icon: BarChart3 },
];

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  activeView,
  onSelectView,
  onResetDemo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSwitch = (view: AppView) => {
    onSelectView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-slate-800/80 text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSwitch('landing')}
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-lg py-1"
          aria-label="CampusFix AI Home"
        >
          <CampusFixLogo />
        </button>

        {/* Zone 2: Top Demo Role Switcher (Always visible on desktop for live pitching) */}
        <nav
          aria-label="Demo Role Switcher"
          className="hidden md:flex items-center gap-1 bg-[#132238] p-1 rounded-xl border border-slate-700/70"
        >
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSwitch(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${
                  isActive
                    ? 'bg-[#EA580C] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {activeView === 'landing' ? (
            <button
              type="button"
              onClick={() => handleSwitch('student')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-[#EA580C] hover:bg-[#F97316] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Get a Demo
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetDemo}
              title="Reset demo tickets and counters to default state"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Role Switcher */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#132238] px-4 py-3 space-y-1.5">
          <p className="text-xs font-medium text-slate-400 px-2 pb-1">
            Switch Role View
          </p>
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSwitch(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EA580C] text-white'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          {activeView !== 'landing' && (
            <button
              type="button"
              onClick={() => {
                onResetDemo();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 border-t border-slate-700/60 mt-2 pt-3"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Reset Demo Data</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
