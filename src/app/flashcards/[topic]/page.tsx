import { topics } from '@/lib/data';
import FlashcardClient from '@/components/FlashcardClient';

// Required for `output: 'export'` — enumerate every dynamic route to pre-render.
export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export const dynamicParams = false;

export default function FlashcardsPage({ params }: { params: { topic: string } }) {
  return <FlashcardClient topicId={params.topic} />;
}
