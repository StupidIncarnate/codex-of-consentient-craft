import { screen } from '@testing-library/react';

export const HealthPageWidgetProxy = (): {
  hasHealthPage: () => boolean;
  getTitleText: () => HTMLElement['textContent'];
} => ({
  hasHealthPage: (): boolean => screen.queryByTestId('HEALTH_PAGE') !== null,
  getTitleText: (): HTMLElement['textContent'] =>
    screen.queryByTestId('HEALTH_PAGE_TITLE')?.textContent ?? null,
});
