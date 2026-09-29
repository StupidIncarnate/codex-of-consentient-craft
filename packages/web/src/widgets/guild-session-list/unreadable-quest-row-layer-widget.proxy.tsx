import { screen } from '#gateway/npm/testing-library__react';

export const UnreadableQuestRowLayerWidgetProxy = (): {
  getRowText: () => HTMLElement['textContent'];
} => ({
  getRowText: (): HTMLElement['textContent'] => {
    const element = screen.queryByTestId('UNREADABLE_QUEST_ROW');
    return element?.textContent ?? null;
  },
});
