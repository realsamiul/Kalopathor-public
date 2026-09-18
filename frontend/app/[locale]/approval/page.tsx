import {setRequestLocale} from 'next-intl/server';
import {useTranslations} from 'next-intl';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import {ArrowLeft, Bell, Clock, MapPin, Radio, Send, UserRound, X} from 'lucide-react';

export const dynamic = 'force-static';

interface AlertDraft {
  alert_id: string;
  severity: string;
  status: string;
  district: string;
  confidence_class: string;
  go_before: string;
  sender: string;
  area: string;
  audience: string;
  messages: {
    bn: {subject: string; body: string};
    en: {subject: string; body: string};
  };
}

export default function ApprovalPage({
  params,
  searchParams
}: {
  params: {locale: string};
  searchParams: {alert?: string};
}) {
  setRequestLocale(params.locale);
  const t = useTranslations();

  let alert: AlertDraft | null = null;
  try {
    const file = path.join(process.cwd(), 'public/data/feni_2024_replay.json');
    const replay = JSON.parse(fs.readFileSync(file, 'utf8'));
    alert = (replay.alert_draft as AlertDraft) ?? null;
  } catch {
    alert = null;
  }

  const match = searchParams.alert && alert && alert.alert_id === searchParams.alert;

  return (
    <main className="min-h-dvh w-full bg-ink-0 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href={`/${params.locale}/operations`}
          className="flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-3 transition-colors hover:text-mist-1"
        >
          <ArrowLeft size={12} aria-hidden />
          {t('approval.back')}
        </Link>

        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-ink-1 shadow-panel-lg">
          {/* severity band */}
          <div
            className="flex items-center justify-between gap-3 px-5 py-4"
            style={{
              background:
                'linear-gradient(90deg, rgba(244,63,94,.22), rgba(244,63,94,.05) 55%, transparent)'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-danger/50 bg-danger/15 text-danger">
                <Bell size={18} aria-hidden />
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist-3">
                  {t('approval.cap')}
                </div>
                <h1 className="mt-0.5 text-[17px] font-bold tracking-tight text-mist-1">
                  {t('approval.title')}
                </h1>
              </div>
            </div>
            {alert && (
              <span
                className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${
                  alert.severity === 'severe'
                    ? 'border-danger/60 bg-danger/15 text-danger'
                    : 'border-warn/60 bg-warn/15 text-est'
                }`}
              >
                {t('approval.severity')}: {alert.severity}
              </span>
            )}
          </div>

          {alert ? (
            <div className="flex flex-col gap-5 border-t border-line px-5 py-5">
              {/* meta grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Meta icon={Radio} label={t('approval.status')} value={alert.status} />
                <Meta icon={Clock} label={t('approval.goBefore')} value={alert.go_before} warn />
                <Meta icon={MapPin} label={t('approval.area')} value={alert.district} />
                <Meta icon={UserRound} label={t('approval.sender')} value={alert.sender} />
              </div>

              {match && (
                <div className="flex items-center gap-2 rounded-lg border border-accent2/40 bg-accent2/10 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                  <span className="font-mono text-[10.5px] text-accent2">
                    {alert.alert_id} — {t('approval.audience')}: {alert.audience}
                  </span>
                </div>
              )}

              {/* bilingual message */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <MessagePane label={t('approval.messageBn')} bn subject={alert.messages?.bn?.subject} body={alert.messages?.bn?.body} />
                <MessagePane label={t('approval.messageEn')} subject={alert.messages?.en?.subject} body={alert.messages?.en?.body} />
              </div>

              {/* actions */}
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-ink-2/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-[11.5px] leading-relaxed text-mist-3">{t('approval.offline')}</p>
                <div className="flex shrink-0 gap-2">
                  <button
                    disabled
                    aria-disabled
                    title={t('approval.offline')}
                    className="flex min-h-[44px] cursor-not-allowed items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[12.5px] font-semibold text-mist-3 opacity-60"
                  >
                    <X size={13} aria-hidden />
                    {t('approval.reject')}
                  </button>
                  <button
                    disabled
                    aria-disabled
                    title={t('approval.offline')}
                    className="flex min-h-[44px] cursor-not-allowed items-center gap-1.5 rounded-lg border border-accent2/50 bg-accent2/10 px-4 py-2 text-[12.5px] font-semibold text-accent2 opacity-60"
                  >
                    <Send size={13} aria-hidden />
                    {t('approval.approve')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-line px-5 py-10 text-center">
              <p className="text-[14px] font-semibold text-mist-1">{t('approval.emptyTitle')}</p>
              <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-mist-3">
                {t('approval.description')}
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-est">
          <span className="h-1.5 w-1.5 rounded-full bg-est" aria-hidden />
          {t('approval.readonly')}
        </p>
      </div>
    </main>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  warn
}: {
  icon: typeof Radio;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-2/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-3">
        <Icon size={11} aria-hidden />
        {label}
      </div>
      <div className={`mt-1 truncate text-[13px] font-semibold ${warn ? 'text-est' : 'text-mist-1'}`} title={value}>
        {value}
      </div>
    </div>
  );
}

function MessagePane({
  label,
  bn,
  subject,
  body
}: {
  label: string;
  bn?: boolean;
  subject?: string;
  body?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-2/40">
      <div className="border-b border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mist-3">
        {label}
      </div>
      <div className="px-3.5 py-3">
        {subject && (
          <p className={`text-[13px] font-semibold leading-snug text-mist-1 ${bn ? 'bn' : ''}`}>{subject}</p>
        )}
        {body && (
          <p className={`mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-mist-2 ${bn ? 'bn' : ''}`}>
            {body}
          </p>
        )}
      </div>
    </div>
  );
}
