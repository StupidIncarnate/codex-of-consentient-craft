/**
 * PURPOSE: Builds a valid QuestRouteScopeResult for tests
 *
 * USAGE:
 * QuestRouteScopeResultStub();
 * // Returns a valid QuestRouteScopeResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questRouteScopeResultContract } from './quest-route-scope-result-contract';
import type { QuestRouteScopeResult } from './quest-route-scope-result-contract';

export const QuestRouteScopeResultStub = ({
  ...props
}: StubArgument<QuestRouteScopeResult> = {}): QuestRouteScopeResult =>
  questRouteScopeResultContract.parse({ routed: false, blocked: false, ...props });
