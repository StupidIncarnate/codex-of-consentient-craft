/**
 * PURPOSE: Builds a valid QuestPauseResult for tests, defaulting to `paused: true`.
 *
 * USAGE:
 * QuestPauseResultStub();
 * // Returns { paused: true }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questPauseResultContract } from './quest-pause-result-contract';
import type { QuestPauseResult } from './quest-pause-result-contract';

export const QuestPauseResultStub = ({
  ...props
}: StubArgument<QuestPauseResult> = {}): QuestPauseResult =>
  questPauseResultContract.parse({
    paused: true,
    ...props,
  });
