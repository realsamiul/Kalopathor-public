import localFont from 'next/font/local';

export const plusJakarta = localFont({
  src: [
    {path: '../public/fonts/PlusJakartaSansVariable.woff2', weight: '200 800', style: 'normal'},
    {path: '../public/fonts/InterVariable.woff2', weight: '100 900', style: 'normal'}
  ],
  variable: '--font-sans',
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

export const anekBangla = localFont({
  src: [
    {path: '../public/fonts/AnekBanglaVariable.woff2', weight: '100 800', style: 'normal'},
    {path: '../public/fonts/NotoSansBengaliVariable.woff2', weight: '100 900', style: 'normal'}
  ],
  variable: '--font-bengali',
  display: 'swap'
});

// Backwards compatibility aliases
export const inter = plusJakarta;
export const bengali = anekBangla;
