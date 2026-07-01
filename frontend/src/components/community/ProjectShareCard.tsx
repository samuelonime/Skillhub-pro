'use client';

import { useState } from 'react';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';

const D = {
  card: '#0F1521',
  border: 'rgba(255,255,255,0.07)',
  accent: '#4F8EF7',
  green: '#00E5A0',
  red: '#F87171',
  muted: 'rgba(255,255,255,0.35)',
  text: 'rgba(255,255,255,0.85)',
  input: 'rgba(255,255,255,0.06)',
};

export function ProjectShareCard({ project, onRefresh, isLoggedIn }: {
  project: any;
  onRefresh?: () => void;
  isLoggedIn?: boolean;
}) {
  const [shared, setShared] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/portfolio/projects/${project.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ note: shareNote }),
      });
      if (res.success) {
        setShared(res.data.shared);
        setShowShareModal(false);
        setShareNote('');
        onRefresh?.();
      }
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        style={{ background: D.card, border: `1px solid ${D.border}` }}
        className="rounded-2xl overflow-hidden"
      >
        {/* Thumbnail */}
        {project.thumbnail && (
          <div className="relative w-full h-40 bg-gradient-to-br from-purple-600 to-blue-600">
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-white mb-2">{project.title}</h3>
          <p className="text-xs mb-3" style={{ color: D.text }}>
            {project.description || 'No description provided'}
          </p>

          {/* Tech Stack */}
          {(project.technologies?.length > 0 || project.techStack?.length > 0) && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {[...(project.technologies || []), ...(project.techStack || [])].slice(0, 3).map((tech: string) => (
                <span key={tech} className="text-xs px-2 py-1 rounded-full" style={{ background: D.input, color: D.accent }}>
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 mb-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white text-center transition-opacity hover:opacity-80"
                style={{ background: D.accent }}
              >
                Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-center transition-opacity hover:opacity-80"
                style={{ background: D.input, color: D.text }}
              >
                GitHub
              </a>
            )}
          </div>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: shared ? D.green : D.accent }}
          >
            <i className="fas fa-share-alt mr-2" />
            {shared ? 'Shared' : 'Share Project'}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 w-full max-w-md"
            style={{ background: D.card, border: `1px solid ${D.border}` }}
          >
            <h3 className="text-lg font-bold text-white mb-2">Share {project.title}</h3>
            <p className="text-xs mb-4" style={{ color: D.muted }}>
              Share this project with your profile
            </p>
            <textarea
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white mb-4 resize-none"
              style={{ background: D.input, border: `1px solid ${D.border}` }}
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ background: D.input, color: D.text }}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: D.green }}
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
