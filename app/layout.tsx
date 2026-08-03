import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import { AmbientBackground } from '@/components/ui';
import './globals.css';

/** The handoff pulled Archivo in with a Google Fonts `@import`, which blocks
 *  the first paint and shifts the layout when it lands. next/font self-hosts
 *  it and exposes the family through --font-archivo, which tokens.css reads. */
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Saldito',
  description: 'Las cuentas de la casa, sin vueltas.',
};

export const viewport: Viewport = {
  /* The only place a literal is unavoidable: browser chrome is painted before
     any stylesheet, so it can't read --sd-bg-app. Keep the two in step. */
  themeColor: '#111013',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={archivo.variable}>
      <body>
        {/* Uso único: la luminiscencia ambiente envuelve la app entera y nunca
            se repite por pantalla. */}
        <AmbientBackground>{children}</AmbientBackground>
      </body>
    </html>
  );
}
