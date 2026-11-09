import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Copy, Check, Send } from 'lucide-react';
import { CONTACT_SECTION, PERSONAL_PROFILE } from '../data/projects';
import { CornerCrosshairs } from './CornerCrosshairs';
import { TactileDial } from './TactileDial';

const INQUIRY_PROTOCOLS = CONTACT_SECTION.inquiryTypes;

export const ContactSection: React.FC = () => {
  const { contact } = PERSONAL_PROFILE;
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(INQUIRY_PROTOCOLS[0].id);
  const [copied, setCopied] = useState(false);
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);
        setIstTime(`${formatted} IST`);
      } catch {
        setIstTime('UTC+05:30');
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !message) return;

    if (String(formData.get('_honey') || '').trim()) {
      setFormState('sent');
      form.reset();
      return;
    }

    setFormState('sending');
    setStatusMessage('');

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${contact.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          _replyto: email,
          inquiry_type: selectedTopic,
          message,
          _subject: `[${selectedTopic}] Inquiry from ${name} — Robotics Portfolio`,
          _template: 'table',
          _captcha: 'false',
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success !== 'false') {
        setFormState('sent');
        setStatusMessage(`Delivered directly to ${contact.email}`);
        form.reset();
        setTimeout(() => {
          setFormState('idle');
          setStatusMessage('');
        }, 5000);
      } else {
        throw new Error(data?.message || 'Submission failed');
      }
    } catch {
      setFormState('error');
      setStatusMessage('Opening mail client as fallback...');
      const subject = encodeURIComponent(
        `[${selectedTopic}] Inquiry from ${name} — Robotics Portfolio`
      );
      const body = encodeURIComponent(
        `Topic: ${selectedTopic}\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
      setTimeout(() => {
        setFormState('idle');
        setStatusMessage('');
      }, 4000);
    }
  };

  return (
    <section
      id="contact"
      className="relative bg-[#ECECEB] py-20 sm:py-28 border-b border-[#D5D5D0]"
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="relative rounded-2xl bg-[#F5F5F3] border border-[#D5D5D0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.05)] p-6 sm:p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <CornerCrosshairs variant="screws" />

          {/* Left 5 Cols: Direct Comms, Live IST Clock & Physical Rockers */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-[#059669] uppercase tracking-wider font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Module 04 · {CONTACT_SECTION.availability}</span>
              </div>

              {istTime && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E5E5E2] border border-[#D0D0CB] font-mono text-[10px] text-[#555550] shadow-inner tabular-nums">
                  <span className="font-bold text-[#111111]">{CONTACT_SECTION.cityLabel}</span>
                  <span className="text-[#888884]">·</span>
                  <span className="text-[#FF5500] font-bold">{istTime}</span>
                </div>
              )}
            </div>

            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
              {CONTACT_SECTION.heading}
            </h2>

            <p className="text-sm sm:text-base text-[#555550] leading-relaxed">
              {CONTACT_SECTION.blurb}
            </p>

            {/* Email Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${contact.email}`}
                className="btn-rocker-orange inline-flex items-center gap-2 text-xs font-mono font-bold"
              >
                <span>{contact.email}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="btn-rocker-white inline-flex items-center gap-2 text-xs font-mono font-bold"
                aria-label="Copy email address"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="text-[#059669]">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#666662]" />
                    <span>COPY EMAIL</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Nodes */}
            <div className="pt-4 border-t border-[#D5D5D0]">
              <p className="font-mono text-[10px] text-[#888884] uppercase tracking-wider mb-3">
                DIRECT NETWORK NODES
              </p>
              <div className="flex flex-wrap gap-2">
                {contact.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAEAE7] hover:bg-white text-[#111111] border border-[#D0D0CB] font-mono text-xs transition-colors shadow-sm"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-[#888884]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Hardware Telemetry Badge */}
            <div className="flex items-center gap-4 pt-2">
              <TactileDial label="TX" value={80} size={28} />
              <div className="font-mono text-[9px] text-[#888884] space-y-0.5">
                <p>COMMS PROTOCOL: ASYNC UART</p>
                <p>ENCRYPTION: 256-BIT SSL FORM</p>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Recessed Comms Transmitter Panel */}
          <div className="lg:col-span-7 bg-[#EAEAE7] border border-[#D0D0CB] rounded-xl p-6 sm:p-8 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Hidden honeypot field for bot filtering */}
              <input
                type="text"
                name="_honey"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Physical Rocker Selector for Inquiry Protocol */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#666662] mb-2.5">
                  SELECT INQUIRY PROTOCOL:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {INQUIRY_PROTOCOLS.map((topic) => {
                    const isActive = selectedTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`text-[11px] font-mono font-bold uppercase py-2 px-3 rounded text-center transition-all ${
                          isActive
                            ? 'btn-rocker-orange'
                            : 'btn-rocker-white'
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Email Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block font-mono text-[10px] uppercase font-bold text-[#666662] mb-1.5"
                  >
                    IDENTIFIER (NAME) *
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Alex Vance"
                    className="w-full bg-white border border-[#C8C8C2] focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-[#111111] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm placeholder-[#999994] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block font-mono text-[10px] uppercase font-bold text-[#666662] mb-1.5"
                  >
                    RETURN ADDRESS (EMAIL) *
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. name@company.com"
                    className="w-full bg-white border border-[#C8C8C2] focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-[#111111] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm placeholder-[#999994] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Message Payload */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block font-mono text-[10px] uppercase font-bold text-[#666662] mb-1.5"
                >
                  TRANSMISSION PAYLOAD (MESSAGE) *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Outline project specifications, role parameters, or technical questions..."
                  className="w-full bg-white border border-[#C8C8C2] focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-[#111111] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm placeholder-[#999994] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors resize-none"
                />
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-lg font-mono text-xs ${
                    formState === 'sent'
                      ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                      : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              {/* Physical Rocker Transmit Button */}
              <button
                type="submit"
                disabled={formState === 'sending'}
                className="btn-rocker-orange w-full py-3 text-xs uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {formState === 'sending' ? (
                  <span>Transmitting Message...</span>
                ) : formState === 'sent' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Message Delivered · 200 OK</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};