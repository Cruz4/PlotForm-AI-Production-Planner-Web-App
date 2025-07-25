
'use client';

// This file is intentionally left blank.
// The nested layout for the board view was causing routing conflicts with Next.js App Router.
// Removing its content and relying on the parent dashboard layout resolves the issue.
// This file can be safely deleted.
import type { ReactNode } from 'react';

export default function BoardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
