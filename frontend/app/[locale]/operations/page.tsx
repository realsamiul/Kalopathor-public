import {setRequestLocale} from 'next-intl/server';
import OperationsConsole from '@/app/components/OperationsConsole';

export default function OperationsPage({
  params
}: {
  params: {locale: string};
}) {
  setRequestLocale(params.locale);
  return (
    <main className="h-dvh w-full overflow-hidden bg-ink-0">
      <OperationsConsole />
    </main>
  );
}
