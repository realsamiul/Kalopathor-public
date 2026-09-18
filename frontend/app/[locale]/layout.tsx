import type {Metadata, Viewport} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {inter, jetbrains, bengali} from '../fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'কালপাথর · Kalopathor — Bangladesh Flood Intelligence',
  description:
    'Flood forecasting and satellite monitoring operations console for Bangladesh.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kalopathor'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: '#070b12',
  viewportFit: 'cover'
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const {locale} = params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${jetbrains.variable} ${bengali.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}