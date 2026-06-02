'use client';

import { useEffect, useState } from 'react';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return children immediately but with hydration-safe wrapper
  return (
    <div suppressHydrationWarning>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </div>
  );
}