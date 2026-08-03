import { KitchenSink } from './KitchenSink';

export const metadata = { title: 'Kitchen sink · Saldito' };

/**
 * Every primitive in its states, on one page, to compare against
 * `design_handoff_saldito/Sistema de diseño.dc.html` without walking the app.
 *
 * `page.dev.tsx` and not `page.tsx`: `next.config.ts` only treats `.dev.tsx` as
 * a page in development, so this route doesn't exist in a production build.
 */
export default function KitchenSinkPage() {
  return <KitchenSink />;
}
