/**
 * PURPOSE: One timer a suite armed and never cleared, carrying the stack that armed it. Reach for
 * this over ward's own `openHandleContract` when PRODUCING a finding: ward's mirrors what jest's
 * `--detectOpenHandles` serializes, and this is the shape a worker run can produce instead.
 *
 * USAGE:
 * openHandleFindingContract.parse({
 *   kind: 'setInterval',
 *   testPath: 'packages/a/src/x.test.ts',
 *   stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
 * });
 * // Returns a validated OpenHandleFinding
 */

import { z } from 'zod';
import { openHandleStatics } from '../../statics/open-handle/open-handle-statics';

export const openHandleFindingContract = z.object({
  kind: z.enum(openHandleStatics.timers.arm).brand<'OpenHandleKind'>(),
  testPath: z.string().min(1).brand<'OpenHandleTestPath'>(),
  stack: z.string().brand<'OpenHandleStack'>(),
});

export type OpenHandleFinding = z.infer<typeof openHandleFindingContract>;
