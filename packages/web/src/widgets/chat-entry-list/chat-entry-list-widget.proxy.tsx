import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ContextDividerWidgetProxy } from '../context-divider/context-divider-widget.proxy';
import { StreamingIndicatorWidgetProxy } from '../streaming-indicator/streaming-indicator-widget.proxy';
import { SubagentChainWidgetProxy } from '../subagent-chain/subagent-chain-widget.proxy';
import { ToolGroupWidgetProxy } from '../tool-group/tool-group-widget.proxy';

export const ChatEntryListWidgetProxy = (): Record<PropertyKey, never> => {
  ChatMessageWidgetProxy();
  ContextDividerWidgetProxy();
  StreamingIndicatorWidgetProxy();
  SubagentChainWidgetProxy();
  ToolGroupWidgetProxy();
  return {} as Record<PropertyKey, never>;
};
