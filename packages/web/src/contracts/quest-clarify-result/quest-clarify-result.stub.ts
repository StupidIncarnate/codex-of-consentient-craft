/**
 * PURPOSE: Builds a valid QuestClarifyResult for tests.
 *
 * USAGE:
 * QuestClarifyResultStub();
 * // Returns { chatProcessId: 'clarify-proc-1' }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questClarifyResultContract } from './quest-clarify-result-contract';
import type { QuestClarifyResult } from './quest-clarify-result-contract';

export const QuestClarifyResultStub = ({
  ...props
}: StubArgument<QuestClarifyResult> = {}): QuestClarifyResult =>
  questClarifyResultContract.parse({
    chatProcessId: 'clarify-proc-1',
    ...props,
  });
