'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #0c0c0c;
    --surface: #141414;
    --border:  #222222;
    --mid:     #333333;
    --muted:   #666666;
    --sub:     #999999;
    --text:    #f0f0f0;
    --accent:  #2563eb;
    --accent2: #3b82f6;
    --white:   #ffffff;
    --r: 10px;
    --px: 64px;
  }

  @media (max-width: 768px) {
    :root { --px: 20px; }
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--accent) 40%, #60a5fa 60%, transparent 100%);
    z-index: 1000;
  }

  a { text-decoration: none; color: inherit; }

  /* ── Navbar ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px var(--px);
    border-bottom: 1px solid transparent;
    transition: all .3s;
  }
  .nav.scrolled {
    background: rgba(12,12,12,0.94);
    backdrop-filter: blur(24px);
    border-color: var(--border);
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'DM Mono', monospace; font-size: 15px; font-weight: 500;
    color: var(--white); flex-shrink: 0;
  }
  .nav-logo-mark {
    width: 28px; height: 28px;
    border: 2px solid var(--accent); border-radius: 6px;
    display: grid; place-items: center;
    font-size: 12px; font-weight: 700; color: var(--accent);
  }
  .nav-links {
    display: flex; gap: 32px;
  }
  .nav-links a {
    font-size: 13px; font-weight: 500; color: var(--sub);
    transition: color .2s;
  }
  .nav-links a:hover { color: var(--white); }
  .nav-actions { display: flex; gap: 10px; align-items: center; }

  /* hide links on mobile, keep actions */
  @media (max-width: 768px) {
    .nav-links { display: none; }
    .nav-actions .btn-ghost { display: none; }
  }

  .btn-ghost {
    padding: 8px 16px; font-size: 13px; font-weight: 500;
    color: var(--sub); border: 1px solid var(--border);
    border-radius: var(--r); cursor: pointer; transition: all .2s;
    background: transparent; font-family: inherit;
  }
  .btn-ghost:hover { color: var(--white); border-color: var(--mid); }
  .btn-primary {
    padding: 8px 16px; font-size: 13px; font-weight: 600;
    background: var(--accent); color: var(--white);
    border: none; border-radius: var(--r); cursor: pointer;
    transition: all .2s; font-family: inherit;
  }
  .btn-primary:hover { background: var(--accent2); }

  /* ── Hero ── */
  .hero {
    min-height: 100svh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 140px var(--px) 80px;
    position: relative;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 56px 56px;
    opacity: 0.3;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent);
  }
  .hero::after {
    content: '';
    position: absolute;
    top: 20%; left: 50%; transform: translateX(-50%);
    width: 500px; height: 260px;
    background: radial-gradient(ellipse, rgba(37,99,235,0.13) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 24px; position: relative; z-index: 2;
    opacity: 0; animation: fadeUp .6s ease .1s forwards;
  }
  .hero-eyebrow::before, .hero-eyebrow::after {
    content: ''; display: block; height: 1px;
    width: 28px; background: var(--accent); opacity: .5;
  }
  @media (max-width: 480px) {
    .hero-eyebrow::before, .hero-eyebrow::after { width: 16px; }
  }

  .hero h1 {
    position: relative; z-index: 2;
    font-size: clamp(40px, 8vw, 88px);
    font-weight: 700; letter-spacing: -2px; line-height: 1.04;
    margin-bottom: 20px; color: var(--white);
    opacity: 0; animation: fadeUp .7s ease .2s forwards;
  }
  @media (max-width: 480px) {
    .hero h1 { letter-spacing: -1.5px; }
  }
  .hero h1 em { font-style: normal; color: transparent; -webkit-text-stroke: 1px rgba(240,240,240,0.35); }
  .hero h1 .hl { color: var(--accent); }

  .hero-sub {
    position: relative; z-index: 2;
    font-size: clamp(14px, 2vw, 17px); line-height: 1.75;
    color: var(--sub); max-width: 460px; margin: 0 auto 36px;
    opacity: 0; animation: fadeUp .7s ease .3s forwards;
  }

  .hero-actions {
    position: relative; z-index: 2;
    display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    margin-bottom: 48px;
    opacity: 0; animation: fadeUp .7s ease .4s forwards;
  }
  .hero-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px; font-size: 14px; font-weight: 600;
    background: var(--accent); color: var(--white);
    border-radius: var(--r); cursor: pointer; transition: all .25s;
    font-family: inherit; border: 1px solid var(--accent);
  }
  .hero-cta:hover { background: var(--accent2); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,0.28); }
  .hero-outline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px; font-size: 14px; font-weight: 500;
    background: transparent; color: var(--sub);
    border-radius: var(--r); cursor: pointer; transition: all .25s;
    font-family: inherit; border: 1px solid var(--border);
  }
  .hero-outline:hover { color: var(--white); border-color: var(--mid); }

  .hero-proof {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 14px;
    justify-content: center; flex-wrap: wrap;
    opacity: 0; animation: fadeUp .7s ease .5s forwards;
  }
  .avatar-stack { display: flex; }
  .avatar-stack img {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--bg); margin-left: -7px;
  }
  .avatar-stack img:first-child { margin-left: 0; }
  .proof-text { font-size: 13px; color: var(--sub); }
  .proof-text strong { color: var(--text); }
  .proof-divider { width: 1px; height: 18px; background: var(--border); }

  /* ── Mockup ── */
  .mockup-wrap {
    position: relative; z-index: 2; width: 100%; max-width: 840px;
    margin: 60px auto 0; padding: 0;
    opacity: 0; animation: fadeUp .9s ease .55s forwards;
  }
  .browser-frame {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 28px 70px rgba(0,0,0,0.55), 0 0 0 1px var(--border);
  }
  .browser-bar {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 12px; border-bottom: 1px solid var(--border); background: var(--bg);
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #2e2e2e; }
  .url-bar {
    flex: 1; height: 20px; background: var(--surface);
    border-radius: 5px; margin: 0 8px; border: 1px solid var(--border);
  }
  .dash-layout {
    display: grid; grid-template-columns: 170px 1fr;
    aspect-ratio: 16 / 6.5;
  }
  @media (max-width: 600px) {
    .dash-layout { grid-template-columns: 110px 1fr; aspect-ratio: 16 / 8; }
  }
  .dash-sidebar {
    background: var(--bg); border-right: 1px solid var(--border);
    padding: 16px 10px; display: flex; flex-direction: column; gap: 2px;
  }
  .dash-logo {
    display: flex; align-items: center; gap: 6px; margin-bottom: 14px;
    font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text);
  }
  @media (max-width: 600px) { .dash-logo span { display: none; } }
  .dash-logo-mark {
    width: 20px; height: 20px; border: 1.5px solid var(--accent);
    border-radius: 4px; display: grid; place-items: center;
    font-size: 8px; color: var(--accent); font-weight: 700; flex-shrink: 0;
  }
  .dash-nav-item {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 8px; border-radius: 6px;
    font-size: 10px; color: var(--muted);
  }
  @media (max-width: 600px) { .dash-nav-item { font-size: 8px; padding: 5px 6px; } }
  .dash-nav-item.active { background: rgba(37,99,235,0.1); color: var(--accent); }
  .dash-nav-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .dash-main { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .dash-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; }
  @media (max-width: 600px) { .dash-stats { grid-template-columns: repeat(2,1fr); } }
  .dash-stat {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 7px; padding: 10px;
  }
  .dash-stat-val {
    font-family: 'DM Mono', monospace; font-size: 15px; font-weight: 500;
    color: var(--white); margin-bottom: 2px;
  }
  @media (max-width: 600px) { .dash-stat-val { font-size: 12px; } }
  .dash-stat-label { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }
  .dash-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex: 1; }
  .dash-card { background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 10px; }
  .dash-card-title { font-size: 8px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
  .dash-bar-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .dash-bar-thumb { width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; background: rgba(37,99,235,0.12); }
  .dash-bar-track { flex: 1; height: 3px; background: var(--surface); border-radius: 2px; overflow: hidden; }
  .dash-bar-fill { height: 100%; border-radius: 2px; background: var(--accent); }
  .dash-badge {
    font-family: 'DM Mono', monospace; font-size: 8px; font-weight: 500;
    padding: 2px 5px; border-radius: 3px;
    background: rgba(37,99,235,0.12); color: var(--accent); flex-shrink: 0;
  }

  /* ── Stats band ── */
  .stats-band {
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    display: flex; justify-content: center; flex-wrap: wrap;
  }
  .stat-item {
    padding: 28px 32px; text-align: center;
    border-right: 1px solid var(--border);
    flex: 1; min-width: 120px;
  }
  .stat-item:last-child { border-right: none; }
  @media (max-width: 640px) {
    .stat-item { padding: 20px 16px; min-width: 50%; }
    .stat-item:nth-child(even) { border-right: none; }
    .stat-item:nth-child(3) { border-top: 1px solid var(--border); }
    .stat-item:nth-child(4) { border-top: 1px solid var(--border); }
    .stat-item:nth-child(5) { border-top: 1px solid var(--border); min-width: 100%; border-right: none; }
  }
  .stat-num {
    font-family: 'DM Mono', monospace; font-size: clamp(24px,4vw,34px); font-weight: 500;
    color: var(--white); letter-spacing: -1px; margin-bottom: 4px;
  }
  .stat-num span { color: var(--accent); }
  .stat-label { font-size: 11px; color: var(--muted); }

  /* ── Sections ── */
  .section { max-width: 1160px; margin: 0 auto; padding: 80px var(--px); }
  @media (max-width: 768px) { .section { padding: 60px var(--px); } }

  .section-tag {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 11px; font-weight: 500; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 18px;
  }
  .section-tag::before { content: ''; display: block; width: 18px; height: 1px; background: var(--accent); }
  .section-title {
    font-size: clamp(26px, 4vw, 48px); font-weight: 700;
    letter-spacing: -1.5px; line-height: 1.06; color: var(--white); margin-bottom: 14px;
  }
  .section-title em { font-style: normal; color: var(--accent); }
  .section-sub { font-size: 15px; line-height: 1.7; color: var(--sub); max-width: 440px; }

  /* ── Features ── */
  .feature-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 1px; margin-top: 52px;
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  }
  @media (max-width: 768px) {
    .feature-grid { grid-template-columns: 1fr; }
  }
  .feature-card { padding: 32px; background: var(--surface); transition: background .2s; }
  .feature-card:hover { background: #191919; }
  .feature-card.wide {
    grid-column: 1 / -1;
    display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
  }
  @media (max-width: 768px) {
    .feature-card.wide { grid-template-columns: 1fr; gap: 24px; }
  }
  .feature-card + .feature-card { border-top: 1px solid var(--border); }
  .feature-card:nth-child(3) { border-left: 1px solid var(--border); }
  @media (max-width: 768px) {
    .feature-card:nth-child(3) { border-left: none; }
  }
  .feature-icon {
    width: 38px; height: 38px; border-radius: 8px;
    border: 1px solid var(--border); display: grid; place-items: center;
    font-size: 15px; color: var(--accent); margin-bottom: 18px;
    background: rgba(37,99,235,0.06);
  }
  .feature-h { font-size: 17px; font-weight: 600; color: var(--white); letter-spacing: -.4px; margin-bottom: 9px; }
  .feature-p { font-size: 13px; line-height: 1.7; color: var(--sub); }
  .feature-demo { background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 18px; }
  .skill-chip {
    display: inline-flex; padding: 4px 10px; margin: 2px;
    border: 1px solid var(--border); border-radius: 5px;
    font-family: 'DM Mono', monospace; font-size: 10px; color: var(--sub);
  }
  .match-row {
    border: 1px solid rgba(37,99,235,0.2); border-radius: 7px; padding: 12px;
    background: rgba(37,99,235,0.04); margin-top: 10px;
  }
  .match-title { font-size: 12px; font-weight: 600; color: var(--white); margin-bottom: 4px; }
  .match-meta { font-size: 10px; color: var(--sub); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .match-badge {
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    color: var(--accent); background: rgba(37,99,235,0.1);
    padding: 2px 7px; border-radius: 4px; margin-left: auto;
  }

  /* ── How it works ── */
  .steps {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 40px; margin-top: 52px; position: relative;
  }
  @media (max-width: 640px) {
    .steps { grid-template-columns: 1fr; gap: 32px; }
    .steps::before { display: none; }
  }
  .steps::before {
    content: '';
    position: absolute; top: 19px;
    left: calc(16.6% + 18px); right: calc(16.6% + 18px); height: 1px;
    background: var(--border);
  }
  .step-num {
    width: 38px; height: 38px; border: 1px solid var(--border);
    border-radius: 50%; display: grid; place-items: center;
    font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
    color: var(--accent); background: var(--bg); margin-bottom: 18px;
    position: relative; z-index: 2;
  }
  .step-h { font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 8px; }
  .step-p { font-size: 13px; line-height: 1.7; color: var(--sub); }

  /* ── Pricing ── */
  .pricing-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; margin-top: 52px;
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  }
  @media (max-width: 900px) {
    .pricing-grid { grid-template-columns: 1fr; }
    .pricing-card.featured { border-left: none; border-right: none; order: -1; }
    .pricing-card:last-child { border-left: none; border-top: 1px solid var(--border); }
  }
  .pricing-card { background: var(--surface); padding: 36px 32px; position: relative; }
  .pricing-card.featured { background: #141d2e; border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
  @media (max-width: 900px) {
    .pricing-card + .pricing-card { border-top: 1px solid var(--border); }
  }
  .pricing-plan {
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
    letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 14px;
  }
  .pricing-amount {
    font-family: 'DM Mono', monospace; font-size: 36px; font-weight: 500;
    color: var(--white); letter-spacing: -2px; margin-bottom: 4px;
  }
  .pricing-amount sub { font-size: 14px; color: var(--muted); vertical-align: baseline; }
  .pricing-period { font-size: 12px; color: var(--muted); margin-bottom: 24px; }
  .pricing-divider { height: 1px; background: var(--border); margin-bottom: 20px; }
  .pricing-feature { display: flex; align-items: center; gap: 9px; font-size: 13px; color: var(--sub); margin-bottom: 10px; }
  .pricing-feature.off { opacity: 0.3; }
  .pricing-cta {
    display: block; width: 100%; padding: 12px; text-align: center;
    border-radius: var(--r); font-size: 14px; font-weight: 600;
    margin-top: 24px; cursor: pointer; transition: all .2s; font-family: inherit;
  }
  .pricing-cta.solid { background: var(--accent); color: var(--white); border: 1px solid var(--accent); }
  .pricing-cta.solid:hover { background: var(--accent2); box-shadow: 0 8px 20px rgba(37,99,235,0.25); }
  .pricing-cta.outline { background: transparent; color: var(--sub); border: 1px solid var(--border); }
  .pricing-cta.outline:hover { color: var(--white); border-color: var(--mid); }
  .featured-badge {
    position: absolute; top: 16px; right: 16px;
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    letter-spacing: .5px; text-transform: uppercase;
    color: var(--accent); background: rgba(37,99,235,0.1);
    border: 1px solid rgba(37,99,235,0.25); padding: 3px 9px; border-radius: 5px;
  }

  /* ── Testimonials ── */
  .testi-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  }
  @media (max-width: 768px) {
    .testi-grid { grid-template-columns: 1fr; }
    .testi-card + .testi-card { border-top: 1px solid var(--border); }
  }
  .testi-card { padding: 32px; background: var(--surface); }
  .testi-stars { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--accent); letter-spacing: 3px; margin-bottom: 14px; }
  .testi-quote { font-size: 13px; line-height: 1.75; color: rgba(240,240,240,0.62); margin-bottom: 20px; }
  .testi-author { display: flex; align-items: center; gap: 10px; }
  .testi-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: grid; place-items: center;
    font-family: 'DM Mono', monospace; font-size: 11px; color: var(--white);
  }
  .testi-name { font-size: 13px; font-weight: 600; color: var(--white); }
  .testi-role { font-size: 11px; color: var(--muted); margin-top: 1px; }

  /* ── CTA ── */
  .cta-section {
    border: 1px solid var(--border); border-radius: 12px;
    padding: 64px var(--px); text-align: center; position: relative; overflow: hidden;
    background: var(--surface); margin: 0 var(--px) 64px;
  }
  @media (max-width: 768px) { .cta-section { padding: 48px var(--px); margin: 0 var(--px) 48px; } }
  .cta-section::before {
    content: '';
    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 360px; height: 180px;
    background: radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-h { font-size: clamp(24px,3.5vw,42px); font-weight: 700; letter-spacing: -1.5px; color: var(--white); margin-bottom: 14px; }
  .cta-sub { font-size: 15px; color: var(--sub); max-width: 400px; margin: 0 auto 32px; line-height: 1.7; }
  .cta-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

  /* ── Footer ── */
  .footer {
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
    gap: 14px; padding: 24px var(--px);
  }
  @media (max-width: 640px) {
    .footer { flex-direction: column; align-items: flex-start; gap: 12px; }
  }
  .footer-logo { display: flex; align-items: center; gap: 8px; font-family: 'DM Mono', monospace; font-size: 13px; color: var(--sub); }
  .footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
  .footer-links a { font-size: 12px; color: var(--muted); transition: color .2s; }
  .footer-links a:hover { color: var(--sub); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="nav-logo">
        <img src="/meritlives.svg" alt="MeritLives" style={{width:28,height:28}} />
        SkillHub
      </Link>
      <div className="nav-links">
        {[['Features','#features'],['How it works','#how'],['Pricing','#pricing']].map(([l,h]) => (
          <a key={l} href={h}>{l}</a>
        ))}
      </div>
      <div className="nav-actions">
        <Link href="/login" className="btn-ghost">Sign in</Link>
        <Link href="/login?tab=register" className="btn-primary">Get started</Link>
      </div>
    </nav>
  );
}

