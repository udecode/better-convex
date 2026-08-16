import { Suspense } from 'react';
import {
  crpc,
  getQueryClient,
  HydrateClient,
  prefetch,
} from '@/lib/convex/rsc';

import { HttpDemo } from './http-demo';

export default async function HttpPage() {
  // Prefetch HTTP queries on server (Hono-style args)
  prefetch(crpc.http.health.queryOptions());

  await getQueryClient().prefetchQuery(
    crpc.http.todos.list.queryOptions({ searchParams: { limit: '10' } })
  );

  // HydrateClient must be *below* the prefetches: the layout-level boundary in
  // Providers dehydrates before this page body runs, so without this wrapper
  // neither prefetch reaches the RSC payload and the browser refetches both.
  return (
    <HydrateClient>
      <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-8" />}>
        <HttpDemo />
      </Suspense>
    </HydrateClient>
  );
}
