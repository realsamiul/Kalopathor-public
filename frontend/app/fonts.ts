import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    {path: '../public/fonts/Inter-Regular.woff2', weight: '400', style: 'normal'},
    {path: '../public/fonts/Inter-Bold.woff2', weight: '700', style: 'normal'}
  ],
  variable: '--font-inter',
  display: 'swap'
});

export const jetbrains = localFont({
  src: '../public/fonts/JetBrainsMono-Medium.ttf',
  variable: '--font-mono',
  display: 'swap'
});

export const bengali = localFont({
  src: '../public/fonts/NotoSansBengali-Regular.ttf',
  variable: '--font-bengali',
  display: 'swap'
});