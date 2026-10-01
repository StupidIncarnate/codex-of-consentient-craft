import { notifications } from '#gateway/npm/mantine__notifications';
import { Blob } from '#gateway/browser/Blob';
import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';
import { File } from '#gateway/browser/File';
import { fireEvent, screen } from '#gateway/npm/testing-library__react';

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { composerDeleteThumbnailBrokerProxy } from '../../brokers/composer/delete-thumbnail/composer-delete-thumbnail-broker.proxy';
import { composerInsertImageBrokerProxy } from '../../brokers/composer/insert-image/composer-insert-image-broker.proxy';
import { composerInsertTextBrokerProxy } from '../../brokers/composer/insert-text/composer-insert-text-broker.proxy';
import { composerWriteBrokerProxy } from '../../brokers/composer/write/composer-write-broker.proxy';
import { fileReadDataUrlBrokerProxy } from '../../brokers/file/read-data-url/file-read-data-url-broker.proxy';
import { pastedImageAttachBrokerProxy } from '../../brokers/pasted-image/attach/pasted-image-attach-broker.proxy';
import type { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { ImageOverlayWidgetProxy } from '../image-overlay/image-overlay-widget.proxy';

const THUMBNAIL_SELECTOR = `img[${chatComposerStatics.thumbnail.attributeName}]`;

// Derived from mintsIds' own parameter type, so this stays in sync with its template literal shape.
type MintIdsParams = Parameters<ReturnType<typeof pastedImageAttachBrokerProxy>['mintsIds']>[0];

export const ChatComposerWidgetProxy = (): {
  typeText: (params: { text: string }) => void;
  pressEnter: () => void;
  pressShiftEnter: () => void;
  clickSend: () => void;
  pasteImage: (params: {
    mediaType: DataTransferItem['type'];
    bytes: Uint8Array;
    attachment: ReturnType<typeof ComposerAttachmentStub>;
  }) => void;
  getText: () => NonNullable<Node['textContent']>;
  hasThumbnail: () => boolean;
  isEditorEditable: () => boolean;
  getShownToast: () => unknown;
} => {
  // The DOM composer brokers and fileReadDataUrlBroker are pure — no I/O to mock — so their
  // proxies are instantiated for enforce-proxy-child-creation and never touched again.
  composerWriteBrokerProxy();
  composerInsertTextBrokerProxy();
  composerInsertImageBrokerProxy();
  composerDeleteThumbnailBrokerProxy();
  fileReadDataUrlBrokerProxy();
  ImageOverlayWidgetProxy();
  consoleErrorProxy();
  const attachBrokerProxy = pastedImageAttachBrokerProxy();

  const isNotificationPayload = (payload: unknown): boolean =>
    typeof payload === 'object' && payload !== null;
  const notificationsHandle: MockHandle = registerMock({ fn: notifications.show });
  notificationsHandle.calledWith([isNotificationPayload]).returns(undefined);

  return {
    // Sets the editor's text and fires the native `input` event a real keystroke would.
    typeText: ({ text }: { text: string }): void => {
      const editor = screen.getByTestId('CHAT_INPUT');
      editor.textContent = text;
      fireEvent.input(editor);
    },

    pressEnter: (): void => {
      fireEvent.keyDown(screen.getByTestId('CHAT_INPUT'), { key: 'Enter', shiftKey: false });
    },

    pressShiftEnter: (): void => {
      fireEvent.keyDown(screen.getByTestId('CHAT_INPUT'), { key: 'Enter', shiftKey: true });
    },

    clickSend: (): void => {
      fireEvent.click(screen.getByTestId('SEND_BUTTON'));
    },

    // jsdom's ClipboardEvent carries no `clipboardData`, so a DataTransfer stand-in is passed in.
    // The declared `type` on the item is set from `mediaType` directly, as in ChatInputWidgetProxy.
    pasteImage: ({
      mediaType,
      bytes,
      attachment,
    }: {
      mediaType: DataTransferItem['type'];
      bytes: Uint8Array;
      attachment: ReturnType<typeof ComposerAttachmentStub>;
    }): void => {
      attachBrokerProxy.mintsIds({
        ids: [attachment.attachmentId] as MintIdsParams['ids'],
      });
      attachBrokerProxy.ladderYields({ attachment });

      const blob = new Blob([bytes], { type: mediaType });
      const item = {
        kind: 'file',
        type: mediaType,
        getAsFile: () => new File([blob], 'pasted-image', { type: mediaType }),
      };
      const clipboardData = {
        items: [item],
        getData: () => '',
      } as unknown as DataTransfer;

      fireEvent.paste(screen.getByTestId('CHAT_INPUT'), { clipboardData });
    },

    getText: (): NonNullable<Node['textContent']> =>
      screen.getByTestId('CHAT_INPUT').textContent ?? '',

    hasThumbnail: (): boolean =>
      screen.getByTestId('CHAT_INPUT').querySelector(THUMBNAIL_SELECTOR) !== null,

    isEditorEditable: (): boolean =>
      screen.getByTestId('CHAT_INPUT').getAttribute('contenteditable') === 'true',

    getShownToast: (): unknown =>
      notificationsHandle.callsMatching([isNotificationPayload]).at(-1)?.[0],
  };
};
