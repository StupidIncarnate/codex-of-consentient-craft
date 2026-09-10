import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useDisclosureAnchorBindingProxy } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding.proxy';
import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ShowEarlierToggleWidgetProxy } from '../show-earlier-toggle/show-earlier-toggle-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';

export const SubagentChainWidgetProxy = (): {
  clickHeader: () => Promise<void>;
  clickHeaderAt: (params: { index: number }) => Promise<void>;
  clickShowEarlier: () => Promise<void>;
  isHeaderVisible: () => boolean;
  isBadgeVisible: () => boolean;
  hasShowEarlierToggle: () => boolean;
  hasInnerGroupCount: (params: { count: number }) => boolean;
  setupAutoScrollReleased: () => void;
  isAutoScrollHeld: () => boolean;
  getDurationTexts: () => HTMLElement['textContent'][];
  getHeaderChildTexts: () => Element['textContent'][];
  getHeaderChildTestIds: () => ReturnType<Element['getAttribute']>[];
  allDurationsSitInAHeader: () => boolean;
  getDurationStyle: () => {
    fontFamily: CSSStyleDeclaration['fontFamily'];
    fontSize: CSSStyleDeclaration['fontSize'];
    color: CSSStyleDeclaration['color'];
  };
} => {
  const anchorProxy = useDisclosureAnchorBindingProxy();
  ChatMessageWidgetProxy();
  ShowEarlierToggleWidgetProxy();
  ToolRowWidgetProxy();

  return {
    setupAutoScrollReleased: (): void => {
      anchorProxy.setupReleased();
    },
    isAutoScrollHeld: (): boolean => anchorProxy.isHeld(),
    clickHeader: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_HEADER'));
    },
    clickHeaderAt: async ({ index }: { index: number }): Promise<void> => {
      const headers = screen.getAllByTestId('SUBAGENT_CHAIN_HEADER');
      const header = headers[index];
      if (header === undefined)
        throw new Error(`No SUBAGENT_CHAIN_HEADER at index ${String(index)}`);
      await userEvent.click(header);
    },
    clickShowEarlier: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE'));
    },
    isHeaderVisible: (): boolean => screen.queryByTestId('SUBAGENT_CHAIN_HEADER') !== null,
    isBadgeVisible: (): boolean =>
      screen.getByTestId('SUBAGENT_CHAIN_HEADER').textContent?.includes('SUB-AGENT') ?? false,
    hasShowEarlierToggle: (): boolean =>
      screen.queryByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE') !== null,
    hasInnerGroupCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
    getDurationTexts: (): HTMLElement['textContent'][] =>
      screen.queryAllByTestId('subagent-chain-duration').map((el) => el.textContent),
    getHeaderChildTexts: (): Element['textContent'][] => {
      const [header] = screen.getAllByTestId('SUBAGENT_CHAIN_HEADER');
      if (header === undefined) throw new Error('No SUBAGENT_CHAIN_HEADER found');
      return Array.from(header.children).map((child) => child.textContent);
    },
    getHeaderChildTestIds: (): ReturnType<Element['getAttribute']>[] => {
      const [header] = screen.getAllByTestId('SUBAGENT_CHAIN_HEADER');
      if (header === undefined) throw new Error('No SUBAGENT_CHAIN_HEADER found');
      return Array.from(header.children).map((child) => child.getAttribute('data-testid'));
    },
    allDurationsSitInAHeader: (): boolean =>
      screen
        .queryAllByTestId('subagent-chain-duration')
        .every((el) => el.closest('[data-testid="SUBAGENT_CHAIN_HEADER"]') !== null),
    getDurationStyle: (): {
      fontFamily: CSSStyleDeclaration['fontFamily'];
      fontSize: CSSStyleDeclaration['fontSize'];
      color: CSSStyleDeclaration['color'];
    } => {
      const [element] = screen.getAllByTestId('subagent-chain-duration');
      if (element === undefined) throw new Error('No subagent-chain-duration element found');
      return {
        fontFamily: element.style.fontFamily,
        fontSize: element.style.fontSize,
        color: element.style.color,
      };
    },
  };
};
