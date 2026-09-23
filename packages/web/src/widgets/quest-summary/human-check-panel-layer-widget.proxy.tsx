// PURPOSE: Proxy for HumanCheckPanelLayerWidget — composes the row layer's proxy (satisfying
// enforce-proxy-child-creation) and, separately, its OWN multi-row-safe selectors, since a test
// rendering several criteria needs to address one row by its description among siblings that all
// share the same HUMAN_CHECK_ROW testid.
// USAGE: Create in a test, use the row-scoped selectors to assert per-criterion state.

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';
import { HumanCheckRowLayerWidgetProxy } from './human-check-row-layer-widget.proxy';

export const HumanCheckPanelLayerWidgetProxy = (): ReturnType<
  typeof HumanCheckRowLayerWidgetProxy
> & {
  hasSection: () => boolean;
  rowCount: () => HTMLElement['childElementCount'];
  rowDescriptions: () => HTMLElement['textContent'][];
  hasReasonFieldFor: (params: { description: HTMLElement['textContent'] }) => boolean;
  verdictTextFor: (params: {
    description: HTMLElement['textContent'];
  }) => HTMLElement['textContent'];
  clickMetFor: (params: { description: HTMLElement['textContent'] }) => Promise<void>;
  clickNotMetFor: (params: { description: HTMLElement['textContent'] }) => Promise<void>;
  typeReasonFor: (params: {
    description: HTMLElement['textContent'];
    text: HTMLTextAreaElement['value'];
  }) => Promise<void>;
} => {
  // The panel renders one HumanCheckRowLayerWidget per criterion, so its proxy is composed here —
  // its own setup methods (setupRecorded, setupRefused, ...) are what this panel proxy re-exports,
  // since the panel itself never imports the broker its rows call.
  const row = HumanCheckRowLayerWidgetProxy();
  const user = userEvent.setup(userEventStatics.options);

  const rowFor = ({ description }: { description: HTMLElement['textContent'] }): HTMLElement => {
    const rows = screen.getAllByTestId('HUMAN_CHECK_ROW');
    const match = rows.find(
      (element) =>
        within(element).queryByTestId('HUMAN_CHECK_DESCRIPTION')?.textContent === description,
    );
    if (match === undefined) {
      throw new Error(`No HUMAN_CHECK_ROW found for description "${String(description)}"`);
    }
    return match;
  };

  const buttonFor = ({
    description,
    text,
  }: {
    description: HTMLElement['textContent'];
    text: HTMLElement['textContent'];
  }): HTMLElement => {
    const buttons = within(rowFor({ description })).getAllByTestId('PIXEL_BTN');
    const match = buttons.find((button) => button.textContent === text);
    if (match === undefined) {
      throw new Error(`No PIXEL_BTN labeled "${String(text)}" found for "${String(description)}"`);
    }
    return match;
  };

  return {
    ...row,
    hasSection: (): boolean => screen.queryByTestId('QUEST_SUMMARY_SECTION_HUMAN_CHECK') !== null,
    rowCount: (): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId('HUMAN_CHECK_ROW').length,
    rowDescriptions: (): HTMLElement['textContent'][] =>
      screen.queryAllByTestId('HUMAN_CHECK_DESCRIPTION').map((element) => element.textContent),
    hasReasonFieldFor: ({ description }: { description: HTMLElement['textContent'] }): boolean =>
      within(rowFor({ description })).queryByTestId('HUMAN_CHECK_REASON') !== null,
    verdictTextFor: ({
      description,
    }: {
      description: HTMLElement['textContent'];
    }): HTMLElement['textContent'] =>
      within(rowFor({ description })).queryByTestId('HUMAN_CHECK_VERDICT')?.textContent ?? null,
    clickMetFor: async ({
      description,
    }: {
      description: HTMLElement['textContent'];
    }): Promise<void> => {
      await user.click(buttonFor({ description, text: 'MET' }));
    },
    clickNotMetFor: async ({
      description,
    }: {
      description: HTMLElement['textContent'];
    }): Promise<void> => {
      await user.click(buttonFor({ description, text: 'NOT MET' }));
    },
    typeReasonFor: async ({
      description,
      text,
    }: {
      description: HTMLElement['textContent'];
      text: HTMLTextAreaElement['value'];
    }): Promise<void> => {
      await user.type(within(rowFor({ description })).getByTestId('HUMAN_CHECK_REASON'), text);
    },
  };
};
