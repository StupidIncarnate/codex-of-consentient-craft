/**
 * PURPOSE: Starting point for this package's in-memory state — replace with real storage as the
 * package grows.
 *
 * USAGE:
 * siegelenseState.set({ key: pathSegmentContract.parse('a'), value: contentTextContract.parse('b') });
 * siegelenseState.get({ key: pathSegmentContract.parse('a') });
 */

import type { PathSegment, ContentText } from '@dungeonmaster/shared/contracts';

const SIEGELENSE_STORE = new Map<PathSegment, ContentText>();

export const siegelenseState = {
  set: ({ key, value }: { key: PathSegment; value: ContentText }): void => {
    SIEGELENSE_STORE.set(key, value);
  },
  get: ({ key }: { key: PathSegment }): ContentText | undefined => SIEGELENSE_STORE.get(key),
  clear: (): void => {
    SIEGELENSE_STORE.clear();
  },
};
