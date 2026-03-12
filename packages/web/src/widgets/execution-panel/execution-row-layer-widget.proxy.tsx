import { ExecutionMessageWidgetProxy } from '../execution-message/execution-message-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';

export const ExecutionRowLayerWidgetProxy = (): Record<PropertyKey, never> => {
  ExecutionMessageWidgetProxy();
  StreamingBarLayerWidgetProxy();
  return {} as Record<PropertyKey, never>;
};
