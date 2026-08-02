import type { Config } from 'tailwindcss';

/**
 * Config de Tailwind mapeada a los tokens de tokens.css.
 * Todos los valores apuntan a variables CSS, así que tokens.css
 * sigue siendo la única fuente de verdad.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: 'var(--sd-bg-app)',
        surface: {
          DEFAULT: 'var(--sd-surface)',
          elevada: 'var(--sd-surface-elevada)',
          sutil: 'var(--sd-surface-sutil)',
          input: 'var(--sd-surface-input)',
        },
        borde: {
          DEFAULT: 'var(--sd-border)',
          fuerte: 'var(--sd-border-fuerte)',
          sutil: 'var(--sd-border-sutil)',
        },
        texto: {
          DEFAULT: 'var(--sd-text)',
          secundario: 'var(--sd-text-secundario)',
          atenuado: 'var(--sd-text-atenuado)',
          deshabilitado: 'var(--sd-text-deshabilitado)',
          dorado: 'var(--sd-text-sobre-dorado)',
        },
        dorado: {
          DEFAULT: 'var(--sd-dorado)',
          claro: 'var(--sd-dorado-claro)',
          profundo: 'var(--sd-dorado-profundo)',
          tenue: 'var(--sd-dorado-tenue)',
        },
        positivo: 'var(--sd-positivo)',
        negativo: 'var(--sd-negativo)',
      },
      backgroundImage: {
        'surface-grad': 'var(--sd-surface-grad)',
        'surface-grad-elevada': 'var(--sd-surface-grad-elevada)',
        'surface-grad-dorada': 'var(--sd-surface-grad-dorada)',
        'surface-grad-rosa': 'var(--sd-surface-grad-rosa)',
        'dorado-grad': 'var(--sd-dorado-grad)',
        'bloom-dorado': 'var(--sd-bloom-dorado)',
        'bloom-rosa': 'var(--sd-bloom-rosa)',
      },
      fontFamily: { sans: ['Archivo', 'system-ui', 'sans-serif'] },
      fontSize: {
        micro: 'var(--sd-fs-micro)',
        caption: 'var(--sd-fs-caption)',
        label: 'var(--sd-fs-label)',
        'body-sm': 'var(--sd-fs-body-sm)',
        body: 'var(--sd-fs-body)',
        'body-lg': 'var(--sd-fs-body-lg)',
        subtitulo: 'var(--sd-fs-subtitulo)',
        'titulo-sm': 'var(--sd-fs-titulo-sm)',
        titulo: 'var(--sd-fs-titulo)',
        'titulo-lg': 'var(--sd-fs-titulo-lg)',
        'display-sm': 'var(--sd-fs-display-sm)',
        display: 'var(--sd-fs-display)',
        'display-lg': 'var(--sd-fs-display-lg)',
      },
      borderRadius: {
        xs: 'var(--sd-r-xs)', sm: 'var(--sd-r-sm)', md: 'var(--sd-r-md)',
        lg: 'var(--sd-r-lg)', xl: 'var(--sd-r-xl)', '2xl': 'var(--sd-r-2xl)',
        '3xl': 'var(--sd-r-3xl)', nav: 'var(--sd-r-nav)', pill: 'var(--sd-r-pill)',
      },
      boxShadow: {
        sutil: 'var(--sd-sh-sutil)',
        card: 'var(--sd-sh-card)',
        dropdown: 'var(--sd-sh-dropdown)',
        modal: 'var(--sd-sh-modal)',
        sheet: 'var(--sd-sh-sheet)',
        nav: 'var(--sd-sh-nav)',
        fab: 'var(--sd-sh-fab)',
      },
      keyframes: {
        'screen-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'pop-in': { from: { transform: 'scale(.85)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        'screen-in': 'screen-in 220ms cubic-bezier(.16,1,.3,1) both',
        'sheet-up': 'sheet-up 220ms cubic-bezier(.16,1,.3,1) both',
        'pop-in': 'pop-in 180ms cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
