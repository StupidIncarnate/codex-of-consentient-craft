/**
 * PURPOSE: Builds a valid QuestMergeResult for tests, defaulting to `merging: true`.
 *
 * USAGE:
 * QuestMergeResultStub();
 * // Returns { merging: true }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questMergeResultContract } from './quest-merge-result-contract';
import type { QuestMergeResult } from './quest-merge-result-contract';

export const QuestMergeResultStub = ({
  ...props
}: StubArgument<QuestMergeResult> = {}): QuestMergeResult =>
  questMergeResultContract.parse({
    merging: true,
    ...props,
  });
