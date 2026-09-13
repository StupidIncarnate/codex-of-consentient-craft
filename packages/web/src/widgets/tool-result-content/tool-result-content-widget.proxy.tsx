import { ToolResultPartLayerWidgetProxy } from './tool-result-part-layer-widget.proxy';

export const ToolResultContentWidgetProxy = (): Record<PropertyKey, never> => {
  ToolResultPartLayerWidgetProxy();

  return {} as Record<PropertyKey, never>;
};
