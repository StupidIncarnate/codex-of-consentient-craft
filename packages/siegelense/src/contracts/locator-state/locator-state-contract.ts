/**
 * PURPOSE: The four states Playwright's locator API waits for — `visible`, `hidden`, `attached`,
 * `detached` — carried by a `waitFor` step's `state` field. Reach for this over RunStatus or
 * StepExpectation: both of those describe an OUTCOME after a step or a run finished, while a
 * LocatorState is the CONDITION a step is waiting to observe on the page, checked while the step is
 * still in flight.
 *
 * USAGE:
 * locatorStateContract.parse('visible');
 * // Returns a branded LocatorState
 */

import { z } from 'zod';

export const locatorStateContract = z
  .enum(['visible', 'hidden', 'attached', 'detached'])
  .brand<'LocatorState'>();

export type LocatorState = z.infer<typeof locatorStateContract>;
