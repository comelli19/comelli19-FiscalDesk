import React from 'react';

interface FiscalDeskLogoProps {
  collapsed?: boolean;
}

export const FiscalDeskMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Logotipo FiscalDesk"
  >
    <rect x="2" y="2" width="36" height="36" rx="9" fill="#9E141A" />
    <rect x="2.5" y="2.5" width="35" height="35" rx="8.5" stroke="#FFFFFF" strokeOpacity="0.16" />
    <path d="M13 11.5H27.5V15.5H17.2V18.8H25.2V22.4H17.2V28.5H13V11.5Z" fill="#FFFFFF" />
    <rect x="21.5" y="24" width="6" height="4.5" rx="1" fill="#F8B4B7" />
  </svg>
);

export const FiscalDeskLogo: React.FC<FiscalDeskLogoProps> = ({ collapsed = false }) => {
  if (collapsed) {
    return (
      <div className="mx-auto flex items-center justify-center" title="FiscalDesk — Inteligência Tributária">
        <FiscalDeskMark className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 overflow-hidden select-none">
      <FiscalDeskMark className="w-8 h-8 shrink-0" />
      <div className="truncate leading-tight">
        <div className="font-display text-sm font-bold tracking-tight text-white flex items-center gap-1">
          <span>Fiscal</span>
          <span className="text-[#EF888D]">Desk</span>
        </div>
        <div className="text-[10px] text-[#8E94A0] font-medium tracking-wide mt-0.5">
          Inteligência Tributária
        </div>
      </div>
    </div>
  );
};
