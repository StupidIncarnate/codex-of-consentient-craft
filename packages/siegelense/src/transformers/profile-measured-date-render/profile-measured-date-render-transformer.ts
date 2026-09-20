/**
 * PURPOSE: Renders the epoch of a profile's most recent reading as the `YYYY-MM-DD` date
 * siegelense-tooling.md line 2521 prints (`measuredAt: '2026-09-14'`). Reach for this over
 * `elapsedRenderTransformer`: that one renders a DURATION as the largest whole unit ('14m'), while a
 * profile answers WHEN it was last measured, which is a calendar date and stays readable a week
 * later. UTC, never local: the value is compared against other machines' profiles and a local
 * rendering would make the same instant two different dates.
 *
 * USAGE:
 * profileMeasuredDateRenderTransformer({ measuredAtMs: 1757808000000 });
 * // Returns '2025-09-14' as branded ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';

export const profileMeasuredDateRenderTransformer = ({
  measuredAtMs,
}: {
  measuredAtMs: EpochMs;
}): ContentText => {
  const [datePart] = new Date(measuredAtMs).toISOString().split('T');

  return contentTextContract.parse(datePart);
};
