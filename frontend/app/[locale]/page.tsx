import {setRequestLocale} from 'next-intl/server';
import StoryContent from '@/app/components/StoryContent';

export default function StoryPage({params}: {params: {locale: string}}) {
  setRequestLocale(params.locale);
  return <StoryContent />;
}