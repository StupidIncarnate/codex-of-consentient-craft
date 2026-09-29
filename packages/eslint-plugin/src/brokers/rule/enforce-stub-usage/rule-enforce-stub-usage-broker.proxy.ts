// Proxy for simple rule - no mocking needed for AST validation
import { outsideTypeCastReportLayerBrokerProxy } from './outside-type-cast-report-layer-broker.proxy';

export const ruleEnforceStubUsageBrokerProxy = (): {
  layers: {
    outsideTypeCastReport: ReturnType<typeof outsideTypeCastReportLayerBrokerProxy>;
  };
} => ({
  layers: {
    outsideTypeCastReport: outsideTypeCastReportLayerBrokerProxy(),
  },
});
