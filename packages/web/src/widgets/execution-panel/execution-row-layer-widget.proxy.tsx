import { ChatEntryListWidgetProxy } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';

export const ExecutionRowLayerWidgetProxy = (): Record<PropertyKey, never> => {
  ChatEntryListWidgetProxy();
  StreamingBarLayerWidgetProxy();
  return {} as Record<PropertyKey, never>;
};
