import React from 'react';

export function ViraTechWatermark() {
  return (
    <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity select-none">
      <div className="h-5 w-[1px] bg-[#3E3023]/25" />
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center leading-none">
          <span
            className="text-[9px] font-bold text-[#3E3023] tracking-tighter"
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            vira
          </span>
          <span className="text-[5px] tracking-[0.18em] text-[#6D5B4A] uppercase font-sans">
            Tech
          </span>
        </div>
        <div className="h-3 w-[1px] bg-[#3E3023]/20" />
        <a
          href="mailto:viratech07@gmail.com"
          className="text-[6.5px] font-sans font-semibold text-[#8B6B4A] hover:underline pointer-events-auto"
          tabIndex={-1}
        >
          viratech07@gmail.com
        </a>
      </div>
    </div>
  );
}
