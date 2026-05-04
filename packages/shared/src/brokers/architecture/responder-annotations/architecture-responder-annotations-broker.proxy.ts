import { httpEdgesToAnnotationsLayerBrokerProxy } from './http-edges-to-annotations-layer-broker.proxy';
import { mcpToolsToAnnotationsLayerBrokerProxy } from './mcp-tools-to-annotations-layer-broker.proxy';
import { hookBinsToAnnotationsLayerBrokerProxy } from './hook-bins-to-annotations-layer-broker.proxy';
import { cliBinToAnnotationsLayerBrokerProxy } from './cli-bin-to-annotations-layer-broker.proxy';

export const architectureResponderAnnotationsBrokerProxy = (): Record<PropertyKey, never> => {
  httpEdgesToAnnotationsLayerBrokerProxy();
  mcpToolsToAnnotationsLayerBrokerProxy();
  hookBinsToAnnotationsLayerBrokerProxy();
  cliBinToAnnotationsLayerBrokerProxy();
  return {};
};
