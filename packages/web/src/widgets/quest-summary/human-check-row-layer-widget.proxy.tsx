// PURPOSE: Proxy for HumanCheckRowLayerWidget — composes the broker proxy that backs the row's
// MET/NOT MET submit, plus UI-specific triggers and selectors scoped to the ONE row this widget's
// own test file ever renders.
// USAGE: Create in a test, use setup methods to configure the broker's HTTP response.

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { questHumanVerdictBrokerProxy } from '../../brokers/quest/human-verdict/quest-human-verdict-broker.proxy';
import { userEventStatics } from '../../statics/user-event/user-event-statics';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const HumanCheckRowLayerWidgetProxy = (): ReturnType<typeof questHumanVerdictBrokerProxy> & {
  descriptionText: () => HTMLElement['textContent'];
  evidenceText: () => HTMLElement['textContent'];
  hasReasonField: () => boolean;
  typeReason: (params: { text: HTMLTextAreaElement['value'] }) => Promise<void>;
  clickMet: () => Promise<void>;
  clickNotMet: () => Promise<void>;
  isMetDisabled: () => boolean;
  isNotMetDisabled: () => boolean;
  errorText: () => HTMLElement['textContent'];
  verdictText: () => HTMLElement['textContent'];
} => {
  const broker = questHumanVerdictBrokerProxy();
  // Every control this row renders is a PixelBtnWidget. Its proxy mocks nothing — the buttons run
  // real — so it is constructed for the child-proxy rule and never interacted with; this widget's
  // own `buttonByLabel` addresses the MET / NOT MET pair by their own testid, since two buttons
  // share the same PIXEL_BTN testid and PixelBtnWidgetProxy assumes exactly one on the page.
  PixelBtnWidgetProxy();
  const user = userEvent.setup(userEventStatics.options);

  const buttonByLabel = ({ text }: { text: HTMLElement['textContent'] }): HTMLElement => {
    const row = screen.getByTestId('HUMAN_CHECK_ROW');
    const buttons = within(row).getAllByTestId('PIXEL_BTN');
    const match = buttons.find((button) => button.textContent === text);
    if (match === undefined) {
      throw new Error(`No PIXEL_BTN labeled "${String(text)}" found in HUMAN_CHECK_ROW`);
    }
    return match;
  };

  return {
    ...broker,
    descriptionText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HUMAN_CHECK_DESCRIPTION')?.textContent ?? null,
    evidenceText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HUMAN_CHECK_EVIDENCE')?.textContent ?? null,
    hasReasonField: (): boolean => screen.queryByTestId('HUMAN_CHECK_REASON') !== null,
    typeReason: async ({ text }: { text: HTMLTextAreaElement['value'] }): Promise<void> => {
      await user.type(screen.getByTestId('HUMAN_CHECK_REASON'), text);
    },
    clickMet: async (): Promise<void> => {
      await user.click(buttonByLabel({ text: 'MET' }));
    },
    clickNotMet: async (): Promise<void> => {
      await user.click(buttonByLabel({ text: 'NOT MET' }));
    },
    isMetDisabled: (): boolean => buttonByLabel({ text: 'MET' }).hasAttribute('disabled'),
    isNotMetDisabled: (): boolean => buttonByLabel({ text: 'NOT MET' }).hasAttribute('disabled'),
    errorText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HUMAN_CHECK_ERROR')?.textContent ?? null,
    verdictText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HUMAN_CHECK_VERDICT')?.textContent ?? null,
  };
};
