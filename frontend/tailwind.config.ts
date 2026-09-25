import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          0: 'var(--ink-0)', // deepest — map canvas
          1: 'var(--ink-1)', // page background
          2: 'var(--ink-2)', // panel surface
          3: 'var(--ink-3)' // raised / hover surface
        },
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        mist: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)'
        },
        accent: 'var(--accent)', // teal — water / primary / safe
        accent2: 'var(--accent2)', // indigo — interactive / selection
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        // high-contrast danger text (rose-200) for alerts on dark surfaces
        'danger-hi': 'var(--danger-hi)',
        est: 'var(--est)'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-bengali)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        bn: ['var(--font-bengali)', 'var(--font-inter)', 'sans-serif'],
        telegraf: ['Telegraf', 'var(--font-inter)', 'sans-serif'],
        editorial: ['Editorial New', 'Georgia', 'serif'],
        sweetsans: ['Sweet Sans Pro', 'var(--font-inter)', 'sans-serif']
      },
      borderRadius: {
        panel: '0.75rem'
      },
      boxShadow: {
        panel: '0 8px 32px -12px rgba(0,0,0,.65), 0 2px 8px -4px rgba(0,0,0,.5)',
        'panel-lg': '0 24px 64px -16px rgba(0,0,0,.7), 0 4px 16px -8px rgba(0,0,0,.55)'
      },
      width: {
        // desktop operations side panel (action card / gauge / data quality)
        panel: '380px'
      },
      maxWidth: {
        read: '46rem',
        // overlay state-selector <select> on the ops map
        state: '180px'
      },
      maxHeight: {
        // scrollable layer-switcher block inside the workflow rail
        layers: '42vh'
      }
    }
  },
  plugins: []
};
export default config;
