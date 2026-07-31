'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

// ── Mock Interview modal ──────────────────────────────────────────────────
// Opens the moment a user redeems the "Mock Interview Session" reward.
// Loads the session created by the backend redeem call, walks the user
// through each question, submits answers for scoring, and finishes on an
// animated final report. Session/question/answer contracts come straight
// from backend/src/routes/mockInterview.js — nothing here invents shape.

type Question = { id: string; text: string; category?: string; expectedKeywords?: string[] };
type AnswerResult = { score: number; feedback: string[]; breakdown: Record<string, number> };
type FinalReport = { overallScore: number; verdict: string; strengths: string[]; improvements: string[] };

interface MockInterviewModalProps {
  sessionId: string;
  onClose: () => void;
}

function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score >= 75 ? '#00E5A0' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-jakarta font-extrabold text-[18px]" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export function MockInterviewModal({ sessionId, onClose }: MockInterviewModalProps) {
  const [phase, setPhase] = useState<'loading' | 'question' | 'scored' | 'report' | 'error'>('loading');
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load the session the redeem call already created on the backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/mock-interview/${sessionId}`);
        if (cancelled) return;
        if (!res.success) { setErrorMsg(res.message || 'Could not load your mock interview.'); setPhase('error'); return; }
        const session = res.data;
        setRole(session.role);
        setQuestions(session.questions || []);
        if (session.status === 'completed') {
          setReport({
            overallScore: session.overallScore,
            verdict: session.verdict,
            strengths: [],
            improvements: [],
          });
          setPhase('report');
        } else {
          setCurrentIndex(session.currentQuestionIndex || 0);
          setPhase('question');
        }
      } catch (e: any) {
        if (cancelled) return;
        setErrorMsg(e.message || 'Could not load your mock interview.');
        setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  async function submitAnswer() {
    if (!answerText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/mock-interview/${sessionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ text: answerText }),
      });
      if (!res.success) { setErrorMsg(res.message || 'Failed to submit your answer.'); setPhase('error'); return; }

      if (res.data.completed) {
        setLastResult(res.data.answerResult);
        setReport(res.data.report);
        setPhase('scored');
      } else {
        setLastResult(res.data.answerResult);
        setCurrentIndex(res.data.currentQuestionIndex);
        setPhase('scored');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to submit your answer.');
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    setAnswerText('');
    setLastResult(null);
    if (report) { setPhase('report'); return; }
    setPhase('question');
  }

  const totalQuestions = questions.length;
  const question = questions[currentIndex];
  const progressPct = totalQuestions ? Math.min(100, (currentIndex / totalQuestions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={phase === 'question' ? undefined : onClose}>
      <div
        className="animate-modal-in w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.09)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: 'rgba(0,229,160,0.12)' }}>
              <i className="fas fa-comments text-[15px]" style={{ color: '#00E5A0' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-jakarta font-bold text-[15px] truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>Mock Interview</h3>
              {role && <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{role}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center shrink-0 transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Progress bar (question phases only) */}
        {(phase === 'question' || phase === 'scored') && totalQuestions > 0 && (
          <div className="px-5 pt-4 shrink-0">
            <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>Question {Math.min(currentIndex + 1, totalQuestions)} of {totalQuestions}</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #4F8EF7, #00E5A0)' }} />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto" style={{ flex: 1 }}>
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,229,160,0.25)', borderTopColor: '#00E5A0' }} />
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Setting up your mock interview…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <i className="fas fa-triangle-exclamation text-3xl" style={{ color: '#EF4444' }} />
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{errorMsg}</p>
              <button onClick={onClose} className="mt-2 px-4 py-2 rounded-xl text-[12px] font-semibold border-0 cursor-pointer text-white" style={{ background: '#4F8EF7' }}>
                Close
              </button>
            </div>
          )}

          {phase === 'question' && question && (
            <div className="flex flex-col gap-3">
              {question.category && (
                <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
                  {question.category}
                </span>
              )}
              <p className="text-[15px] leading-relaxed font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{question.text}</p>
              <textarea
                autoFocus
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Type your answer as you would say it out loud…"
                rows={7}
                className="w-full px-3.5 py-3 text-[13px] rounded-xl outline-none resize-none font-[inherit]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                  {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words
                </span>
                <button
                  onClick={submitAnswer}
                  disabled={!answerText.trim() || submitting}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold border-0 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-2"
                  style={{ background: '#00E5A0', color: '#001A10' }}
                >
                  {submitting ? (
                    <><div className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black/70 animate-spin" /> Scoring…</>
                  ) : (
                    <>Submit Answer <i className="fas fa-arrow-right text-[11px]" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {phase === 'scored' && lastResult && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={lastResult.score} />
                <div>
                  <p className="text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>Answer scored</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Here's how that answer landed</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {lastResult.feedback.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <i className="fas fa-circle-dot text-[6px] mt-1.5 shrink-0" style={{ color: '#4F8EF7' }} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={nextQuestion}
                className="self-end px-5 py-2.5 rounded-xl text-[13px] font-bold border-0 cursor-pointer text-white transition-all"
                style={{ background: '#4F8EF7' }}
              >
                {report ? 'See Final Report' : 'Next Question'} <i className="fas fa-arrow-right text-[11px] ml-1.5" />
              </button>
            </div>
          )}

          {phase === 'report' && report && (
            <div className="flex flex-col gap-4 items-center text-center">
              <ScoreRing score={report.overallScore} size={110} />
              <div>
                <p className="font-jakarta font-bold text-[16px] mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Interview Complete</p>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{report.verdict}</p>
              </div>

              {report.strengths.length > 0 && (
                <div className="w-full text-left rounded-xl p-3.5" style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#00E5A0' }}>Strengths</p>
                  {report.strengths.map((s, i) => (
                    <p key={i} className="text-[12px] mb-1 last:mb-0" style={{ color: 'rgba(255,255,255,0.65)' }}>{s}</p>
                  ))}
                </div>
              )}

              {report.improvements.length > 0 && (
                <div className="w-full text-left rounded-xl p-3.5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>Focus areas</p>
                  {report.improvements.map((s, i) => (
                    <p key={i} className="text-[12px] mb-1 last:mb-0" style={{ color: 'rgba(255,255,255,0.65)' }}>{s}</p>
                  ))}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-bold border-0 cursor-pointer text-white transition-all"
                style={{ background: '#4F8EF7' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}