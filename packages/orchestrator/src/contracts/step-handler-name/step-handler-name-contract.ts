/**
 * PURPOSE: The closed set of handler names a deterministic step's `agentFlowStatics[...].handler`
 * may name. Unlike a step id (free-form — a `quest.json` holding a renamed or retired step must
 * still LOAD), a handler name names CODE: `stepHandlerRunBroker`'s dispatch table is checked
 * against this enum with `satisfies Record<StepHandlerName, StepHandler>`, so a fifth name with no
 * implementation behind it fails the BUILD rather than throwing on the one quest that reaches that
 * step.
 *
 * USAGE:
 * stepHandlerNameContract.parse('ward');
 * // Returns 'ward' as StepHandlerName
 */

import { z } from 'zod';

export const stepHandlerNameContract = z.enum(['ward', 'riftcarver', 'commit', 'cleanup']);

export type StepHandlerName = z.infer<typeof stepHandlerNameContract>;
