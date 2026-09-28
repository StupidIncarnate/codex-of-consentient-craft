import { adapterAnalysisAnalyzeCallsLayerBrokerProxy } from './adapter-analysis-analyze-calls-layer-broker.proxy';
import { adapterAnalysisAnalyzeScopeLayerBrokerProxy } from './adapter-analysis-analyze-scope-layer-broker.proxy';
import { adapterAnalysisAnalyzeStructureLayerBrokerProxy } from './adapter-analysis-analyze-structure-layer-broker.proxy';

// `#gateway/npm/typescript` is a pure pass-through with no proxy of its own, so the parse runs for
// real in this broker's own test; only the layers' (empty) proxies are composed.
export const adapterAnalysisAnalyzeBrokerProxy = (): Record<PropertyKey, never> => {
  adapterAnalysisAnalyzeCallsLayerBrokerProxy();
  adapterAnalysisAnalyzeScopeLayerBrokerProxy();
  adapterAnalysisAnalyzeStructureLayerBrokerProxy();
  return {};
};
