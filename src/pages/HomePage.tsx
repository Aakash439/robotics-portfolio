import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { TechCards } from '../components/TechCards';
import { Skills } from '../components/Skills';
import { AboutSection } from '../components/AboutSection';
import { ContactSection } from '../components/ContactSection';
import { PERSONAL_PROFILE } from '../data/projects';

export const HomePage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = `${PERSONAL_PROFILE.name} — ${PERSONAL_PROFILE.designation}`;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    const targetSection = state?.scrollTo;

    if (targetSection) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        window.history.replaceState({}, '', window.location.pathname);
      }, 60);
      return () => clearTimeout(timer);
    }

    // On initial load or refresh, strip any leftover URL hash (e.g. #projects)
    // and ensure the viewport always lands on the Hero section at the top.
    if (window.location.hash) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.state]);

  return (
    <main className="bg-[#ECECEB] text-[#111111]">
      <HeroSection />
      <TechCards />
      <Skills />
      <AboutSection />
      <ContactSection />
    </main>
  );
};
