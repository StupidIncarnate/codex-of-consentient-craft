import { nodeMeasureLayerAdapterProxy } from './node-measure-layer-adapter.proxy';

export const xyflowReactFlowAdapterProxy = (): Record<PropertyKey, never> => {
  // The canvas mounts the measure layer as a child. Constructing its proxy is what resets the
  // recording between tests; nothing here needs to configure it, so no methods are surfaced.
  nodeMeasureLayerAdapterProxy();
  return {};
};
