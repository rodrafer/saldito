import { AppShell } from '@/components/layout';
import type { ReactNode } from 'react';

/** Every signed-in screen hangs off this shell. The auth flows sit outside the
 *  group, so they get the ambient background without the rail or the bar. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
