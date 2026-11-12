import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { PERSONAL_PROFILE } from '../data/projects';
import { TactileDial } from './TactileDial';
import { audioEngine } from '../utils/audio';

interface NavItem {
  label: string;
  sectionId: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Projects', sectionId: 'projects' },
  { label: 'Systems', sectionId: 'systems' },
  { label: 'About', sectionId: 'about' },
  { label: 'Contact', sectionId: 'contact' },
];

export const Navbar: React.FC = () => {
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted());
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((muted) => setIsMuted(muted));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!isHomePage) {
        setActiveSection('projects');
        return;
      }

      const scrollOffset = window.scrollY + 200;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        const el = document.getElementById(item.sectionId);
        if (el && el.offsetTop <= scrollOffset) {
          setActiveSection(item.sectionId);
          return;
        }
      }
      setActiveSection('');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleNavigate = (sectionId: string) => {
    audioEngine.playMechanicalClick();
    setMobileMenuOpen(false);

    if (isHomePage) {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  const handleSoundToggle = () => {
    const nowMuted = audioEngine.toggleMute();
    setIsMuted(nowMuted);
  };

  return (
    <header className="sticky top-0 z-50 h-14 bg-[#ECECEB]/95 backdrop-blur-md border-b border-[#D5D5D0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-8 h-full flex items-center justify-between">
        {/* Left: Dieter Rams / TE Identity Block */}
        <Link
          to="/"
          onClick={() => {
            audioEngine.playMechanicalClick();
            if (isHomePage) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="cursor-shrink flex items-center gap-1.5 sm:gap-2.5 focus:outline-none group shrink-0 min-w-0"
        >
          {/* Orange Rocker Status Flag */}
          <span className="flex items-center justify-center bg-[#FF5500] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-[0_1px_2px_rgba(255,85,0,0.4)] shrink-0">
            REC
          </span>
          <span className="font-bold tracking-tight text-[#111111] text-xs sm:text-sm group-hover:text-[#FF5500] transition-colors whitespace-nowrap">
            {PERSONAL_PROFILE.name}
          </span>
          <span className="hidden sm:inline text-[#B8B8B2] font-mono text-xs">·</span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#666662] uppercase tracking-wider font-medium">
            {PERSONAL_PROFILE.designation}
          </span>
        </Link>

        {/* Right: Tactile Knobs + Audio Toggle + Plastic Rocker Nav Keys */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
          {/* Hardware Dual Dials Indicator (Teenage Engineering Field detail) */}
          <div className="hidden lg:flex items-center gap-3 pr-2 border-r border-[#D5D5D0]">
            <TactileDial color="orange" size={22} rotation={60} label="FREQ" />
            <TactileDial color="blue" size={22} rotation={140} label="GAIN" />
          </div>

          {/* Web Audio Synthesizer Toggle */}
          <button
            type="button"
            onClick={handleSoundToggle}
            className="inline-flex items-center justify-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded bg-[#E2E2DF] hover:bg-[#DCDCD8] border border-[#D0D0CA] font-mono text-[11px] text-[#555550] shadow-sm transition-all cursor-pointer shrink-0"
            aria-label={isMuted ? 'Unmute mechanical audio' : 'Mute mechanical audio'}
            title={isMuted ? 'Sound Muted' : 'Sound On'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#888884] shrink-0" />
                <span className="hidden sm:inline">Mute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <span className="hidden sm:inline font-semibold text-[#111111]">Sound On</span>
              </>
            )}
          </button>

          <nav
            className="hidden md:flex items-center gap-1.5 bg-[#E2E2DF] p-1 rounded-lg border border-[#D0D0CA] shadow-inner"
            aria-label="Primary Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <button
                  key={item.sectionId}
                  type="button"
                  onClick={() => handleNavigate(item.sectionId)}
                  className={`cursor-shrink px-3 py-1 font-mono text-xs uppercase tracking-wider transition-all rounded ${
                    isActive
                      ? 'bg-[#FFFFFF] text-[#111111] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]'
                      : 'text-[#666662] hover:text-[#111111] hover:bg-[#EAEAE7]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Physical Rocker Button: Get in Touch ↗ */}
          <button
            type="button"
            onClick={() => handleNavigate('contact')}
            className="btn-rocker-orange inline-flex items-center gap-1 px-2.5 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap shrink-0"
          >
            <span>Get in Touch</span>
            <span aria-hidden="true" className="font-mono text-xs font-bold">↗</span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden font-mono text-[10px] sm:text-xs font-semibold uppercase text-[#111111] bg-[#E2E2DF] hover:bg-[#DCDCD8] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded border border-[#D0D0CA] shadow-[0_1px_0_#C5C5C0] shrink-0 whitespace-nowrap"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-[#ECECEB] border-b border-[#D5D5D0] px-6 py-4 space-y-2 shadow-lg"
          aria-label="Mobile Navigation"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.sectionId}
              type="button"
              onClick={() => handleNavigate(item.sectionId)}
              className="block w-full text-left py-2 font-mono text-xs font-semibold uppercase text-[#111111] hover:text-[#FF5500] border-b border-[#D5D5D0] last:border-none"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
