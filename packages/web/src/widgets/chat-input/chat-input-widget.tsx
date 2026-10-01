/**
 * PURPOSE: The chat mount of ChatComposerWidget. The composer owns the editor, paste, Enter-to-send
 * and the send button; this widget keeps what the composer does not: draft persistence, the
 * dispatched stamp, the upload progress bar and the STOP/SEND swap on `isStreaming`. Text drafts
 * persist to localStorage; pasted-image bytes persist to IndexedDB, both across tab close/reopen,
 * and both keyed by composerScopeKeyTransformer's questId+surface scope so one composer's draft can
 * never overwrite or restore into another's. A send also stamps its scope as dispatched before the
 * request leaves the browser, so a reload that outruns the response restores nothing for a message
 * the server may already hold — see chatComposerStatics.draftDispatchedKeyPrefix. Reach for
 * ChatComposerWidget directly when the surface needs none of that persistence.
 *
 * USAGE:
 * <ChatInputWidget isStreaming={isStreaming} onSendMessage={handleSend} onStopChat={handleStop} />
 * // Renders the composer with a send or stop button, restores THIS composer's own draft text and
 * // images on mount — scoped by the URL's questId (or the create-surface sentinel when absent) and
 * // by `surface` ('main' by default; the FOLLOW-UP composer passes 'followup')
 */

import { consoleError } from '#gateway/browser/console';
import { readItem, removeItem, writeItem } from '#gateway/browser/localStorage';
import { UnstyledButton } from '#gateway/npm/mantine__core';
import { useCallback, useEffect, useRef, useState } from '#gateway/npm/react';
import { useParams } from '#gateway/npm/react-router-dom';

import type { PastedImageUpload, Quest } from '@dungeonmaster/shared/contracts';

import { draftImagesLoadBroker } from '../../brokers/draft-images/load/draft-images-load-broker';
import { draftImagesSaveBroker } from '../../brokers/draft-images/save/draft-images-save-broker';
import type { ComposerAttachment } from '../../contracts/composer-attachment/composer-attachment-contract';
import type { UploadProgressHandler } from '../../contracts/upload-progress-post/upload-progress-post-contract';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { composerParseDraftTransformer } from '../../transformers/composer-parse-draft/composer-parse-draft-transformer';
import { composerScopeKeyTransformer } from '../../transformers/composer-scope-key/composer-scope-key-transformer';
import type { ComposerSurface } from '../../transformers/composer-scope-key/composer-scope-key-transformer';
import { uploadPercentTransformer } from '../../transformers/upload-percent/upload-percent-transformer';
import { ChatComposerWidget } from '../chat-composer/chat-composer-widget';
import type {
  ChatComposerControl,
  ChatComposerWidgetProps,
} from '../chat-composer/chat-composer-widget';
import { UploadProgressBarWidget } from '../upload-progress-bar/upload-progress-bar-widget';

const SEND_BUTTON_SIZE = 44;

type ComposerContent = Parameters<NonNullable<ChatComposerWidgetProps['onContentChange']>>[0];

export interface ChatInputWidgetProps {
  isStreaming: boolean;
  onSendMessage: (params: {
    message: string;
    images?: readonly PastedImageUpload[];
    onProgress?: UploadProgressHandler;
  }) => Promise<void>;
  onStopChat: () => void;
  // Which composer this instance is — the quest's main (spec-phase) composer, sharing this
  // widget's draft with the create surface once a quest exists, or the FOLLOW-UP (tavernkeeper)
  // composer in the execution panel, which must never share a draft with the main one even though
  // both mount on the SAME quest at the SAME URL. Defaults to 'main': every call site except
  // ExecutionPanelWidget's follow-up tab wants the default. See composerScopeKeyTransformer.
  surface?: ComposerSurface;
}

