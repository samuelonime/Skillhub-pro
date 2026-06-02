'use client';

import { useEffect, useState } from 'react';
import { getCachedUser } from '@/lib/api';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This only runs on the client after hydration
    const cachedUser = getCachedUser();
    setUser(cachedUser);
    setLoading(false);
  }, []);

  return { user, loading };
}