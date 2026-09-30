/**
 * PURPOSE: Builds a valid AdapterAnalysisAnalyzeScopeLayerResult for tests
 *
 * USAGE:
 * AdapterAnalysisAnalyzeScopeLayerResultStub();
 * // Returns a valid AdapterAnalysisAnalyzeScopeLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { adapterAnalysisAnalyzeScopeLayerResultContract } from './adapter-analysis-analyze-scope-layer-result-contract';
import type { AdapterAnalysisAnalyzeScopeLayerResult } from './adapter-analysis-analyze-scope-layer-result-contract';

export const AdapterAnalysisAnalyzeScopeLayerResultStub = ({
  ...props
}: StubArgument<AdapterAnalysisAnalyzeScopeLayerResult> = {}): AdapterAnalysisAnalyzeScopeLayerResult =>
  adapterAnalysisAnalyzeScopeLayerResultContract.parse({
    bindings: new Map(),
    declared: new Set(),
    ...props,
  });
