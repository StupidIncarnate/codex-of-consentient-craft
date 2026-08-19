import { screen } from '@testing-library/react';

export const HealthTableLayerWidgetProxy = (): {
  getRows: () => HTMLElement[];
  getValueText: (params: { valueTestId: string }) => HTMLElement['textContent'];
} => ({
  getRows: (): HTMLElement[] =>
    screen.queryAllByTestId((testId) => testId.startsWith('HEALTH_PAGE_ROW_')),
  getValueText: ({ valueTestId }: { valueTestId: string }): HTMLElement['textContent'] =>
    screen.queryByTestId(valueTestId)?.textContent ?? null,
});