function Hero() {
  const avatars = ['AJ','SW','KO','TB','FA'];
  const colors  = ['2563eb','059669','d97706','dc2626','7c3aed'];
  return (
    <section className="hero">
      <div className="hero-eyebrow">Now live across Africa</div>
      <h1>
        Build skills.<br />
        Get <em>verified.</em><br />
        <span className="hl">Get hired.</span>
      </h1>
      <p className="hero-sub">
        SkillHub connects African tech talent with world-class courses, verified certificates, and real employers — all in one platform.
      </p>
      <div className="hero-actions">
        <Link href="/login?tab=register" className="hero-cta">Start for free →</Link>
        <a href="#how" className="hero-outline">See how it works</a>
      </div>
      <div className="hero-proof">
        <div className="avatar-stack">
          {avatars.map((a,i) => (
            <img key={a} src={`https://ui-avatars.com/api/?name=${a}&background=${colors[i]}&color=fff&bold=true&size=60`} alt={a} />
          ))}
        </div>
        <div className="proof-divider" />
        <p className="proof-text">Trusted by <strong>12,000+</strong> tech professionals</p>
      </div>

      <div className="mockup-wrap">
        <div className="browser-frame">
          <div className="browser-bar">
            <div className="dot"/><div className="dot"/><div className="dot"/>
            <div className="url-bar"/>
          </div>
          <div className="dash-layout">
            <div className="dash-sidebar">
              <div className="dash-logo">
                <img src="/meritlives.svg" alt="MeritLives" style={{width:28,height:28}} />
                <span>SkillHub</span>
              </div>
              {[['Dashboard',true],['Courses',false],['Portfolio',false],['Jobs',false],['Rewards',false]].map(([l,a]) => (
                <div key={String(l)} className={`dash-nav-item${a?' active':''}`}>
                  <div className="dash-nav-dot"/>{l}
                </div>
              ))}
            </div>
            <div className="dash-main">
              <div className="dash-stats">
                {[['6','Courses'],['3','Certs'],['92%','Match'],['1,250','Coins']].map(([v,l]) => (
                  <div key={l} className="dash-stat">
                    <div className="dash-stat-val">{v}</div>
                    <div className="dash-stat-label">{l}</div>
                  </div>
                ))}
              </div>
              <div className="dash-cards">
                <div className="dash-card">
                  <div className="dash-card-title">Active Courses</div>
                  {[[70,'React'],[45,'Data Analysis']].map(([w,n]) => (
                    <div key={String(n)} className="dash-bar-row">
                      <div className="dash-bar-thumb"/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:'var(--muted)',marginBottom:3}}>{n}</div>
                        <div className="dash-bar-track"><div className="dash-bar-fill" style={{width:`${w}%`}}/></div>
                      </div>
                      <div className="dash-badge">{w}%</div>
                    </div>
                  ))}
                </div>
                <div className="dash-card">
                  <div className="dash-card-title">Job Matches</div>
                  {[['Frontend Dev','92%'],['Data Analyst','78%']].map(([j,p]) => (
                    <div key={j} className="dash-bar-row">
                      <div className="dash-bar-thumb"/>
                      <div style={{flex:1,fontSize:8,color:'var(--muted)'}}>{j}</div>
                      <div className="dash-badge">{p}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const stats = [['12K+','Active learners'],['95%','Job placement'],['500+','Hiring partners'],['50+','Courses'],['₦0','To get started']];
  return (
    <div className="stats-band">
      {stats.map(([n,l]) => (
        <div key={l} className="stat-item">
          <div className="stat-num">
            {n.endsWith('+') ? <>{n.slice(0,-1)}<span>+</span></> :
             n.endsWith('%') ? <>{n.slice(0,-1)}<span>%</span></> : n}
          </div>
          <div className="stat-label">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="section">
      <div className="section-tag">Features</div>
      <h2 className="section-title">Everything you need<br />to <em>grow</em></h2>
      <p className="section-sub">From learning to landing — every tool in one place, built for African tech careers.</p>

      <div className="feature-grid">
        <div className="feature-card wide">
          <div>
            <div className="feature-icon"><i className="fas fa-brain"/></div>
            <h3 className="feature-h">Smart Skill Matching</h3>
            <p className="feature-p">Our algorithm matches your skills with jobs that need exactly what you have — and recommends courses to close the gap. Get 90%+ match rates before you apply.</p>
          </div>
          <div className="feature-demo">
            <div style={{fontSize:10,fontFamily:'DM Mono',color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.5px'}}>Your profile</div>
            <div style={{marginBottom:10}}>
              {['JavaScript','React','Node.js','Python','CSS'].map(t => <span key={t} className="skill-chip">{t}</span>)}
            </div>
            <div className="match-row">
              <div className="match-title">Frontend Developer — Paystack</div>
              <div className="match-meta">
                Remote · $2,500–$4,000/mo
                <span className="match-badge">92% match</span>
              </div>
            </div>
          </div>
        </div>

        {[
          { icon:'fa-certificate', h:'Verified Certificates',  p:'Every certificate is blockchain-verified and shareable. Employers trust SkillHub credentials because we verify them ourselves.' },
          { icon:'fa-coins',       h:'Merit Coins Rewards',    p:'Earn coins for every course completed, certificate added, and project uploaded. Redeem for premium courses and career boosts.' },
          { icon:'fa-layer-group', h:'Portfolio Builder',      p:'Showcase projects with AI-scored portfolios. Employers see your work, skills, and certificates in one professional profile.' },
          { icon:'fa-building',    h:'Employer Dashboard',     p:'Post jobs, search verified candidates, and track applications — from a dedicated portal built for African hiring teams.' },
        ].map(c => (
          <div key={c.h} className="feature-card">
            <div className="feature-icon"><i className={`fas ${c.icon}`}/></div>
            <h3 className="feature-h">{c.h}</h3>
            <p className="feature-p">{c.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="section" style={{borderTop:'1px solid var(--border)'}}>
      <div className="section-tag">How it works</div>
      <h2 className="section-title">Three steps to your<br /><em>next opportunity</em></h2>
      <p className="section-sub">No complicated setup. Start learning and earning in minutes.</p>
      <div className="steps">
        {[
          { n:'01', h:'Create your profile',   p:'Sign up free, add your skills and experience. Your profile strength score guides you to stand out to employers.' },
          { n:'02', h:'Learn & earn coins',     p:'Enroll in free and premium courses. Complete modules, earn Merit Coins, and get certificates employers verify.' },
          { n:'03', h:'Get hired',              p:'Apply to matched jobs with one click. Your verified profile does the talking — no more CVs into the void.' },
        ].map(s => (
          <div key={s.n} className="step">
            <div className="step-num">{s.n}</div>
            <h3 className="step-h">{s.h}</h3>
            <p className="step-p">{s.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="section" style={{borderTop:'1px solid var(--border)'}}>
      <div className="section-tag">Pricing</div>
      <h2 className="section-title">Start free.<br /><em>Upgrade when ready.</em></h2>
      <p className="section-sub">No credit card required to get started.</p>

      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-plan">Free</div>
          <div className="pricing-amount">₦0</div>
          <div className="pricing-period">Forever free</div>
          <div className="pricing-divider"/>
          {[[true,'Access 30+ free courses'],[true,'Basic job matching'],[true,'Portfolio builder'],[true,'Merit Coins rewards'],[false,'Premium courses'],[false,'Priority job matching']].map(([y,t]) => (
            <div key={String(t)} className={`pricing-feature${y?'':' off'}`}>
              <i className={`fas ${y?'fa-check':'fa-times'}`} style={{fontSize:11,color:y?'var(--accent)':'var(--muted)',flexShrink:0}}/>{t}
            </div>
          ))}
          <Link href="/login?tab=register" className="pricing-cta outline">Get started free</Link>
        </div>

        <div className="pricing-card featured">
          <span className="featured-badge">Most popular</span>
          <div className="pricing-plan">Pro</div>
          <div className="pricing-amount">₦5,000<sub>/mo</sub></div>
          <div className="pricing-period">or ₦45,000/year — save 25%</div>
          <div className="pricing-divider"/>
          {['Everything in Free','All premium courses','Priority job matching','Featured profile badge','Resume review','Mock interviews','2× Merit Coin earn rate'].map(t => (
            <div key={t} className="pricing-feature">
              <i className="fas fa-check" style={{fontSize:11,color:'var(--accent)',flexShrink:0}}/>{t}
            </div>
          ))}
          <Link href="/login?tab=register" className="pricing-cta solid">Start free trial</Link>
        </div>

        <div className="pricing-card">
          <div className="pricing-plan">Employer</div>
          <div className="pricing-amount">₦15,000<sub>/mo</sub></div>
          <div className="pricing-period">or ₦135,000/year</div>
          <div className="pricing-divider"/>
          {[[true,'Post unlimited jobs'],[true,'Search verified candidates'],[true,'Employer dashboard'],[true,'Application tracking'],[true,'Skill-matched shortlists'],[true,'Priority support'],[false,'Course hosting']].map(([y,t]) => (
            <div key={String(t)} className={`pricing-feature${y?'':' off'}`}>
              <i className={`fas ${y?'fa-check':'fa-times'}`} style={{fontSize:11,color:y?'var(--accent)':'var(--muted)',flexShrink:0}}/>{t}
            </div>
          ))}
          <Link href="/login?tab=register" className="pricing-cta outline">Start hiring</Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="section" style={{borderTop:'1px solid var(--border)'}}>
      <div className="section-tag">Stories</div>
      <h2 className="section-title">Real people.<br /><em>Real results.</em></h2>
      <div style={{height:40}}/>
      <div className="testi-grid">
        {[
          { init:'AJ', bg:'2563eb', q:'I went from zero to landing a React developer role at a Lagos startup in 4 months. The skill matching is scary accurate — 92% on my first application.', name:'Alex Johnson', role:'Frontend Developer, Lagos' },
          { init:'SW', bg:'059669', q:'As an employer, finding verified talent used to take weeks. With SkillHub I posted a job and had 3 shortlisted candidates in 48 hours.', name:'Sarah Williams', role:'HR Manager, TechVision Africa' },
          { init:'KO', bg:'d97706', q:'The Merit Coins system kept me going. I redeemed coins for a mock interview, nailed my Andela application. Worth every minute.', name:'Kofi Osei', role:'Data Analyst, Andela' },
        ].map(t => (
          <div key={t.name} className="testi-card">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-quote">"{t.q}"</p>
            <div className="testi-author">
              <div className="testi-avatar" style={{background:`#${t.bg}`}}>{t.init}</div>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <div className="cta-section">
      <h2 className="cta-h">Ready to build your future?</h2>
      <p className="cta-sub">Join 12,000+ tech professionals already using SkillHub to learn, grow, and get hired.</p>
      <div className="cta-actions">
        <Link href="/login?tab=register" className="hero-cta">Create free account →</Link>
        <Link href="/login" className="hero-outline">Sign in</Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <img src="/meritlives.svg" alt="MeritLives" style={{width:28,height:28}} />
        SkillHub Pro
      </div>
      <span style={{fontSize:12,color:'var(--muted)'}}>© 2025 SkillHub Pro · Built for Africa's tech talent</span>
      <div className="footer-links">
        {['Privacy','Terms','Support'].map(l => <a key={l} href="#">{l}</a>)}
        <Link href="/login">Sign in</Link>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <style>{CSS}</style>
      <div style={{background:'var(--bg)',color:'var(--text)',minHeight:'100vh',overflowX:'hidden'}}>
        <Navbar/>
        <Hero/>
        <StatsBand/>
        <Features/>
        <HowItWorks/>
        <Pricing/>
        <Testimonials/>
        <CTA/>
        <Footer/>
      </div>
    </>
  );
}