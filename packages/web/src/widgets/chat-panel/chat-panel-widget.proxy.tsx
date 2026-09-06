import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AutoScrollContainerWidgetProxy } from '../auto-scroll-container/auto-scroll-container-widget.proxy';
import { ChatEntryListWidgetProxy } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { ChatInputWidgetProxy } from '../chat-input/chat-input-widget.proxy';
import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';

const SHIFT_ON_TOKEN = '{shift>}';
const SHIFT_OFF_TOKEN = '{/shift}';
const ENTER_TOKEN = '{enter}';
const TYPE_MESSAGE_TOKENS = [SHIFT_ON_TOKEN, SHIFT_OFF_TOKEN, ENTER_TOKEN] as const;

type TypeMessageToken = typeof SHIFT_ON_TOKEN | typeof SHIFT_OFF_TOKEN | typeof ENTER_TOKEN;

// Finds whichever of the three macro tokens occurs FIRST in `text` (no regex — widgets/ may not
// contain regex literals), recursing rather than looping so no mutable index has to be threaded
// through the scan by hand.
const findEarliestToken = ({
  text,
}: {
  text: string;
}): { index: ReturnType<typeof String.prototype.indexOf>; token: TypeMessageToken } | undefined => {
  const candidates = TYPE_MESSAGE_TOKENS.map((token) => ({
    token,
    index: text.indexOf(token),
  })).filter((candidate) => candidate.index !== -1);

  return candidates.length === 0
    ? undefined
    : candidates.reduce((earliest, candidate) =>
        candidate.index < earliest.index ? candidate : earliest,
      );
};

// Splits a userEvent-style macro string ('line one{shift>}{enter}{/shift}line two') into an
// ordered list of plain-text runs and control tokens, without a regex (banned in widgets/) and
// without a mutable cursor (recursion carries the remaining slice instead).
const tokenizeTypeMessage = ({
  text,
}: {
  text: string;
}): ReturnType<typeof String.prototype.split> => {
  const earliest = findEarliestToken({ text });

  if (earliest === undefined) {
    return text.length === 0 ? [] : [text];
  }

  const before = text.slice(0, earliest.index);
  const rest = tokenizeTypeMessage({ text: text.slice(earliest.index + earliest.token.length) });

  return before.length === 0 ? [earliest.token, ...rest] : [before, earliest.token, ...rest];
};

export const ChatPanelWidgetProxy = (): {
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
  clickStop: () => Promise<void>;
  isInputEmpty: () => boolean;
  isStreamingVisible: () => boolean;
  isStopButtonVisible: () => boolean;
  isSendButtonVisible: () => boolean;
  hasMessageCount: (params: { count: number }) => boolean;
  hasToolRowCount: (params: { count: number }) => boolean;
  hasDividerCount: (params: { count: number }) => boolean;
  hasSubagentChainCount: (params: { count: number }) => boolean;
} => {
  AutoScrollContainerWidgetProxy();
  const inputProxy = ChatInputWidgetProxy();
  inputProxy.clearStorage();
  ChatEntryListWidgetProxy();
  PixelSpriteWidgetProxy();

  return {
    // CHAT_INPUT is a contenteditable div, not a form element — userEvent.type's plain-character
    // path targets form controls, so text is inserted the same way a real paste is: through
    // ChatInputWidgetProxy's pasteText() + fireEvent.paste(). The userEvent-style `{enter}` /
    // `{shift>}...{/shift}` macro tokens the existing callers already pass are tokenized above and
    // replayed as real keydown events, so callers did not have to change.
    typeMessage: async ({ text }: { text: string }): Promise<void> => {
      const editor = screen.getByTestId('CHAT_INPUT');

      tokenizeTypeMessage({ text }).reduce((shiftHeld, token) => {
        if (token === SHIFT_ON_TOKEN) return true;
        if (token === SHIFT_OFF_TOKEN) return false;
        if (token === ENTER_TOKEN) {
          fireEvent.keyDown(editor, { key: 'Enter', shiftKey: shiftHeld });
          return shiftHeld;
        }
        fireEvent.paste(editor, { clipboardData: inputProxy.pasteText({ text: token }) });
        return shiftHeld;
      }, false);

      return Promise.resolve();
    },
    clickSend: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SEND_BUTTON'));
    },
    clickStop: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('STOP_BUTTON'));
    },
    isInputEmpty: (): boolean => (screen.getByTestId('CHAT_INPUT').textContent ?? '').length === 0,
    isStreamingVisible: (): boolean => screen.queryByTestId('STREAMING_INDICATOR') !== null,
    isStopButtonVisible: (): boolean => screen.queryByTestId('STOP_BUTTON') !== null,
    isSendButtonVisible: (): boolean => screen.queryByTestId('SEND_BUTTON') !== null,
    hasMessageCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
    hasToolRowCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('TOOL_ROW').length === count,
    hasDividerCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CONTEXT_DIVIDER').length === count,
    hasSubagentChainCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('SUBAGENT_CHAIN_HEADER').length === count,
  };
};
