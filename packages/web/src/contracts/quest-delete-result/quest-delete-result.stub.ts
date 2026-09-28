/**
 * PURPOSE: Builds a valid QuestDeleteResult for tests, defaulting to the success shape a delete
 * broker returns after a 2xx response.
 *
 * USAGE:
 * QuestDeleteResultStub();
 * // Returns { deleted: true }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questDeleteResultContract } from './quest-delete-result-contract';
import type { QuestDeleteResult } from './quest-delete-result-contract';

export const QuestDeleteResultStub = ({
  ...props
}: StubArgument<QuestDeleteResult> = {}): QuestDeleteResult =>
  questDeleteResultContract.parse({
    deleted: true,
    ...props,
  });
