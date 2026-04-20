import { screen } from '@testing-library/react';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ContextDividerWidgetProxy } from '../context-divider/context-divider-widget.proxy';
import { StreamingIndicatorWidgetProxy } from '../streaming-indicator/streaming-indicator-widget.proxy';
import { SubagentChainWidgetProxy } from '../subagent-chain/subagent-chain-widget.proxy';
import { ToolGroupWidgetProxy } from '../tool-group/tool-group-widget.proxy';

export const ChatEntryListWidgetProxy = (): {
  hasMessageCount: (params: { count: number }) => boolean;
  hasToolGroupCount: (params: { count: number }) => boolean;
  hasDividerCount: (params: { count: number }) => boolean;
  hasSubagentChainCount: (params: { count: number }) => boolean;
  isStreamingIndicatorVisible: () => boolean;
} => {
  ChatMessageWidgetProxy();
  ContextDividerWidgetProxy();
  StreamingIndicatorWidgetProxy();
  SubagentChainWidgetProxy();
  ToolGroupWidgetProxy();

  return {
    hasMessageCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
    hasToolGroupCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('TOOL_GROUP_HEADER').length === count,
    hasDividerCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CONTEXT_DIVIDER').length === count,
    hasSubagentChainCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('SUBAGENT_CHAIN_HEADER').length === count,
    isStreamingIndicatorVisible: (): boolean =>
      screen.queryByTestId('STREAMING_INDICATOR') !== null,
  };
};
