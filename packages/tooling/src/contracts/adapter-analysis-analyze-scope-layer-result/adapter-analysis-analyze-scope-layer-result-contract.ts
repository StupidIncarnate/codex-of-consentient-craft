/**
 * PURPOSE: Defines the data `adapterAnalysisAnalyzeScopeLayerBroker` returns
 *
 * USAGE:
 * adapterAnalysisAnalyzeScopeLayerResultContract.parse(value);
 * // Returns validated AdapterAnalysisAnalyzeScopeLayerResult
 */
import { z } from '#gateway/npm/zod';
import { outsideCallContract } from '../outside-call/outside-call-contract';

export const adapterAnalysisAnalyzeScopeLayerResultContract = z
  .object({
    bindings: z.map(
      z.string().brand<'AdapterAnalysisAnalyzeScopeLayerResultBindingsKey'>(),
      outsideCallContract,
    ),
    declared: z.set(z.string().brand<'AdapterAnalysisAnalyzeScopeLayerResultDeclared'>()),
  })
  .brand<'AdapterAnalysisAnalyzeScopeLayerResult'>();

export type AdapterAnalysisAnalyzeScopeLayerResult = z.infer<
  typeof adapterAnalysisAnalyzeScopeLayerResultContract
>;
