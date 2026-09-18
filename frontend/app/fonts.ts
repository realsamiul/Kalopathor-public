import localFont from 'next/font/local';

// Variable fonts (wght axis) vendored from Fontsource (MIT/OFL) into public/fonts.
// Two subsets per Latin family → next/font emits unicode-range per file.

export const inter = localFont({
  src: [
    {path: '../public/fonts/InterVariable.woff2', weight: '100 900', style: 'normal'},
    {path: '../public/fonts/InterVariable-ext.woff2', weight: '100 900', style: 'normal'}
  ],
  variable: '--font-inter',
  display: 'swap'
});

export const jetbrains = localFont({
  src: [
    {path: '../public/fonts/JetBrainsMonoVariable.woff2', weight: '100 800', style: 'normal'},
    {path: '../public/fonts/JetBrainsMonoVariable-ext.woff2', weight: '100 800', style: 'normal'}
  ],
  variable: '--font-mono',
  display: 'swap'
});

export const bengali = localFont({
  src: '../public/fonts/NotoSansBengaliVariable.woff2',
  weight: '100 900',
  variable: '--font-bengali',
  display: 'swap'
});
