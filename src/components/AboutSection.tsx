import React from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  MapPin,
  Calendar,
} from 'lucide-react';
import { ABOUT_SECTION, PERSONAL_PROFILE } from '../data/projects';
import { CornerCrosshairs } from './CornerCrosshairs';
import { TactileDial } from './TactileDial';

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="relative bg-[#ECECEB] py-20 sm:py-28 border-b border-[#D5D5D0]"
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Module 03A: Engineer Identity & Modernist Monospace Stamping */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: STUDIO_EASE }}
          className="relative rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.05)] p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          <CornerCrosshairs variant="screws" />

          {/* Left 4 Cols: Engineer Identity & Modernist Monospace Stamping */}
          <div className="lg:col-span-4 space-y-5">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#FF5500] uppercase tracking-wider font-bold">
              <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_6px_rgba(255,85,0,0.6)]" />
              <span>Module 03 · {ABOUT_SECTION.kicker}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111111]">
              {PERSONAL_PROFILE.name}
            </h2>

            <div className="font-mono text-xs text-[#555550] space-y-2 border-l-2 border-[#FF5500] pl-3.5 bg-[#EAEAE7]/60 py-2.5 rounded-r">
              <p>
                <strong className="text-[#111111]">Role:</strong> {PERSONAL_PROFILE.designation}
              </p>
              <p>
                <strong className="text-[#111111]">Education:</strong> Third Year B.Tech (Robotics &amp; AI)
              </p>
              <p>
                <strong className="text-[#111111]">Location:</strong> {PERSONAL_PROFILE.eyebrowLocation}
              </p>
              <p className="text-[#059669] font-bold">
                ● {ABOUT_SECTION.statusLine}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <TactileDial label="CALIB" value={135} size={30} />
              <div className="font-mono text-[10px] text-[#888884] space-y-0.5">
                <p>Standard: Precision Physical Hardware</p>
                <p>Workbench: Anodized Bench &amp; Test Station</p>
              </div>
            </div>
          </div>

          {/* Middle 4 Cols: 3 Precision Engineering Spec Pillars */}
          <div className="lg:col-span-4 space-y-3">
            {ABOUT_SECTION.pillars.map((item) => (
              <div
                key={item.tag}
                className="rounded-xl bg-[#EAEAE7] border border-[#D0D0CB] p-4 space-y-1.5 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#111111]">
                    {item.title}
                  </span>
                  <span className="font-mono text-[9px] font-bold text-[#FF5500] bg-[#DFDFDC] px-2 py-0.5 rounded border border-[#C8C8C2]">
                    {item.tag.replace('//', '·')}
                  </span>
                </div>
                <p className="text-xs text-[#555550] leading-relaxed">
                  {item.spec}
                </p>
              </div>
            ))}
          </div>

          {/* Right 4 Cols: Actual Laboratory Workbench Photo */}
          <div className="lg:col-span-4">
            <div className="relative h-72 rounded-xl overflow-hidden border border-[#D0D0CB] bg-[#DFDFDC] shadow-inner group">
              <img
                src="/images/workshop-bench.jpg"
                alt="Field Workbench at JSPM Lab, Pune with soldering iron, multimeter, and robotic chassis"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/75 via-transparent to-transparent pointer-events-none" />

              {/* Hardware Label Badge in corner of photo */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#111111]/85 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono text-white shadow-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500]" />
                <span>Field Workbench · JSPM Lab, Pune</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] text-white">
                <span className="font-bold tracking-wider">Hardware Prototyping</span>
                <span className="text-[#FF5500] font-semibold">Active Workbench</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module 03B: Academic Track, Leadership & Field Experience */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.08, ease: STUDIO_EASE }}
          className="relative rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.05)] p-6 sm:p-8 md:p-10"
        >
          <CornerCrosshairs variant="screws" />

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#D5D5D0] mb-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-[#FF5500] uppercase tracking-wider font-bold">
                <span className="h-2 w-2 rounded-full bg-[#FF5500] shadow-[0_0_6px_rgba(255,85,0,0.6)] animate-pulse" />
                <span>Module 03B · Academic Track &amp; Field Milestones</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
                Education &amp; Field Milestones.
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EAEAE7] border border-[#D0D0CB] font-mono text-xs font-bold text-[#111111]">
                <GraduationCap className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>THIRD YEAR · B.TECH ROBOTICS &amp; AI</span>
              </span>
            </div>
          </div>

          {/* Symmetrical 2-Column Grid: 3 Education Cards on Left, 3 Leadership & Experience Cards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 Cols: Formal Education Pipeline (3 Cards) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#DCDCD8]">
                <GraduationCap className="w-4 h-4 text-[#FF5500]" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                  ACADEMIC EDUCATION TRACK
                </h4>
              </div>

              {ABOUT_SECTION.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#EAEAE7] border border-[#D0D0CB] p-5 sm:p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] hover:border-[#B8B8B2] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h5 className="text-sm sm:text-base font-bold text-[#111111] leading-snug">
                        {edu.degree}
                      </h5>
                      {edu.statusBadge && (
                        <span
                          className={`shrink-0 font-mono text-[9px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                            edu.statusBadge.includes('ACTIVE') || edu.statusBadge.includes('PURSUING') || edu.statusBadge.includes('THIRD')
                              ? 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/30 shadow-xs'
                              : 'bg-[#DFDFDC] text-[#666662] border-[#C8C8C2]'
                          }`}
                        >
                          {edu.statusBadge}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#777772] font-semibold mb-3">
                      {edu.institution}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#555550] leading-relaxed mb-4">
                      {edu.details}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D5D5D0] flex items-center justify-between font-mono text-[11px] text-[#777772]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#888884]" />
                      {edu.timeline}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#888884]" />
                      {edu.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right 6 Cols: Campus Events & Machining Internship (3 Cards) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#DCDCD8]">
                <Users className="w-4 h-4 text-[#FF5500]" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
                  CAMPUS EVENTS &amp; PRACTICAL EXPERIENCE
                </h4>
              </div>

              {/* Campus Events Cards (2 Cards) */}
              {ABOUT_SECTION.leadership.map((lead, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#EAEAE7] border border-[#D0D0CB] p-5 sm:p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] hover:border-[#B8B8B2] transition-colors"
                >
                  <div>
                    <div className="mb-1">
                      <h5 className="text-sm sm:text-base font-bold text-[#111111] leading-snug">
                        {lead.role}
                      </h5>
                    </div>
                    <p className="font-mono text-xs text-[#777772] font-semibold mb-3">
                      {lead.organization}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#555550] leading-relaxed mb-4">
                      {lead.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D5D5D0] flex items-center justify-between font-mono text-[11px] text-[#777772]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#888884]" />
                      {lead.timeline}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#888884]" />
                      {lead.location}
                    </span>
                  </div>
                </div>
              ))}

              {/* CNC & VMC Milling Internship Card (1 Card) */}
              {ABOUT_SECTION.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#EAEAE7] border border-[#D0D0CB] p-5 sm:p-6 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] hover:border-[#B8B8B2] transition-colors"
                >
                  <div>
                    <div className="mb-1">
                      <h5 className="text-sm sm:text-base font-bold text-[#111111] leading-snug">
                        {exp.role}
                      </h5>
                    </div>
                    <p className="font-mono text-xs text-[#777772] font-semibold mb-3">
                      {exp.organization}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#555550] leading-relaxed mb-4">
                      {exp.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D5D5D0] flex items-center justify-between font-mono text-[11px] text-[#777772]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#888884]" />
                      {exp.timeline}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#888884]" />
                      {exp.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
