import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import Link from 'next/link';
import OperationsConsole from '@/app/components/OperationsConsole';

export default function OperationsPage({
  params
}: {
  params: {locale: string};
}) {
  setRequestLocale(params.locale);
  const t = useTranslations();

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          <span className="bn text-lg font-bold text-[#e5e7eb]">কালপাথর</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#9ca3af]">
            {t('ops.title')}
          </span>
        </div>
        <nav className="pointer-events-auto flex items-center gap-3">
          <Link
            href="/"
            className="rounded px-2 py-1 text-[12px] text-[#9ca3af] transition-colors hover:text-[#e5e7eb]"
          >
            {t('nav.story')}
          </Link>
          <span className="text-[12px] text-[#818cf8]">{t('nav.operations')}</span>
        </nav>
      </header>

      <OperationsConsole />

      <footer className="pointer-events-none absolute bottom-0 left-0 z-10 px-4 pb-3">
        <span className="font-mono text-[10px] text-[#9ca3af]/60">
          KALOPATHOR · OPERATIONS CONSOLE · {t('ops.utc')}
        </span>
      </footer>
    </main>
  );
}