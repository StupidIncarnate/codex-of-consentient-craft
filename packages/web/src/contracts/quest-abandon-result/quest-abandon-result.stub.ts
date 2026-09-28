/**
 * PURPOSE: Builds a valid QuestAbandonResult for tests, defaulting to the success shape an abandon
 * broker returns after a 2xx response.
 *
 * USAGE:
 * QuestAbandonResultStub();
 * // Returns { abandoned: true }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questAbandonResultContract } from './quest-abandon-result-contract';
import type { QuestAbandonResult } from './quest-abandon-result-contract';

export const QuestAbandonResultStub = ({
  ...props
}: StubArgument<QuestAbandonResult> = {}): QuestAbandonResult =>
  questAbandonResultContract.parse({
    abandoned: true,
    ...props,
  });