export const ChatInputWidget = ({
  isStreaming,
  onSendMessage,
  onStopChat,
  surface = 'main',
}: ChatInputWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // Read directly from the URL rather than threaded down as a prop — every composer mount already
  // sits under /:guildSlug/quest or /:guildSlug/quest/:questId, so this is the SAME questId
  // QuestChatContentLayerWidget derives from its own useParams() call three layers up, without
  // adding a questId prop to ChatPanelWidget/ChatInputWidget that every existing call site (and
  // every existing test) would have to start threading through. See composerScopeKeyTransformer's
  // header for why this, `surface`, and the create-surface sentinel together decide the draft.
  const params = useParams();
  const questId = (params.questId as Quest['id'] | undefined) ?? null;
  const composerScope = composerScopeKeyTransformer({ questId, surface });
  const controlRef = useRef<ChatComposerControl | null>(null);
  // The attachment id list as of the last IndexedDB write. `handleContentChanged` runs on every
  // keystroke (the composer reports each one), so the IndexedDB write itself is gated on whether
  // this list actually changed since the last write — a paste, a delete, or a reorder changes which
  // attachments are attached and pays for the write; a keystroke does not touch that list and must
  // not pay for one. Five images at the per-image byte ceiling is roughly 25 MB of IndexedDB
  // records, which is what an unconditional write on every character typed would rewrite.
  const lastSavedAttachmentIdsRef = useRef<readonly ComposerAttachment['attachmentId'][]>([]);
  // What the composer last reported, or what a restore last wrote into it. A rejected send leaves
  // the composer untouched and reports nothing, so the recovery write re-derives from this.
  const lastContentRef = useRef<ComposerContent | null>(null);
  // Counts content-changed steps, so the retraction a failed IndexedDB write schedules can tell
  // whether the composer still holds the content that write was for. The text a retraction restores
  // is a SNAPSHOT taken before the round trip; a keystroke landing during that round trip persists
  // newer text synchronously, and letting a stale retraction land afterwards would replace that
  // newer draft with older content. Whatever superseded it owns the draft from then on, so a
  // superseded retraction is dropped rather than re-derived.
  const contentRevisionRef = useRef(0);
  const cancelledRestoreRef = useRef(false);
  // The scope whose draft this instance is currently showing. One ChatInputWidget instance outlives
  // a change of scope — the create surface's composer is still mounted when the route gains a
  // questId, and the follow-up tab re-points the same composer at a different surface — so
  // restoreDraft compares this against the scope it is about to restore and empties the editor when
  // they differ. `null` means nothing has been restored yet (a genuinely fresh mount), which must
  // NOT clear: the editor is already empty and a user who typed into it before the first restore
  // settled would lose that. See restoreDraft.
  const restoredScopeRef = useRef<string | null>(null);
  // Paints the byte-tracked bar while a send carrying images is in flight; cleared in `.finally`
  // of the send — see handleSubmit.
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  // Stamps/clears the "this draft's send already left the browser" marker — see
  // chatComposerStatics.draftDispatchedKeyPrefix's own header for the full mechanics. Two tiny
  // standalone callbacks (not folded into handleSubmit) so restoreDraft below can reach the SAME
  // clear semantics without duplicating the key-building.
  const markDraftDispatched = useCallback((): void => {
    const dispatchedKey = `${chatComposerStatics.draftDispatchedKeyPrefix}:${composerScope}`;
    const written = writeItem({ key: dispatchedKey, value: 'true' });
    if (!written.success) {
      consoleError('[chat-input] failed to stamp the draft as dispatched', written.error);
    }
  }, [composerScope]);

  const clearDraftDispatchedStamp = useCallback((): void => {
    const dispatchedKey = `${chatComposerStatics.draftDispatchedKeyPrefix}:${composerScope}`;
    const removed = removeItem({ key: dispatchedKey });
    if (!removed.success) {
      consoleError('[chat-input] failed to clear the dispatched stamp', removed.error);
    }
  }, [composerScope]);

  // Writes the localStorage half of the draft only. A standalone callback (not inlined into
  // handleContentChanged below) because that callback writes through it twice per attachment
  // change — once for the content it just persisted, and once more to retract that content if the
  // IndexedDB write behind it fails.
  const writeTextDraft = useCallback(
    ({ text }: { text: string }): void => {
      const scopedKey = `${chatComposerStatics.draftStorageKeyPrefix}:${composerScope}`;
      const persisted =
        text.length > 0
          ? writeItem({ key: scopedKey, value: text })
          : removeItem({ key: scopedKey });
      if (!persisted.success) {
        consoleError('[chat-input] failed to persist the draft text', persisted.error);
      }
    },
    [composerScope],
  );

  // Persists the text half to localStorage and the image half to IndexedDB (only when the
  // attachment id list changed — see the ref above). Handed to the composer as `onContentChange`,
  // which is what makes plain typing reach here. Never call this only on send, or a tab closed
  // mid-draft loses everything since the last send.
  const handleContentChanged = useCallback(
    ({ text, attachments, force }: ComposerContent & { force: boolean }): void => {
      lastContentRef.current = { text, attachments };
      const attachmentIds = attachments.map((attachment) => attachment.attachmentId);

      const revision = contentRevisionRef.current + 1;
      contentRevisionRef.current = revision;

      const previousAttachmentIds = lastSavedAttachmentIdsRef.current;
      const attachmentIdsUnchanged =
        attachmentIds.length === previousAttachmentIds.length &&
        attachmentIds.every((attachmentId, index) => attachmentId === previousAttachmentIds[index]);

      if (attachmentIdsUnchanged && !force) {
        // No attachment-list change means no IndexedDB write at all, so there is nothing this step
        // could ever have to retract — a plain keystroke persists its text and is done.
        writeTextDraft({ text });
        return;
      }

      // Only an attachment this step ADDS can leave a placeholder token in localStorage naming bytes
      // IndexedDB never accepted, so only an addition arms the retraction below. A removal is the
      // mirror image and needs none: its text names FEWER images than the store holds, which the
      // next save overwrites and which a restore reads as an orphaned record nothing points at.
      const previouslySavedIds = new Set(previousAttachmentIds);
      const addsAttachment = attachmentIds.some(
        (attachmentId) => !previouslySavedIds.has(attachmentId),
      );

      // Recorded before the write starts (not after it resolves) so a second content-changed step
      // for the same gesture would still see the new list as already "saved".
      lastSavedAttachmentIdsRef.current = attachmentIds;

      // The draft that is durable RIGHT NOW — every token in it names bytes IndexedDB already
      // accepted. Read before the write below overwrites it, because it is what the retraction
      // restores; re-deriving it from the live DOM afterwards would rebuild the very content whose
      // bytes failed.
      const durableText =
        readItem({ key: `${chatComposerStatics.draftStorageKeyPrefix}:${composerScope}` }) ?? '';

      // The text draft is written in the SAME synchronous step that put the thumbnail on screen, so
      // the persisted draft never names fewer images than the composer is showing. Holding it back
      // for the IndexedDB round trip is what opens that gap, and a reload landing in it restores a
      // composer one image short of what the user was looking at — with the bytes for that image
      // sitting in the store, orphaned, because no token addresses them.
      writeTextDraft({ text });

      // Durability is held by RETRACTING the token instead of delaying it: a draft that SURVIVES
      // never names bytes IndexedDB does not hold. A reload that outruns the retraction leaves the
      // token behind, and composerParseDraftTransformer drops a token whose record is missing — so
      // the worst case degrades to the surrounding text, never to a literal "[Pasted Image N]" the
      // user could send as prose. The revision check is what keeps a retraction from costing content
      // typed while the write was in flight — see contentRevisionRef.
      draftImagesSaveBroker({ scopeKey: composerScope, attachments }).catch((error: unknown) => {
        consoleError('[chat-input] failed to save draft images', error);
        if (addsAttachment && contentRevisionRef.current === revision) {
          writeTextDraft({ text: durableText });
        }
      });
    },
    [writeTextDraft, composerScope],
  );

  const handleComposerContentChange = useCallback(
    (content: ComposerContent): void => {
      handleContentChanged({ ...content, force: false });
    },
    [handleContentChanged],
  );

  // A settled transaction: the composer locks itself for the ONE POST an Enter/click issues and
  // clears only on acceptance, so a rejection keeps its text and thumbnails. This wrapper adds the
  // dispatched stamp and the byte-tracked bar, and tears both down in `finally` regardless of
  // outcome so the bar never reads as still in flight. A rejection is rethrown for the composer's
  // own error toast.
  const handleSubmit = useCallback(
    async ({
      text,
      images,
    }: {
      text: string;
      images: readonly PastedImageUpload[];
    }): Promise<void> => {
      // Stamped HERE — before onSendMessage, before any await — so the stamp is durably in
      // localStorage the instant this send leaves the browser. A page reload racing the response
      // (the response can arrive at the server and be accepted while the reload wins the race to
      // this document's own JS) still finds the stamp on the next mount; see restoreDraft. Cleared
      // below the moment THIS document learns the outcome either way.
      markDraftDispatched();
      if (images.length > 0) {
        setUploadPercent(chatComposerStatics.upload.minPercent);
      }

      try {
        await onSendMessage({
          message: text,
          ...(images.length > 0
            ? {
                images,
                onProgress: ({ bytesSent, bytesTotal }: Parameters<UploadProgressHandler>[0]) => {
                  setUploadPercent(uploadPercentTransformer({ bytesSent, bytesTotal }));
                },
              }
            : {}),
        });
        // This document saw the acceptance — the stamp has done its job for this send.
        clearDraftDispatchedStamp();
      } catch (error: unknown) {
        // `force: true` because a draft may never have been written for this content (the
        // attachment id list can be unchanged since the last save) — the composer's recoverability
        // must not depend on a write that already happened to have occurred.
        if (lastContentRef.current !== null) {
          handleContentChanged({ ...lastContentRef.current, force: true });
        }
        // This document saw the rejection — clear the stamp so a future restore offers this
        // (still-intact) draft back normally, rather than treating it as already delivered.
        clearDraftDispatchedStamp();
        throw error;
      } finally {
        setUploadPercent(null);
      }
    },
    [onSendMessage, handleContentChanged, markDraftDispatched, clearDraftDispatchedStamp],
  );

  // Restores a draft left behind by a previous tab, SCOPED to this composer alone — see
  // composerScopeKeyTransformer's header. Deliberately a no-op when there is nothing to restore
  // (both halves empty) — writing an empty segment list would clear whatever the user has ALREADY
  // typed or pasted while this async restore was still in flight.
  const restoreDraft = useCallback(async (): Promise<void> => {
    // A scope change empties the editor SYNCHRONOUSLY, before the text read and before the first
    // `await`. Everything below this point is allowed to leave the editor alone when the NEW scope
    // has nothing to restore — that early return is what stops an in-flight restore from clearing
    // content the user typed while it was running — so without this clear the previous scope's text
    // and thumbnails simply stay on screen, now belonging to the new scope: one keystroke then
    // writes them into that scope's draft. Placed above the `await` so there is no window in which
    // a keystroke can do that.
    if (restoredScopeRef.current !== null && restoredScopeRef.current !== composerScope) {
      lastSavedAttachmentIdsRef.current = [];
      lastContentRef.current = null;
      controlRef.current?.clear();
    }
    restoredScopeRef.current = composerScope;

    const wasDispatched =
      readItem({ key: `${chatComposerStatics.draftDispatchedKeyPrefix}:${composerScope}` }) !==
      null;

    if (wasDispatched) {
      // This composer's own document never learned whether its last send was accepted or
      // rejected — the stamp survived to this mount, which happens when a page reload (or tab
      // close) outran the response. Treat it as delivered: clear the stamp and whatever the draft
      // still holds, and leave the composer exactly as empty as a mount with no draft at all,
      // rather than re-offering content the transcript may already show as sent (the duplicate-
      // send bug this exists to prevent). Persisting an empty content with `force` is what
      // performs that clear; see handleContentChanged for why `force` is required.
      clearDraftDispatchedStamp();
      handleContentChanged({ text: '', attachments: [], force: true });
      return;
    }

    const scopedKey = `${chatComposerStatics.draftStorageKeyPrefix}:${composerScope}`;
    const text = (() => {
      const scopedValue = readItem({ key: scopedKey });
      if (scopedValue !== null) return scopedValue;
      if (composerScope !== chatComposerStatics.draftScope.createScopeKey) return '';
      // MIGRATION: a draft saved before per-composer scoping existed lived under one global
      // key, shared by every quest and every tab. That old key carries no quest identity to
      // recover, so the ONLY scope it can safely join is the create surface's — the one scope
      // no real quest can ever collide with (see chatComposerStatics.draftScope.createScopeKey).
      // Adopted once: written to the scoped key and the legacy key removed, so this branch is a
      // no-op on every restore after the first. A failed adopt keeps the legacy key, so the next
      // restore offers the same draft again rather than losing it.
      const legacyValue = readItem({ key: chatComposerStatics.draftStorageKeyPrefix });
      if (legacyValue === null) return '';
      const adopted = writeItem({ key: scopedKey, value: legacyValue });
      if (!adopted.success) {
        consoleError('[chat-input] failed to adopt the legacy draft', adopted.error);
        return legacyValue;
      }
      const legacyRemoved = removeItem({ key: chatComposerStatics.draftStorageKeyPrefix });
      if (!legacyRemoved.success) {
        consoleError('[chat-input] failed to remove the legacy draft key', legacyRemoved.error);
      }
      return legacyValue;
    })();

    try {
      const loadedAttachments = await draftImagesLoadBroker({ scopeKey: composerScope });
      if (cancelledRestoreRef.current) return;
      if (text.length === 0 && loadedAttachments.length === 0) return;

      // A hole (a record whose bytes failed to load) stays at its OWN index here — see
      // draftImagesLoadBroker's header — so the Nth placeholder still gets the Nth id, and
      // composerParseDraftTransformer drops only the one token whose id is undefined, exactly as
      // it already drops a token that never had a backing record at all.
      const attachmentIds = loadedAttachments.map((attachment) => attachment?.attachmentId);
      const segments = composerParseDraftTransformer({ text, attachmentIds });
      const resolvedAttachments = loadedAttachments.filter(
        (attachment) => attachment !== undefined,
      );
      const map = new Map(
        resolvedAttachments.map((attachment) => [attachment.attachmentId, attachment] as const),
      );
      // These ids are what IndexedDB already holds — they were just read back out of it — so the
      // first keystroke after a restore must not immediately rewrite the store it was just loaded
      // from. Holes are excluded here: IndexedDB never held a record for one, so there is nothing
      // for a later handleContentChanged comparison to treat as "already saved".
      lastSavedAttachmentIdsRef.current = resolvedAttachments.map(
        (attachment) => attachment.attachmentId,
      );
      lastContentRef.current = { text, attachments: resolvedAttachments };

      // The control derives the placeholder from the PARSED segments, not the raw localStorage text
      // length — a draft made of nothing but an orphaned "[Pasted Image N]" token (no backing
      // record) parses to zero segments even though its raw text is non-empty, and the placeholder
      // hint must show for that composer exactly as it would for one never typed into.
      controlRef.current?.write({ segments, attachments: map });
    } catch (error) {
      consoleError('[chat-input] failed to restore draft', error);
    }
  }, [composerScope, handleContentChanged, clearDraftDispatchedStamp]);

  useEffect(() => {
    cancelledRestoreRef.current = false;
    restoreDraft().catch((error: unknown) => {
      consoleError('[chat-input] failed to restore draft', error);
    });
    return () => {
      cancelledRestoreRef.current = true;
    };
  }, [restoreDraft]);

  return (
    <ChatComposerWidget
      placeholder="Describe your quest..."
      onSubmit={handleSubmit}
      onContentChange={handleComposerContentChange}
      controlRef={controlRef}
      {...(isStreaming
        ? {
            sendControl: (
              <UnstyledButton
                data-testid="STOP_BUTTON"
                onClick={() => {
                  onStopChat();
                }}
                style={{
                  width: SEND_BUTTON_SIZE,
                  height: SEND_BUTTON_SIZE,
                  flexShrink: 0,
                  backgroundColor: colors.danger,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text,
                  fontFamily: 'monospace',
                  fontSize: 16,
                }}
              >
                {'■'}
              </UnstyledButton>
            ),
          }
        : {})}
    >
      {uploadPercent === null ? null : <UploadProgressBarWidget percent={uploadPercent} />}
    </ChatComposerWidget>
  );
};
