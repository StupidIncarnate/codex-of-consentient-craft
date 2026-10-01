import { fireEvent, screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import type { AskUserQuestionOption } from '@dungeonmaster/shared/contracts';
import type { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { userEventStatics } from '../../statics/user-event/user-event-statics';
import { ChatComposerWidgetProxy } from '../chat-composer/chat-composer-widget.proxy';
import { ClarifyOptionLayerWidgetProxy } from './clarify-option-layer-widget.proxy';

const THUMBNAIL_SELECTOR = `img[${chatComposerStatics.thumbnail.attributeName}]`;

export const QuestClarifyPanelWidgetProxy = (): {
  clickOption: (params: { label: AskUserQuestionOption['label'] }) => Promise<void>;
  typeInComposer: (params: { text: string }) => void;
  pressEnterInComposer: () => void;
  clickComposerSend: () => void;
  pasteImageInComposer: (params: {
    mediaType: DataTransferItem['type'];
    bytes: Uint8Array;
    attachment: ReturnType<typeof ComposerAttachmentStub>;
  }) => void;
  getComposerText: () => NonNullable<Node['textContent']>;
  hasComposerThumbnail: () => boolean;
  getQuestionText: () => HTMLElement['textContent'];
  getCounter: () => HTMLElement['textContent'];
  getOptionLabels: () => HTMLElement['textContent'][];
  getCheckboxCount: () => number;
  getOptionCount: () => number;
  getCheckedLabels: () => HTMLElement['textContent'][];
} => {
  ClarifyOptionLayerWidgetProxy();
  // Its typing helpers target CHAT_INPUT, so the clarify mount's own test ids are driven below;
  // only its paste staging is reused.
  const composerProxy = ChatComposerWidgetProxy();

  return {
    clickOption: async ({ label }: { label: AskUserQuestionOption['label'] }): Promise<void> => {
      const options = screen.getAllByTestId('CLARIFY_OPTION');
      const target = options.find((el) => el.textContent?.includes(label));
      if (target) {
        await userEvent.click(target, userEventStatics.options);
      }
    },
    typeInComposer: ({ text }: { text: string }): void => {
      const editor = screen.getByTestId('CLARIFY_COMPOSER');
      editor.textContent = text;
      fireEvent.input(editor);
    },
    pressEnterInComposer: (): void => {
      fireEvent.keyDown(screen.getByTestId('CLARIFY_COMPOSER'), { key: 'Enter', shiftKey: false });
    },
    clickComposerSend: (): void => {
      fireEvent.click(screen.getByTestId('CLARIFY_SEND_BUTTON'));
    },
    pasteImageInComposer: ({
      mediaType,
      bytes,
      attachment,
    }: {
      mediaType: DataTransferItem['type'];
      bytes: Uint8Array;
      attachment: ReturnType<typeof ComposerAttachmentStub>;
    }): void => {
      // The composer proxy's paste helper finds its editor by CHAT_INPUT. The id is swapped for the
      // synchronous paste dispatch only; the async decode that follows never queries by id.
      const editor = screen.getByTestId('CLARIFY_COMPOSER');
      editor.setAttribute('data-testid', 'CHAT_INPUT');
      composerProxy.pasteImage({ mediaType, bytes, attachment });
      editor.setAttribute('data-testid', 'CLARIFY_COMPOSER');
    },
    getComposerText: (): NonNullable<Node['textContent']> =>
      screen.getByTestId('CLARIFY_COMPOSER').textContent ?? '',
    hasComposerThumbnail: (): boolean =>
      screen.getByTestId('CLARIFY_COMPOSER').querySelector(THUMBNAIL_SELECTOR) !== null,
    getQuestionText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('CLARIFY_QUESTION_TEXT');
      return element?.textContent ?? null;
    },
    getCounter: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('CLARIFY_COUNTER');
      return element?.textContent ?? null;
    },
    getOptionLabels: (): HTMLElement['textContent'][] => {
      const options = screen.queryAllByTestId('CLARIFY_OPTION');
      return options.map((el) => el.textContent);
    },
    getCheckboxCount: (): number => screen.queryAllByTestId('CLARIFY_OPTION_CHECKBOX').length,
    getOptionCount: (): number => screen.queryAllByTestId('CLARIFY_OPTION').length,
    // The checkbox is a span, so a card's first <p> is its label Text, not its description.
    getCheckedLabels: (): HTMLElement['textContent'][] =>
      screen
        .queryAllByTestId('CLARIFY_OPTION')
        .filter(
          (card) =>
            card
              .querySelector('[data-testid="CLARIFY_OPTION_CHECKBOX"]')
              ?.getAttribute('aria-checked') === 'true',
        )
        .map((card) => card.querySelector('p')?.textContent ?? null),
  };
};
