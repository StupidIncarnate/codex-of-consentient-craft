import { NodeMeasureLayerWidgetProxy } from './node-measure-layer-widget.proxy';

export const ReactFlowWidgetProxy = (): Record<PropertyKey, never> => {
  // The canvas mounts the measure layer as a child. Constructing its proxy is what resets the
  // recording between tests; nothing here needs to configure it, so no methods are surfaced.
  NodeMeasureLayerWidgetProxy();
  return {};
};
