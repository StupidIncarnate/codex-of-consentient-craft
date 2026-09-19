/**
 * PURPOSE: One transcript line's `timestamp`, as a FIXED offset from a FIXED base instant. Reach
 * for this over `new Date().toISOString()` anywhere inside a recipe: "a recipe never calls
 * `Date.now()`, `Math.random()` or `randomUUID()` for anything that reaches a screen"
 * (siegelense-recipes.md line 283), and a transcript's timestamps reach the screen directly — they
 * are what the replay broker sorts every line across three files by, so they also decide which
 * chain nests inside which.
 *
 * USAGE:
 * transcriptTimestampTransformer({ offsetSeconds: 3 });
 * // Returns '2026-01-01T00:00:03.000Z' as a branded ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { seedFixtureStatics } from '../../statics/seed-fixture/seed-fixture-statics';
import { transcriptTimeStatics } from '../../statics/transcript-time/transcript-time-statics';

export const transcriptTimestampTransformer = ({
  offsetSeconds,
}: {
  offsetSeconds: number;
}): ContentText => {
  const baseMs = Date.parse(seedFixtureStatics.session.baseTimestamp);
  return contentTextContract.parse(
    new Date(baseMs + offsetSeconds * transcriptTimeStatics.conversion.msPerSecond).toISOString(),
  );
};
