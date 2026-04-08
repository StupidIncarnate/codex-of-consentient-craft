import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { SubagentChainWidgetProxy } from '../subagent-chain/subagent-chain-widget.proxy';
import { ToolGroupWidgetProxy } from '../tool-group/tool-group-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';

export const ExecutionRowLayerWidgetProxy = (): Record<PropertyKey, never> => {
  ChatMessageWidgetProxy();
  ToolGroupWidgetProxy();
  SubagentChainWidgetProxy();
  StreamingBarLayerWidgetProxy();
  return {} as Record<PropertyKey, never>;
};
