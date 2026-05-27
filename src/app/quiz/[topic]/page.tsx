import { topics } from '@/lib/data';
import QuizClient from '@/components/QuizClient';

// Required for `output: 'export'` — enumerate every dynamic route to pre-render.
export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export const dynamicParams = false;

export default function QuizPage({ params }: { params: { topic: string } }) {
  return <QuizClient topicId={params.topic} />;
}
