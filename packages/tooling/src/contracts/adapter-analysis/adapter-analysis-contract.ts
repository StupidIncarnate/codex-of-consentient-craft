/**
 * PURPOSE: What one adapter file does, read off its parse: every call into something the repo
 * does not own, and every reason it is more than a single forwarded call. The classification
 * that turns this into `pass-through` or `logic` also needs the gateway index, so it is a later
 * step.
 *
 * USAGE:
 * adapterAnalysisContract.parse({ outsideCalls: [], reasons: ['no-outside-call'] });
 * // Returns: AdapterAnalysis
 */
import { z } from 'zod';
import { outsideCallContract } from '../outside-call/outside-call-contract';
import { adapterLogicReasonContract } from '../adapter-logic-reason/adapter-logic-reason-contract';

export const adapterAnalysisContract = z.object({
  outsideCalls: z.array(outsideCallContract),
  reasons: z.array(adapterLogicReasonContract),
});

export type AdapterAnalysis = z.infer<typeof adapterAnalysisContract>;
