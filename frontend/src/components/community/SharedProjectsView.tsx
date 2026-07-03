'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { ProjectShareCard } from './ProjectShareCard';

const D = {
  card: '#0F1521',
  border: 'rgba(255,255,255,0.07)',
  accent: '#4F8EF7',
  text: 'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  input: 'rgba(255,255,255,0.06)',
};

export function SharedProjectsView({ userId, isLoggedIn }: {
  userId: string;
  isLoggedIn?: boolean;
}) {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function loadShares() {
    try {
      setLoading(true);
      const res = await apiFetch(`/portfolio/shares?userId=${userId}&page=${page}`);
      if (res.success) {
        if (page === 1) {
          setShares(res.data.shares || []);
        } else {
          setShares(prev => [...prev, ...res.data.shares]);
        }
        setHasMore(page < res.data.pages);
      }
    } catch (e) {
      console.error('Failed to load shared projects:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShares();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (loading && page === 1) {
    return <div style={{ color: D.subtext }} className="text-center py-8">Loading shared projects...</div>;
  }

  if (!shares.length) {
    return (
      <div style={{ color: D.subtext }} className="text-center py-8">
        <i className="fas fa-share text-3xl mb-3 block opacity-50" />
        No shared projects yet
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shares.map((share) => (
          <div key={share.id}>
            <ProjectShareCard project={share.project} isLoggedIn={isLoggedIn} />
            {share.note && (
              <div
                className="rounded-lg p-2 mt-2 text-xs"
                style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}
              >
                💭 {share.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-opacity mt-4"
          style={{ background: D.input, color: D.accent }}
        >
          Load More
        </button>
      )}
    </div>
  );
}
