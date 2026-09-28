/**
 * PURPOSE: Builds a valid QuestFollowupStopResult for tests, defaulting to `stopped: true`.
 *
 * USAGE:
 * QuestFollowupStopResultStub();
 * // Returns { stopped: true }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questFollowupStopResultContract } from './quest-followup-stop-result-contract';
import type { QuestFollowupStopResult } from './quest-followup-stop-result-contract';

export const QuestFollowupStopResultStub = ({
  ...props
}: StubArgument<QuestFollowupStopResult> = {}): QuestFollowupStopResult =>
  questFollowupStopResultContract.parse({
    stopped: true,
    ...props,
  });
