import { screen } from '@testing-library/react';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ContextDividerWidgetProxy } from '../context-divider/context-divider-widget.proxy';
import { ShowEarlierToggleWidgetProxy } from '../show-earlier-toggle/show-earlier-toggle-widget.proxy';
import { StreamingIndicatorWidgetProxy } from '../streaming-indicator/streaming-indicator-widget.proxy';
import { SubagentChainWidgetProxy } from '../subagent-chain/subagent-chain-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';

export const ChatEntryListWidgetProxy = (): {
  hasSubagentChain: () => boolean;
  getDurationTexts: () => HTMLElement['textContent'][];
} => {
  ChatMessageWidgetProxy();
  ContextDividerWidgetProxy();
  ShowEarlierToggleWidgetProxy();
  StreamingIndicatorWidgetProxy();
  const subagentChainProxy = SubagentChainWidgetProxy();
  ToolRowWidgetProxy();

  return {
    hasSubagentChain: (): boolean => screen.queryByTestId('SUBAGENT_CHAIN') !== null,
    getDurationTexts: (): HTMLElement['textContent'][] => subagentChainProxy.getDurationTexts(),
  };
};
