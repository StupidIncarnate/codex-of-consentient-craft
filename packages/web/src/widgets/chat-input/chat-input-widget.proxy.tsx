import { screen } from '@testing-library/react';

import { domComposerDeleteThumbnailAdapterProxy } from '../../adapters/dom/composer-delete-thumbnail/dom-composer-delete-thumbnail-adapter.proxy';
import { domComposerInsertImageAdapterProxy } from '../../adapters/dom/composer-insert-image/dom-composer-insert-image-adapter.proxy';
import { domComposerInsertTextAdapterProxy } from '../../adapters/dom/composer-insert-text/dom-composer-insert-text-adapter.proxy';
import { domComposerReadAdapterProxy } from '../../adapters/dom/composer-read/dom-composer-read-adapter.proxy';
import { domComposerWriteAdapterProxy } from '../../adapters/dom/composer-write/dom-composer-write-adapter.proxy';
import { fileReadDataUrlAdapterProxy } from '../../adapters/file/read-data-url/file-read-data-url-adapter.proxy';
import { mantineNotificationsShowAdapterProxy } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter.proxy';
import { draftImagesLoadBroker } from '../../brokers/draft-images/load/draft-images-load-broker';
import { draftImagesLoadBrokerProxy } from '../../brokers/draft-images/load/draft-images-load-broker.proxy';
import { draftImagesSaveBrokerProxy } from '../../brokers/draft-images/save/draft-images-save-broker.proxy';
import { pastedImageAttachBrokerProxy } from '../../brokers/pasted-image/attach/pasted-image-attach-broker.proxy';
import type { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { ImageOverlayWidgetProxy } from '../image-overlay/image-overlay-widget.proxy';
import { UploadProgressBarWidgetProxy } from '../upload-progress-bar/upload-progress-bar-widget.proxy';

const THUMBNAIL_SELECTOR = `img[${chatComposerStatics.thumbnail.attributeName}]`;

// Derived from mintsIds' own parameter type via a type query, rather than repeating its template
// literal shape by hand — whatever that shape is, this stays in sync with it automatically.
type MintIdsParams = Parameters<ReturnType<typeof pastedImageAttachBrokerProxy>['mintsIds']>[0];

// Derived from UploadProgressBarWidgetProxy's own return type rather than importing UploadPercent
// from its contract — proxy files cannot import contract types, and this stays in sync with
// whatever that proxy's getPercent actually returns.
type ProgressPercent = ReturnType<ReturnType<typeof UploadProgressBarWidgetProxy>['getPercent']>;

export const ChatInputWidgetProxy = (): {
  clearStorage: () => void;
  pasteImage: (params: { mediaType: DataTransferItem['type']; bytes: Uint8Array }) => DataTransfer;
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
} => {
  // Child creation only, per enforce-proxy-child-creation — the widget imports every one of these
  // directly (no binding layer sits between the composer and its adapters/brokers). The DOM
  // composer adapters and fileReadDataUrlAdapter are pure — no I/O to mock — so their proxies are
  // instantiated for the rule and never touched again.
  domComposerReadAdapterProxy();
  domComposerWriteAdapterProxy();
  domComposerInsertTextAdapterProxy();
  domComposerInsertImageAdapterProxy();
  domComposerDeleteThumbnailAdapterProxy();
  fileReadDataUrlAdapterProxy();
  // Composed so the widget's REAL draftImagesSaveBroker/draftImagesLoadBroker calls (on every
  // paste/delete, and on mount) land on a fake IndexedDB instead of jsdom's missing one — jsdom has
  // no indexedDB global, and without this every content-changed step and every mount would reject.
  // Both broker proxies register their OWN fake for `indexedDB.open(name, version)`, and a real
  // `indexedDB.open` call only ever reaches the MOST RECENTLY registered one (registerSpyOn's
  // addressing is shared per (object, method); two equally-specific `calledWith` descriptions
  // collide and the later one silently wins for every future call, from either broker) — so
  // draftImagesSaveBrokerProxy's own internal fake never actually receives a real write once
  // draftImagesLoadBrokerProxy has also been constructed. getStoredDraftImages below sidesteps that
  // entirely by calling the REAL draftImagesLoadBroker rather than reaching into either proxy's own
  // (unreliable) internal state — the same broker restoreDraft() itself calls on every mount, and
  // the mechanism the "the reload restore" tests already prove reads back whatever was really
  // written, regardless of which proxy's fake ended up winning the race above.
  draftImagesSaveBrokerProxy();
  draftImagesLoadBrokerProxy();
  // The widget mounts ImageOverlayWidget as a sibling. Captured (not discarded) because the click
  // -opens-overlay case needs its semantic getters below — reaching through screen.getByTestId
  // directly here would re-implement the getAttribute-not-.src reasoning ImageOverlayWidgetProxy
  // already documents once.
  const overlayProxy = ImageOverlayWidgetProxy();
  // The widget mounts UploadProgressBarWidget as a sibling whenever an upload is in flight.
  // Delegated to below rather than reading its testid/aria attribute here directly — that proxy
  // already documents how the percent is read back.
  const progressBarProxy = UploadProgressBarWidgetProxy();

  const notificationsProxy = mantineNotificationsShowAdapterProxy();
  const attachBrokerProxy = pastedImageAttachBrokerProxy();

  return {
    clearStorage: (): void => {
      localStorage.clear();
    },

    // Builds a real Blob (and a File wrapping it) plus a clipboardData stand-in shaped like the
    // browser's DataTransfer — jsdom's native ClipboardEvent carries no `clipboardData` of its own,
    // so the caller passes this straight into `fireEvent.paste(editor, { clipboardData })`.
    pasteImage: ({
      mediaType,
      bytes,
    }: {
      mediaType: DataTransferItem['type'];
      bytes: Uint8Array;
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

    getShownToast: (): unknown => notificationsProxy.getShownNotification(),

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
    // rather than through either broker proxy's own internal fake state.
    getStoredDraftImages: async (): ReturnType<typeof draftImagesLoadBroker> =>
      draftImagesLoadBroker(),

    isEditorEditable: (): boolean =>
      screen.getByTestId('CHAT_INPUT').getAttribute('contenteditable') === 'true',

    isSendButtonDisabled: (): boolean => screen.getByTestId('SEND_BUTTON').hasAttribute('disabled'),

    hasProgressBar: (): boolean => progressBarProxy.hasBar(),
    getProgressPercent: (): ProgressPercent => progressBarProxy.getPercent(),

    getEditorText: (): NonNullable<Node['textContent']> =>
      screen.getByTestId('CHAT_INPUT').textContent ?? '',
  };
};
