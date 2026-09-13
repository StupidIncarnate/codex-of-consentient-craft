/**
 * PURPOSE: Test proxy for QueuePageWidget - sets up queue entries via the quest queue binding
 * proxy, dispatch state/play/pause endpoints via the dispatch toggle widget proxy, and the
 * measured rate-limit reading via the rate-limits stack widget proxy.
 *
 * USAGE:
 * const proxy = QueuePageWidgetProxy();
 * proxy.setupEntries({ entries: [QuestQueueEntryStub()] });
 * proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
 * proxy.setupRateLimits({ snapshot: RateLimitsSnapshotStub() });
 */

import { screen, within } from '@testing-library/react';

import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { useQuestQueueBindingProxy } from '../../bindings/use-quest-queue/use-quest-queue-binding.proxy';
import { DispatchToggleWidgetProxy } from '../dispatch-toggle/dispatch-toggle-widget.proxy';
import { RateLimitsStackWidgetProxy } from '../rate-limits-stack/rate-limits-stack-widget.proxy';
import { QueueRowLayerWidgetProxy } from './queue-row-layer-widget.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;
type StackProxy = ReturnType<typeof RateLimitsStackWidgetProxy>;

export const QueuePageWidgetProxy = (): ReturnType<typeof useQuestQueueBindingProxy> & {
  setupDispatchState: (params: { state: DispatchState }) => void;
  setupPlayAllowed: (params: { state: DispatchState }) => void;
  setupPause: (params: { state: DispatchState }) => void;
  setupRateLimits: StackProxy['setupSnapshot'];
  hasToggleLabel: (params: { text: string }) => boolean;
  isToggleDisabled: () => boolean;
  holdNoticeText: () => unknown;
  rateLimitCardText: (params: { testId: string }) => unknown;
  getShownToast: () => unknown;
} => {
  const queue = useQuestQueueBindingProxy();
  const toggle = DispatchToggleWidgetProxy();
  // The list renders one QueueRowLayerWidget per entry; enforce-proxy-child-creation requires its
  // proxy be created here. Empty — the row has no I/O of its own to mock.
  QueueRowLayerWidgetProxy();
  // The page mounts the rate-limit stack, so every queue test fetches a reading whether or not it
  // cares about one — each stages its own through setupRateLimits, `null` being the honest
  // "uncalibrated machine" case.
  const rateLimits = RateLimitsStackWidgetProxy();

  return {
    ...queue,
    setupDispatchState: ({ state }: { state: DispatchState }): void => {
      toggle.setupDispatchState({ state });
    },
    setupPlayAllowed: ({ state }: { state: DispatchState }): void => {
      toggle.setupPlayAllowed({ state });
    },
    setupPause: ({ state }: { state: DispatchState }): void => {
      toggle.setupPause({ state });
    },
    setupRateLimits: rateLimits.setupSnapshot,
    hasToggleLabel: ({ text }: { text: string }): boolean => toggle.hasToggleLabel({ text }),
    isToggleDisabled: (): boolean => toggle.isToggleDisabled(),
    holdNoticeText: (): unknown => toggle.holdNoticeText(),
    // Scoped to the queue page's own mount: the app top bar renders the same stack, so an
    // unscoped lookup would answer for whichever copy happened to be first in the tree.
    rateLimitCardText: ({ testId }: { testId: string }): unknown => {
      const host = screen.queryByTestId('QUEUE_PAGE_RATE_LIMITS');
      return host === null ? null : (within(host).queryByTestId(testId)?.textContent ?? null);
    },
    getShownToast: (): unknown => toggle.getShownToast(),
  };
};
