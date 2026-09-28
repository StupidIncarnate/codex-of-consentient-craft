/**
 * PURPOSE: Names one reason an adapter is more than a pass-through onto a gateway export, so a planner can sort the logic adapters by what they add.
 *
 * USAGE:
 * adapterLogicReasonContract.parse('try-catch');
 * // Returns: AdapterLogicReason
 */
import { z } from 'zod';

export const adapterLogicReasonContract = z.enum([
  'no-outside-call',
  'multiple-outside-calls',
  'no-gateway-export',
  'try-catch',
  'branching',
  'calls-adapter',
  'calls-repo-code',
  'calls-held-value',
  'method-on-held-value',
  'chained-call',
  'promise-construction',
]);

export type AdapterLogicReason = z.infer<typeof adapterLogicReasonContract>;
