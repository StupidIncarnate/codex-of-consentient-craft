import { adapterAnalysisAnalyzeBrokerProxy } from '../../adapter-analysis/analyze/adapter-analysis-analyze-broker.proxy';

// Every step here reads only the sources it is handed and parses them for real through
// `#gateway/npm/typescript`, so there is nothing to mock beyond the analysis' own (empty) proxy.
export const adapterCensusBuildGatewayLayerBrokerProxy = (): Record<PropertyKey, never> => {
  adapterAnalysisAnalyzeBrokerProxy();
  return {};
};
