import {setRequestLocale} from 'next-intl/server';
import {useTranslations} from 'next-intl';
import Link from 'next/link';

export default function ApprovalStubPage({
  params,
  searchParams
}: {
  params: {locale: string};
  searchParams: {alert?: string};
}) {
  setRequestLocale(params.locale);
  const t = useTranslations();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0e17] px-6">
      <div className="w-full max-w-md rounded-lg border border-[#1f2937] bg-[#111827] p-6">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
          {t('approval.stub')}
        </span>
        <h1 className="mt-2 text-lg font-bold text-[#e5e7eb]">
          {t('approval.title')}
        </h1>
        <p className="mt-2 text-sm leading-snug text-[#9ca3af]">
          {t('approval.description')}
        </p>
        {searchParams.alert && (
          <p className="mt-3 rounded bg-[#0f172a] px-3 py-2 font-mono text-[11px] text-[#818cf8]">
            CAP · {searchParams.alert}
          </p>
        )}
        <Link
          href={`/${params.locale}/operations`}
          className="mt-5 inline-block rounded border border-[#818cf8]/60 px-4 py-2 text-[12px] text-[#818cf8] transition-colors hover:bg-[#818cf8]/10"
        >
          {t('nav.operations')} ←
        </Link>
      </div>
    </main>
  );
}