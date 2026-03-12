import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';

export const ExecutionRowLayerWidgetProxy = (): Record<PropertyKey, never> => {
  ChatMessageWidgetProxy();
  StreamingBarLayerWidgetProxy();
  return {} as Record<PropertyKey, never>;
};
