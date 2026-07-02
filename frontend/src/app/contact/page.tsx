'use client';

import { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

const navItems = [
  { href: '/dashboard',              icon: 'fa-home',             label: 'Dashboard' },
  { href: '/dashboard/courses',      icon: 'fa-book-open',        label: 'Courses' },
  { href: '/dashboard/community',    icon: 'fa-users',            label: 'Community' },
  { href: '/dashboard/portfolio',    icon: 'fa-layer-group',      label: 'Portfolio' },
  { href: '/dashboard/platforms',    icon: 'fa-graduation-cap',   label: 'Learning Platforms' },
  { href: '/dashboard/jobs',         icon: 'fa-briefcase',        label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate',      label: 'Certificates' },
  { href: '/dashboard/rewards',      icon: 'fa-coins',            label: 'Rewards' },
  { href: '/contact',                icon: 'fa-envelope',         label: 'Contact Us' },
  { href: '/dashboard/settings',     icon: 'fa-gear',             label: 'Settings' },
];

// ── Topic config ──────────────────────────────────────────────────────────────
const TOPICS = [
  { value: 'billing',     label: 'Billing & Access',        icon: 'fa-credit-card',         color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  { value: 'technical',   label: 'Platform Incident',       icon: 'fa-triangle-exclamation', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { value: 'account',     label: 'Account Security',        icon: 'fa-user-shield',         color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)' },
  { value: 'courses',     label: 'Learning Progress',       icon: 'fa-book-open',           color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  { value: 'jobs',        label: 'Jobs & Hiring',           icon: 'fa-briefcase',           color: '#00E5A0', bg: 'rgba(0,229,160,0.12)' },
  { value: 'ai_features', label: 'AI Product Feedback',     icon: 'fa-brain',               color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'partnership', label: 'Partnerships',            icon: 'fa-handshake',           color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { value: 'other',       label: 'General Request',         icon: 'fa-ellipsis',            color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
];

// ── Contact channels ──────────────────────────────────────────────────────────
const CHANNELS = [
  {
    icon:  'fa-envelope',
    color: '#4F8EF7',
    bg:    'rgba(79,142,247,0.12)',
    label: 'Support inbox',
    value: 'support@skillhub.ng',
    sub:   'Best for billing, access, and technical issues',
    href:  'mailto:support@skillhub.ng',
  },
  {
    icon:  'fa-users',
    color: '#00E5A0',
    bg:    'rgba(0,229,160,0.12)',
    label: 'Community desk',
    value: 'Get peer support',
    sub:   'Useful for workflow advice and product questions',
    href:  '/dashboard/community',
  },
  {
    icon:  'fa-users',
    color: '#F59E0B',
    bg:    'rgba(245,158,11,0.12)',
    label: 'Partnership desk',
    value: 'Request a commercial conversation',
    sub:   'For institutions, employers, and ecosystem partners',
    href:  'mailto:partnerships@skillhub.ng',
  },
];

// ── Response time copy per topic ──────────────────────────────────────────────
const RESPONSE_TIME: Record<string, string> = {
  billing:     'Billing issues are prioritised — we aim to respond within 4 hours.',
  technical:   'Technical issues are reviewed within 8 hours.',
  account:     'Account queries are handled within 12 hours.',
  courses:     'Course-related questions are answered within 24 hours.',
  jobs:        'Job and application queries are answered within 24 hours.',
  ai_features: 'AI feature feedback is reviewed by our product team within 48 hours.',
  partnership: 'Partnership enquiries are reviewed within 3 business days.',
  other:       'We\'ll get back to you within 24 hours.',
};

interface FormState {
  name:    string;
  email:   string;
  topic:   string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', topic: '', subject: '', message: '' };

// ── Field component ───────────────────────────────────────────────────────────
function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-white/88">
        {label}
        {required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-[12px] text-[#ef4444] flex items-center gap-1">
          <BrandIcon name="fa-circle-exclamation" className="text-[10px]" />{error}
        </span>
      )}
    </div>
  );
}

const INPUT_BASE =
  'px-4 py-2.5 rounded-xl border text-[13px] outline-none transition-all bg-white/5 text-white placeholder:text-white/28';
const INPUT_IDLE  = 'border-white/8 focus:border-[#4F8EF7] focus:ring-2 focus:ring-[#4F8EF7]/10';
const INPUT_ERROR = 'border-[#ef4444] focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/10';

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [errors, setErrors]     = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState<{ reference: string } | null>(null);
  const [serverError, setServerError] = useState('');

  const selectedTopic = TOPICS.find(t => t.value === form.topic);
  const charCount = form.message.length;

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Enter your full name (at least 2 characters).';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address.';
    if (!form.topic)
      e.topic = 'Select a topic.';
    if (!form.subject.trim() || form.subject.trim().length < 5)
      e.subject = 'Subject must be at least 5 characters.';
    if (!form.message.trim() || form.message.trim().length < 20)
      e.message = 'Message must be at least 20 characters.';
    if (form.message.trim().length > 2000)
      e.message = 'Message must be under 2,000 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (serverError)   setServerError('');
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const r = await apiFetch('/contact', {
        method: 'POST',
        body:   JSON.stringify(form),
      });
      if (r.success) {
        setSubmitted({ reference: r.data.reference });
        setForm(EMPTY);
        setErrors({});
      } else {
        setServerError(r.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Unable to reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SidebarLayout navItems={navItems} pageTitle="Contact Us">
        <div className="max-w-lg mx-auto mt-8">
          <div className="rounded-3xl border p-8 text-center" style={{ background: '#0F1521', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl" style={{ background: 'rgba(0,229,160,0.12)' }}>
              <BrandIcon name="fa-circle-check" className="text-[32px] text-[#00E5A0]" />
            </div>
            <h2 className="font-jakarta font-bold text-[20px] mb-2 text-white">Message routed to support</h2>
            <p className="text-[13.5px] mb-1 text-white/58">
              Your reference number is{' '}
              <span className="font-bold text-[#4F8EF7] font-mono">#{submitted.reference}</span>.
            </p>
            <p className="text-[13px] mb-6 text-white/44">
              Your request is in queue. Expect an email response within the SLA shown below.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSubmitted(null)}
                className="px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #4F8EF7, #2F6FED)' }}
              >
                Send another message
              </button>
              <a
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-[#8FB8FF] text-[13px] font-semibold no-underline transition-all"
                style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.18)' }}
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <SidebarLayout navItems={navItems} pageTitle="Contact Us">

      {/* ── Header banner ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 mb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#5b4cf5,#7c3aed)' }}
      >
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ bottom: -50, left: -30, width: 160, height: 160, background: 'rgba(255,255,255,0.05)' }} />
        <div className="relative z-[1]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-[11px] font-bold text-white/80"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <BrandIcon name="fa-headset" />
            Support operations
          </div>
          <h2 className="font-jakarta font-bold text-[22px] text-white mb-1">Support that matches the product</h2>
          <p className="text-white/70 text-[13px] max-w-md">
            Report incidents, unblock account issues, or start a commercial conversation without falling into a generic ticket queue.
          </p>
        </div>
      </div>

      {/* ── Contact channels ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-5 max-md:grid-cols-1">
        {CHANNELS.map(ch => (
          <a key={ch.label} href={ch.href}
            className="rounded-2xl border p-4 flex items-center gap-3 no-underline hover:-translate-y-0.5 transition-all group"
            style={{ background: '#0F1521', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0"
              style={{ background: ch.bg, color: ch.color }}>
              <BrandIcon name={ch.icon} className="text-[16px]" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-white/34">{ch.label}</div>
              <div className="font-jakarta font-bold text-[13px] text-white truncate group-hover:text-[#8FB8FF] transition-colors">
                {ch.value}
              </div>
              <div className="text-[11px] text-white/38">{ch.sub}</div>
            </div>
          </a>
        ))}
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_300px] gap-5 max-lg:grid-cols-1">

        {/* ── Contact form ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border p-6" style={{ background: '#0F1521', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-jakarta font-bold text-[16px] mb-1 text-white">Open a support case</h3>
          <p className="text-[13px] text-white/44 mb-5">
            All fields marked <span className="text-[#ef4444]">*</span> are required.
          </p>

          <div className="flex flex-col gap-5">

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Your name" required error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Chisom Okafor"
                  className={`${INPUT_BASE} ${errors.name ? INPUT_ERROR : INPUT_IDLE}`}
                />
              </Field>
              <Field label="Email address" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`${INPUT_BASE} ${errors.email ? INPUT_ERROR : INPUT_IDLE}`}
                />
              </Field>
            </div>

            {/* Topic picker */}
            <Field label="Topic" required error={errors.topic}>
              <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                {TOPICS.map(t => {
                  const active = form.topic === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => set('topic', t.value)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center"
                      style={{
                        background:   active ? t.bg         : 'rgba(255,255,255,0.03)',
                        borderColor:  active ? t.color      : 'rgba(255,255,255,0.08)',
                        borderWidth:  active ? '2px'        : '1px',
                        color:        active ? t.color      : 'rgba(255,255,255,0.42)',
                      }}
                    >
                      <BrandIcon name={t.icon} className="text-[15px]" />
                      <span className="text-[10px] font-semibold leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.topic && (
                <span className="text-[12px] text-[#ef4444] flex items-center gap-1 mt-1">
                  <BrandIcon name="fa-circle-exclamation" className="text-[10px]" />{errors.topic}
                </span>
              )}
            </Field>

            {/* Response-time notice */}
            {selectedTopic && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: selectedTopic.bg }}>
                <BrandIcon name="fa-clock" className="text-[13px]" style={{ color: selectedTopic.color }} />
                <p className="text-[12.5px] font-medium" style={{ color: selectedTopic.color }}>
                  {RESPONSE_TIME[selectedTopic.value]}
                </p>
              </div>
            )}

            {/* Subject */}
            <Field label="Subject" required error={errors.subject}>
              <input
                type="text"
                value={form.subject}
                onChange={e => set('subject', e.target.value)}
                placeholder="Brief description of your issue or question"
                className={`${INPUT_BASE} ${errors.subject ? INPUT_ERROR : INPUT_IDLE}`}
              />
            </Field>

            {/* Message */}
            <Field label="Message" required error={errors.message}>
              <div className="relative">
                <textarea
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Describe your issue or question in as much detail as possible. The more context you give us, the faster we can help."
                  rows={6}
                  className={`${INPUT_BASE} ${errors.message ? INPUT_ERROR : INPUT_IDLE} w-full resize-none`}
                />
                <div className={`absolute bottom-3 right-3 text-[11px] font-mono ${
                  charCount > 2000 ? 'text-[#ef4444]' : charCount > 1600 ? 'text-[#f59e0b]' : 'text-[#c4c4d0]'
                }`}>
                  {charCount}/2000
                </div>
              </div>
            </Field>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.22)' }}>
                <BrandIcon name="fa-circle-exclamation" className="mt-0.5 text-[#ef4444]" />
                <p className="text-[13px] text-[#FCA5A5]">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-[12px] text-white/34">
                <BrandIcon name="fa-lock" className="mr-1 text-[10px]" />
                Your message is private and only seen by our support team.
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4F8EF7, #2F6FED)' }}
              >
                {submitting ? (
                  <>
                    <BrandIcon name="fa-circle-notch" className="text-[12px] animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <BrandIcon name="fa-paper-plane" className="text-[12px]" />
                    Send message
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Office info */}
          <div className="rounded-2xl border p-5" style={{ background: '#0F1521', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="font-jakarta font-bold text-[14px] mb-4 text-white">Support coverage</h4>
            <div className="space-y-3">
              {[
                { icon: 'fa-location-dot', color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)',
                  lines: ['SkillHub Pro operations', 'Victoria Island, Lagos', 'Coverage across West Africa'] },
                { icon: 'fa-clock', color: '#00E5A0', bg: 'rgba(0,229,160,0.12)',
                  lines: ['Mon – Fri: 9 AM – 6 PM WAT', 'Critical incidents triaged first', 'Weekend response for premium partners'] },
                { icon: 'fa-phone', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
                  lines: ['Escalations handled by email first', 'Phone support available for enterprise accounts'] },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 mt-0.5"
                    style={{ background: item.bg, color: item.color }}>
                    <BrandIcon name={item.icon} className="text-[12px]" />
                  </div>
                  <div>
                    {item.lines.map((l, j) => (
                      <div key={j} className={`text-[12.5px] ${j === 0 ? 'font-semibold text-white' : 'text-white/42'}`}>{l}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Before you write */}
          <div className="rounded-2xl border p-5" style={{ background: '#0F1521', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="font-jakarta font-bold text-[14px] mb-3 text-white">Fastest path to resolution</h4>
            <p className="text-[12px] text-white/42 mb-3">
              You might find the answer faster in one of these:
            </p>
            <div className="space-y-2">
              {[
                { href: '/dashboard/community', icon: 'fa-users', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Browse community solutions' },
                { href: '/dashboard/community', icon: 'fa-users', color: '#00E5A0', bg: 'rgba(0,229,160,0.12)', label: 'Ask product peers' },
                { href: '/dashboard/settings',  icon: 'fa-gear',  color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)', label: 'Review account settings' },
              ].map(link => (
                <a key={link.href} href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all hover:-translate-y-px"
                  style={{ background: link.bg }}>
                  <BrandIcon name={link.icon} className="text-[13px]" style={{ color: link.color }} />
                  <span className="text-[12.5px] font-semibold" style={{ color: link.color }}>{link.label}</span>
                  <BrandIcon name="fa-arrow-right" className="text-[10px] ml-auto" style={{ color: link.color }} />
                </a>
              ))}
            </div>
          </div>

          {/* SLA card */}
          <div className="rounded-2xl border p-5" style={{ background: '#0F1521', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="font-jakarta font-bold text-[14px] mb-3 text-white">Response targets</h4>
            <div className="space-y-2">
              {[
                { label: 'Billing',    time: '≤ 4 hrs',  color: '#ef4444', bg: '#fef2f2' },
                { label: 'Technical', time: '≤ 8 hrs',  color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Account',   time: '≤ 12 hrs', color: '#3b82f6', bg: '#eff6ff' },
                { label: 'General',   time: '≤ 24 hrs', color: '#5b4cf5', bg: '#f4f2ff' },
              ].map(row => (
                <div key={row.label}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: row.bg }}>
                  <span className="text-[12px] font-medium" style={{ color: row.color }}>{row.label}</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: row.color }}>{row.time}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/34 mt-3">
              Times are during business hours (Mon–Fri, WAT).
            </p>
          </div>

        </div>
      </div>

    </SidebarLayout>
  );
}
