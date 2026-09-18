'use client';

import {useTranslations} from 'next-intl';
import {AlertTriangle, RefreshCw} from 'lucide-react';

export default function Error({
  error,
  reset
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-0 px-6 text-center">
      <AlertTriangle size={32} className="text-danger" />
      <h2 className="text-lg font-bold text-mist-1">{t('common.error')}</h2>
      <p className="max-w-sm text-[13px] text-mist-3">
        {error.message || 'Something went wrong.'}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-[13px] text-mist-2 transition-colors hover:border-line-strong hover:text-mist-1"
      >
        <RefreshCw size={14} />
        {t('common.retry')}
      </button>
    </div>
  );
}
