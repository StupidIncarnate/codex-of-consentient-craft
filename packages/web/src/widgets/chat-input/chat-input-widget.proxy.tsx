import { notifications } from '#gateway/npm/mantine__notifications';
import { Blob } from '#gateway/browser/Blob';
import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';
import { File } from '#gateway/browser/File';
import { clear } from '#gateway/browser/localStorage';
import { readItemProxy } from '#gateway/browser/localStorage/read-item/read-item.proxy';
import { removeItemProxy } from '#gateway/browser/localStorage/remove-item/remove-item.proxy';
import { StorageDisabledErrorStub } from '#gateway/browser/localStorage/read-item/storage-disabled-error.stub';
import { writeItemProxy } from '#gateway/browser/localStorage/write-item/write-item.proxy';
import { screen } from '#gateway/npm/testing-library__react';

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { composerDeleteThumbnailBrokerProxy } from '../../brokers/composer/delete-thumbnail/composer-delete-thumbnail-broker.proxy';
import { composerInsertImageBrokerProxy } from '../../brokers/composer/insert-image/composer-insert-image-broker.proxy';
import { composerInsertTextBrokerProxy } from '../../brokers/composer/insert-text/composer-insert-text-broker.proxy';
import { composerWriteBrokerProxy } from '../../brokers/composer/write/composer-write-broker.proxy';
import { fileReadDataUrlBrokerProxy } from '../../brokers/file/read-data-url/file-read-data-url-broker.proxy';
import { draftImagesLoadBroker } from '../../brokers/draft-images/load/draft-images-load-broker';
import { draftImagesLoadBrokerProxy } from '../../brokers/draft-images/load/draft-images-load-broker.proxy';
import { draftImagesSaveBrokerProxy } from '../../brokers/draft-images/save/draft-images-save-broker.proxy';
import { pastedImageAttachBrokerProxy } from '../../brokers/pasted-image/attach/pasted-image-attach-broker.proxy';
import type { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { ImageOverlayWidgetProxy } from '../image-overlay/image-overlay-widget.proxy';
import { UploadProgressBarWidgetProxy } from '../upload-progress-bar/upload-progress-bar-widget.proxy';

// None of ChatInputWidget's own tests wrap it in a <MemoryRouter> with a :questId param — the
// widget's useParams() call then resolves questId to undefined, exactly like a render on the bare
// /:guildSlug/quest create route, so composerScopeKeyTransformer resolves to this same sentinel for
// EVERY test in that file. Restated (not imported) because a real render's own useParams() is what
// actually decides scope; this proxy is naming the value it independently knows every ChatInputWidget
// test resolves to, not deriving it.
const WIDGET_TEST_SCOPE = chatComposerStatics.draftScope.createScopeKey;

const THUMBNAIL_SELECTOR = `img[${chatComposerStatics.thumbnail.attributeName}]`;

// Derived from mintsIds' own parameter type via a type query, rather than repeating its template
// literal shape by hand — whatever that shape is, this stays in sync with it automatically.
type MintIdsParams = Parameters<ReturnType<typeof pastedImageAttachBrokerProxy>['mintsIds']>[0];

// Derived from UploadProgressBarWidgetProxy's own return type, so this stays in sync with
// whatever that proxy's getPercent actually returns.
type ProgressPercent = ReturnType<ReturnType<typeof UploadProgressBarWidgetProxy>['getPercent']>;

export const ChatInputWidgetProxy = (): {
  clearStorage: () => void;
  pasteImage: (params: {
    mediaType: DataTransferItem['type'];
    bytes: Uint8Array<ArrayBuffer>;
  }) => DataTransfer;
  pasteText: (params: { text: DataTransferItem['type'] }) => DataTransfer;
  attachYields: (params: { attachment: ReturnType<typeof ComposerAttachmentStub> }) => void;
  attachFails: (params: { error: Error }) => void;
  getShownToast: () => unknown;
  getThumbnailSrcs: () => readonly HTMLImageElement['src'][];
  getThumbnailAttachmentIds: () => readonly ReturnType<Element['getAttribute']>[];
  getEditorChildren: () => readonly {
    nodeName: Node['nodeName'];
    text: NonNullable<Node['textContent']>;
  }[];
  hasOverlay: () => boolean;
  getOverlayImageSrc: () => HTMLImageElement['src'] | null;
  getStoredDraftImages: () => ReturnType<typeof draftImagesLoadBroker>;
  isEditorEditable: () => boolean;
  isSendButtonDisabled: () => boolean;
  hasProgressBar: () => boolean;
  getProgressPercent: () => ProgressPercent;
  getEditorText: () => NonNullable<Node['textContent']>;
  indexedDbUnavailable: (params: { error: Error }) => void;
  storageWriteFails: (params: { key: string }) => void;
  storageRemoveFails: (params: { key: string }) => void;
  getLoggedErrors: () => RecordedCalls;
} => {
  // Child creation only, per enforce-proxy-child-creation — the widget imports every one of these
  // directly (no binding layer sits between the composer and its adapters/brokers). The DOM
  // composer brokers and fileReadDataUrlBroker are pure — no I/O to mock — so their proxies are
  // instantiated for the rule and never touched again.
  composerWriteBrokerProxy();
  composerInsertTextBrokerProxy();
  composerInsertImageBrokerProxy();
  composerDeleteThumbnailBrokerProxy();
  fileReadDataUrlBrokerProxy();
  // Composed so the widget's REAL draftImagesSaveBroker/draftImagesLoadBroker calls (on every
  // paste/delete, and on mount) land on the gateway's in-memory IndexedDB instead of jsdom's missing
  // one. Both proxies stage the same database, so a save the widget makes is what a load reads back;
  // getStoredDraftImages below calls the REAL draftImagesLoadBroker for the same reason
  // restoreDraft() does on every mount.
  draftImagesSaveBrokerProxy();
  // Captured (not discarded): its fake `indexedDB.open` is the one that actually answers every
  // real call in this test (see the comment above), so a test that needs the underlying IndexedDB
  // write itself to fail — proving the durable-write ORDERING guarantee rather than racing it —
  // has to reach THIS proxy's storeUnavailable, not draftImagesSaveBrokerProxy's own.
  const loadBrokerProxy = draftImagesLoadBrokerProxy();
  // The widget mounts ImageOverlayWidget as a sibling. Captured (not discarded) because the click
  // -opens-overlay case needs its semantic getters below — reaching through screen.getByTestId
  // directly here would re-implement the getAttribute-not-.src reasoning ImageOverlayWidgetProxy
  // already documents once.
  const overlayProxy = ImageOverlayWidgetProxy();
  // The widget mounts UploadProgressBarWidget as a sibling whenever an upload is in flight.
  // Delegated to below rather than reading its testid/aria attribute here directly — that proxy
  // already documents how the percent is read back.
  const progressBarProxy = UploadProgressBarWidgetProxy();

  const isNotificationPayload = (payload: unknown): boolean =>
    typeof payload === 'object' && payload !== null;
  const notificationsHandle: MockHandle = registerMock({ fn: notifications.show });
  notificationsHandle.calledWith([isNotificationPayload]).returns(undefined);
  const attachBrokerProxy = pastedImageAttachBrokerProxy();
  readItemProxy();
  const storageWriteProxy = writeItemProxy();
  const storageRemoveProxy = removeItemProxy();
  const consoleProxy = consoleErrorProxy();

  return {
    clearStorage: (): void => {
      clear();
    },

    // Builds a real Blob (and a File wrapping it) plus a clipboardData stand-in shaped like the
    // browser's DataTransfer — jsdom's native ClipboardEvent carries no `clipboardData` of its own,
    // so the caller passes this straight into `fireEvent.paste(editor, { clipboardData })`.
    pasteImage: ({
      mediaType,
      bytes,
    }: {
      mediaType: DataTransferItem['type'];
      bytes: Uint8Array<ArrayBuffer>;
    }): DataTransfer => {
      const blob = new Blob([bytes], { type: mediaType });
      const item = {
        kind: 'file',
        type: mediaType,
        getAsFile: () => new File([blob], 'pasted-image', { type: mediaType }),
      };

      return {
        items: [item],
        getData: () => '',
      } as unknown as DataTransfer;
    },

    pasteText: ({ text }: { text: DataTransferItem['type'] }): DataTransfer =>
      ({
        items: [],
        getData: (format: DataTransferItem['type']) => (format === 'text/plain' ? text : ''),
      }) as unknown as DataTransfer,

    // Mints the id the attach broker's crypto.randomUUID() call returns AND stages the downscale
    // ladder's measured size — both are needed for pastedImageAttachBroker to resolve with an
    // attachment carrying this exact attachmentId, rather than a real random one.
    attachYields: ({
      attachment,
    }: {
      attachment: ReturnType<typeof ComposerAttachmentStub>;
    }): void => {
      attachBrokerProxy.mintsIds({
        ids: [attachment.attachmentId] as MintIdsParams['ids'],
      });
      attachBrokerProxy.ladderYields({ attachment });
    },

    attachFails: ({ error }: { error: Error }): void => {
      attachBrokerProxy.ladderFails({ error });
    },

    getShownToast: (): unknown =>
      notificationsHandle.callsMatching([isNotificationPayload]).at(-1)?.[0],

    // getAttribute (not the `.src` IDL property) so a data URL comes back byte-for-byte what the
    // widget wrote — same reasoning as ImageOverlayWidgetProxy's getImageSrc.
    getThumbnailSrcs: (): readonly HTMLImageElement['src'][] =>
      Array.from(screen.getByTestId('CHAT_INPUT').querySelectorAll(THUMBNAIL_SELECTOR)).map(
        (thumbnail) => thumbnail.getAttribute('src') ?? '',
      ),

    getThumbnailAttachmentIds: (): readonly ReturnType<Element['getAttribute']>[] =>
      Array.from(screen.getByTestId('CHAT_INPUT').querySelectorAll(THUMBNAIL_SELECTOR)).map(
        (thumbnail) => thumbnail.getAttribute(chatComposerStatics.thumbnail.attributeName),
      ),

    getEditorChildren: (): readonly {
      nodeName: Node['nodeName'];
      text: NonNullable<Node['textContent']>;
    }[] =>
      Array.from(screen.getByTestId('CHAT_INPUT').childNodes).map((node) => ({
        nodeName: node.nodeName,
        text: node.textContent ?? '',
      })),

    hasOverlay: (): boolean => overlayProxy.hasOverlay(),
    getOverlayImageSrc: (): HTMLImageElement['src'] | null => overlayProxy.getImageSrc(),

    // Reads the store back through the real broker (see the comment above the child-creation block)
    // rather than through either broker proxy's own internal fake state. Scoped to the SAME sentinel
    // every ChatInputWidget test resolves to — see WIDGET_TEST_SCOPE above.
    getStoredDraftImages: async (): ReturnType<typeof draftImagesLoadBroker> =>
      draftImagesLoadBroker({ scopeKey: WIDGET_TEST_SCOPE }),

    isEditorEditable: (): boolean =>
      screen.getByTestId('CHAT_INPUT').getAttribute('contenteditable') === 'true',

    isSendButtonDisabled: (): boolean => screen.getByTestId('SEND_BUTTON').hasAttribute('disabled'),

    hasProgressBar: (): boolean => progressBarProxy.hasBar(),
    getProgressPercent: (): ProgressPercent => progressBarProxy.getPercent(),

    getEditorText: (): NonNullable<Node['textContent']> =>
      screen.getByTestId('CHAT_INPUT').textContent,

    // Makes the real underlying `indexedDB.open` reject — see the capture comment above for why
    // this has to go through the LOAD broker's proxy rather than the save broker's own.
    indexedDbUnavailable: ({ error }: { error: Error }): void => {
      loadBrokerProxy.storeUnavailable({ error });
    },

    // Storage refuses every write (or removal) under this exact key, the way a private-mode browser
    // does; every other key still writes for real.
    storageWriteFails: ({ key }: { key: string }): void => {
      storageWriteProxy.setupWriteFails({ key, error: StorageDisabledErrorStub() });
    },

    storageRemoveFails: ({ key }: { key: string }): void => {
      storageRemoveProxy.setupRemoveFails({ key, error: StorageDisabledErrorStub() });
    },

    getLoggedErrors: (): RecordedCalls => consoleProxy.getCalls(),
  };
};
