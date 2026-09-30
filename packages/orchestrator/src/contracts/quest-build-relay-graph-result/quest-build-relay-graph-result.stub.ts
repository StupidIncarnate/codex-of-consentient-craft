/**
 * PURPOSE: Builds a valid QuestBuildRelayGraphResult for tests
 *
 * USAGE:
 * QuestBuildRelayGraphResultStub();
 * // Returns a valid QuestBuildRelayGraphResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questBuildRelayGraphResultContract } from './quest-build-relay-graph-result-contract';
import type { QuestBuildRelayGraphResult } from './quest-build-relay-graph-result-contract';

export const QuestBuildRelayGraphResultStub = ({
  ...props
}: StubArgument<QuestBuildRelayGraphResult> = {}): QuestBuildRelayGraphResult =>
  questBuildRelayGraphResultContract.parse({ operations: [], workItems: [], ...props });
