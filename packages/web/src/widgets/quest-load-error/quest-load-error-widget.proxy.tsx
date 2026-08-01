import { screen } from '@testing-library/react';

export const QuestLoadErrorWidgetProxy = (): {
  hasError: () => boolean;
  getFileText: () => HTMLElement['textContent'];
  getReasonText: () => HTMLElement['textContent'];
  getReasonOverflowWrap: () => HTMLElement['style']['overflowWrap'];
} => ({
  hasError: (): boolean => screen.queryByTestId('QUEST_LOAD_ERROR') !== null,
  getFileText: (): HTMLElement['textContent'] =>
    screen.queryByTestId('QUEST_LOAD_ERROR_FILE')?.textContent ?? null,
  getReasonText: (): HTMLElement['textContent'] =>
    screen.queryByTestId('QUEST_LOAD_ERROR_REASON')?.textContent ?? null,
  // A parse reason is one long unbroken path plus a dotted field path, so it needs a break
  // opportunity or it paints past the panel it sits in.
  getReasonOverflowWrap: (): HTMLElement['style']['overflowWrap'] =>
    screen.getByTestId('QUEST_LOAD_ERROR_REASON').style.overflowWrap,
});
