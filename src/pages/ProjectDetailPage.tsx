import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PROJECTS, PERSONAL_PROFILE } from '../data/projects';
import { CornerCrosshairs } from '../components/CornerCrosshairs';
import { TactileDial } from '../components/TactileDial';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const projectIndex = PROJECTS.findIndex((p) => p.slug === slug);
  const project = projectIndex >= 0 ? PROJECTS[projectIndex] : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (project) {
      document.title = `${project.shortTitle} — ${PERSONAL_PROFILE.name}`;
    } else {
      document.title = `Not Found — ${PERSONAL_PROFILE.name}`;
    }
  }, [project, slug]);

  if (!project) {
    return (
      <main className="min-h-[75vh] bg-[#ECECEB] flex items-center justify-center px-6">
        <div className="relative max-w-md w-full rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.05)] p-8 text-center space-y-4">
          <CornerCrosshairs variant="screws" />
          <p className="font-mono text-xs text-[#FF5500] font-bold">404 · PROTOCOL NOT FOUND</p>
          <h1 className="text-xl font-bold text-[#111111]">
            System entry unavailable.
          </h1>
          <Link
            to="/"
            state={{ scrollTo: 'projects' }}
            className="btn-rocker-orange inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
        </div>
      </main>
    );
  }

  const prevProject =
    projectIndex > 0
      ? PROJECTS[projectIndex - 1]
      : PROJECTS[PROJECTS.length - 1];
  const nextProject =
    projectIndex < PROJECTS.length - 1
      ? PROJECTS[projectIndex + 1]
      : PROJECTS[0];

  const { detail } = project;
  const isOrange = project.ledColor === 'orange';
  const ledBg = isOrange ? '#FF5500' : '#10B981';

  return (
    <main className="bg-[#ECECEB] min-h-screen text-[#111111]">
      {/* Top Header & Multimeter Readout Section */}
      <section className="py-12 sm:py-16 border-b border-[#D5D5D0]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/', { state: { scrollTo: 'projects' } })}
              className="btn-rocker-white inline-flex items-center gap-2 font-mono text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4 text-[#FF5500]" />
              <span>BACK TO DATASHEETS</span>
            </button>
            <TactileDial label="SPEC" value={75} size={28} />
          </div>

          <div className="space-y-4 max-w-[840px]">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#777772] uppercase font-semibold">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ledBg, boxShadow: `0 0 6px ${ledBg}` }}
              />
              <span>Module 0{project.index} · {project.domainKicker}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
              {project.title}
            </h1>

            <p className="text-base sm:text-lg text-[#555550] leading-relaxed">
              {project.summary}
            </p>
          </div>

          {/* 3 Dark Recessed Multimeter LED Display Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            {project.stats.map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-xl bg-[#DFDFDC] border border-[#C8C8C2] p-1.5 shadow-inner"
              >
                <div className="bg-[#121315] text-[#FF453A] font-mono px-4 py-4 rounded-lg border border-black/50 shadow-inner flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-[9px] text-[#888884] uppercase tracking-wider mb-2">
                    <span>CH-0{i + 1}</span>
                    <span className="text-[#FF5500]">ACTIVE</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(255,69,58,0.7)]">
                    {stat.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[#888884] mt-2 font-mono">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modular Hardware Breakdown */}
      <section className="py-14 sm:py-20 border-b border-[#D5D5D0]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 space-y-8">
          {/* Highlights Hardware Plate */}
          <div className="relative rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.05)] p-8 space-y-4">
            <CornerCrosshairs variant="screws" />

            <div className="flex items-center justify-between border-b border-[#D5D5D0] pb-3">
              <span className="font-mono text-xs text-[#FF5500] uppercase font-bold tracking-wider">
                KEY ARCHITECTURE HIGHLIGHTS
              </span>
              <span className="font-mono text-[10px] text-[#888884]">
                TOLERANCE: ±0.02MM
              </span>
            </div>

            <ul className="space-y-3 pt-2">
              {detail.highlights.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm sm:text-base text-[#333330]"
                >
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#FF5500] shrink-0 shadow-[0_0_4px_rgba(255,85,0,0.6)]" />
                  <span className="leading-relaxed font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* System Spec Sub-Plates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {detail.systemSpecCells.map((cell) => (
              <div
                key={cell.name}
                className="relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.04)] p-6 space-y-2"
              >
                <CornerCrosshairs variant="crosshairs" />
                <span className="font-mono text-[10px] font-bold text-[#FF5500] uppercase tracking-wider">
                  {cell.category}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                  {cell.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#555550] leading-relaxed">
                  {cell.applicationNote}
                </p>
              </div>
            ))}
          </div>

          {/* Hardware Tech Badges */}
          <div className="pt-2">
            <p className="font-mono text-[10px] text-[#888884] uppercase tracking-wider mb-3 font-semibold">
              HARDWARE &amp; PROTOCOL BUS STACK:
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-lg bg-[#EAEAE7] border border-[#D0D0CB] font-mono text-xs font-semibold text-[#111111] shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Next / Prev Navigation */}
      <section className="py-12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            to={`/projects/${prevProject.slug}`}
            className="group relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] hover:border-[#FF5500] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.04)] p-6 flex items-center justify-between transition-all"
          >
            <div>
              <p className="font-mono text-[10px] text-[#888884] uppercase font-bold">
                PREVIOUS MODULE
              </p>
              <p className="text-sm sm:text-base font-bold text-[#111111] group-hover:text-[#FF5500] mt-1 transition-colors">
                {prevProject.shortTitle}
              </p>
            </div>
            <ChevronLeft className="w-5 h-5 text-[#888884] group-hover:text-[#FF5500] transition-colors" />
          </Link>

          <Link
            to={`/projects/${nextProject.slug}`}
            className="group relative rounded-xl bg-[#F5F5F3] border border-[#D5D5D0] hover:border-[#FF5500] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.04)] p-6 flex items-center justify-between text-right transition-all"
          >
            <ChevronRight className="w-5 h-5 text-[#888884] group-hover:text-[#FF5500] order-2 transition-colors" />
            <div className="order-1 ml-auto">
              <p className="font-mono text-[10px] text-[#888884] uppercase font-bold">
                NEXT MODULE
              </p>
              <p className="text-sm sm:text-base font-bold text-[#111111] group-hover:text-[#FF5500] mt-1 transition-colors">
                {nextProject.shortTitle}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
};