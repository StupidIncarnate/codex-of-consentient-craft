import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ContextDividerWidgetProxy } from '../context-divider/context-divider-widget.proxy';
import { ShowEarlierToggleWidgetProxy } from '../show-earlier-toggle/show-earlier-toggle-widget.proxy';
import { StreamingIndicatorWidgetProxy } from '../streaming-indicator/streaming-indicator-widget.proxy';
import { SubagentChainWidgetProxy } from '../subagent-chain/subagent-chain-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';

export const ChatEntryListWidgetProxy = (): Record<PropertyKey, never> => {
  ChatMessageWidgetProxy();
  ContextDividerWidgetProxy();
  ShowEarlierToggleWidgetProxy();
  StreamingIndicatorWidgetProxy();
  SubagentChainWidgetProxy();
  ToolRowWidgetProxy();
  return {} as Record<PropertyKey, never>;
};
