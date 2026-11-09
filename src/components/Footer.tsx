import React from 'react';
import { PERSONAL_PROFILE } from '../data/projects';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#ECECEB] border-t border-[#D5D5D0] text-[#777772] pb-24 sm:pb-20">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_4px_rgba(255,85,0,0.6)]" />
          <span className="text-[#111111] font-bold">{PERSONAL_PROFILE.name}</span>
          <span className="text-[#888884]">·</span>
          <span className="font-mono text-[11px] text-[#555550]">{PERSONAL_PROFILE.designation}</span>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-[#555550]">
          {PERSONAL_PROFILE.contact.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FF5500] font-mono transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-[#FF5500] font-mono text-[11px] transition-colors"
          >
            TOP ↑
          </button>
        </div>

        <p className="font-mono text-[11px] text-[#888884]">
          © {currentYear} {PERSONAL_PROFILE.name.toUpperCase()} · DIETER RAMS &amp; TE HARDWARE
        </p>
      </div>
    </footer>
  );
};