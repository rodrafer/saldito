import { Card } from '@/components/ui';
import { DesktopGrid } from './DesktopGrid';
import type { ReactNode } from 'react';

export interface PlaceholderScreenProps {
  title: string;
  /** Which phase builds the real thing. */
  phase: string;
  aside?: ReactNode;
}

/**
 * Stand-in for the screens phases 4–7 will build.
 *
 * It exists so the shell is something you can actually walk through: the rail
 * and the bottom bar navigate somewhere real, and every screen already sits on
 * the firm grid — so the layout gets checked against the prototype now, rather
 * than once there's content to hide behind.
 */
export function PlaceholderScreen({ title, phase, aside = null }: PlaceholderScreenProps) {
  return (
    <div className="sd-pantalla sd-stack">
      <h1 className="text-titulo desktop:text-titulo-lg font-semibold">{title}</h1>
      <DesktopGrid aside={aside}>
        <Card>
          <p className="text-body text-texto-atenuado">Se construye en la {phase}.</p>
        </Card>
      </DesktopGrid>
    </div>
  );
}
