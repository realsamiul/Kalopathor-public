import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          0: 'var(--ink-0)', // deepest — pure obsidian space dark
          1: 'var(--ink-1)', // dark page background
          2: 'var(--ink-2)', // iOS frosted panel surface
          3: 'var(--ink-3)'  // elevated / active surface
        },
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        mist: {
          1: 'var(--text-1)', // #ffffff pure white
          2: 'var(--text-2)', // #f8fafc crisp luminous off-white
          3: 'var(--text-3)'  // #e2e8f0 crisp high-contrast white-slate
        },
        accent: 'var(--accent)', // vibrant cyan — water / primary / radar
        accent2: 'var(--accent2)', // electric indigo — interactive / neural
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        'danger-hi': 'var(--danger-hi)',
        est: 'var(--est)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-inter)', 'var(--font-bengali)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        bn: ['var(--font-bengali)', 'var(--font-sans)', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        panel: '1rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      boxShadow: {
        panel: '0 8px 32px -8px rgba(0,0,0,.75), inset 0 1px 0 0 rgba(255,255,255,0.1)',
        'panel-lg': '0 24px 64px -16px rgba(0,0,0,.85), inset 0 1px 0 0 rgba(255,255,255,0.14)',
        ios: '0 12px 36px -10px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.12)',
        'ios-glow': '0 0 35px -5px rgba(56,189,248,0.25), inset 0 1px 0 0 rgba(255,255,255,0.15)'
      },
      width: {
        panel: '380px'
      },
      maxWidth: {
        read: '46rem',
        state: '180px'
      },
      maxHeight: {
        layers: '42vh'
      }
    }
  },
  plugins: []
};
export default config;
