import { screen } from '#gateway/npm/testing-library__react';

export const QuestLoadErrorWidgetProxy = (): {
  hasError: () => boolean;
  getFileText: () => Node['textContent'];
  getReasonText: () => Node['textContent'];
  getReasonOverflowWrap: () => HTMLElement['style']['overflowWrap'];
} => ({
  hasError: (): boolean => screen.queryByTestId('QUEST_LOAD_ERROR') !== null,
  getFileText: (): Node['textContent'] =>
    screen.queryByTestId('QUEST_LOAD_ERROR_FILE')?.textContent ?? null,
  getReasonText: (): Node['textContent'] =>
    screen.queryByTestId('QUEST_LOAD_ERROR_REASON')?.textContent ?? null,
  // A parse reason is one long unbroken path plus a dotted field path, so it needs a break
  // opportunity or it paints past the panel it sits in.
  getReasonOverflowWrap: (): HTMLElement['style']['overflowWrap'] =>
    screen.getByTestId('QUEST_LOAD_ERROR_REASON').style.overflowWrap,
});
