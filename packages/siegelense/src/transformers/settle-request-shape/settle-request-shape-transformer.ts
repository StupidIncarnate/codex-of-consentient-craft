/**
 * PURPOSE: Collapses one request's method and URL into the SHAPE key `settleWaitLayerAdapter`
 * counts repeats on, so a poller issuing `?since=1700` and then `?since=1750` reads as the same
 * request rather than as two new ones. Reach for this over comparing raw URLs: the cursor, the
 * cache-buster and the fragment are exactly the parts a poll varies every tick, and a detector
 * keyed on the raw URL classifies an endless poll as endless DISTINCT work and never discounts it.
 *
 * The origin and path are KEPT. Folding id-shaped path segments together as well would make
 * `/api/quests/a` and `/api/quests/b` one shape, and those are two different pieces of work a step
 * can legitimately be waiting on — the query string is the part a poll is guaranteed to vary.
 *
 * USAGE:
 * settleRequestShapeTransformer({ method: 'get', url: 'http://x/api/quests?since=1700#top' });
 * // Returns 'GET http://x/api/quests'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const settleRequestShapeTransformer = ({
  method,
  url,
}: {
  method: string;
  url: string;
}): ContentText =>
  contentTextContract.parse(
    `${method.toUpperCase()} ${(url.split('#')[0] ?? '').split('?')[0] ?? ''}`,
  );
