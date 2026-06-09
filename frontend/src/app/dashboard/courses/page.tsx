import { Suspense } from 'react';
import CoursesClient from './CoursesClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#6b6b8a]">Loading courses…</div>}>
      <CoursesClient />
    </Suspense>
  );
}
