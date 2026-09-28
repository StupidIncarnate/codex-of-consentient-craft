/**
 * PURPOSE: Decides whether an adapter is a pass-through or holds logic. Pass-through means exactly
 * one outside call, none of the structural reasons the analysis found, and at least one gateway
 * export that already does the job. Anything else is `logic`, and the reasons say which part of
 * the definition it missed, so a planner can sort the logic adapters by what they add.
 *
 * USAGE:
 * adapterShapeClassifyTransformer({ analysis, gateway });
 * // Returns { shape: 'pass-through', reasons: [] } for one forwarded call with a gateway match
 */
import { adapterLogicReasonContract } from '../../contracts/adapter-logic-reason/adapter-logic-reason-contract';
import type { AdapterAnalysis } from '../../contracts/adapter-analysis/adapter-analysis-contract';
import type { AdapterRecord } from '../../contracts/adapter-record/adapter-record-contract';
import type { GatewayExport } from '../../contracts/gateway-export/gateway-export-contract';

export const adapterShapeClassifyTransformer = ({
  analysis,
  gateway,
}: {
  analysis: AdapterAnalysis;
  gateway: readonly GatewayExport[];
}): Pick<AdapterRecord, 'reasons' | 'shape'> => {
  const counted = [
    ...(analysis.outsideCalls.length === 0 ? ['no-outside-call'] : []),
    ...(analysis.outsideCalls.length > 1 ? ['multiple-outside-calls'] : []),
    ...(analysis.outsideCalls.length > 0 && gateway.length === 0 ? ['no-gateway-export'] : []),
  ].map((reason) => adapterLogicReasonContract.parse(reason));
  const reasons = [...new Set([...counted, ...analysis.reasons])];

  return { shape: reasons.length === 0 ? 'pass-through' : 'logic', reasons };
};
