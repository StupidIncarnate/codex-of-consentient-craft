/**
 * PURPOSE: Play/pause control for the Node dispatcher. Shows PLAY when the dispatcher is paused
 * and PAUSE when it is playing. Clicking PLAY posts to the play endpoint and surfaces a 409
 * denial reason as a red toast; clicking PAUSE posts to the pause endpoint. While the rate-limit
 * guardrail is holding the queue it also renders the hold notice above the button — the button
 * still reports the user's own lever, which the hold does not change.
 *
 * A live hold DISABLES the button while it reads PLAY and never while it reads PAUSE. Pressing
 * play into a spent quota cannot help: the queue is refused until `resumeAt` whatever the mode
 * says, so a live PLAY invites a press that changes nothing and reads as a broken dispatcher.
 * Stopping the queue is the opposite case — it always works and is always the user's to take, so
 * PAUSE stays clickable however deep the hold.
 *
 * USAGE:
 * <DispatchToggleWidget />
 * // Renders nothing while the dispatch state is loading, then a single pixel button.
 */

import { mantineNotificationsShowAdapter } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter';
import { useDispatchStateBinding } from '../../bindings/use-dispatch-state/use-dispatch-state-binding';
import { orchestrationDispatchPauseBroker } from '../../brokers/orchestration/dispatch-pause/orchestration-dispatch-pause-broker';
import { orchestrationDispatchPlayBroker } from '../../brokers/orchestration/dispatch-play/orchestration-dispatch-play-broker';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import { DispatchHoldNoticeWidget } from '../dispatch-hold-notice/dispatch-hold-notice-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const PLAY_LABEL = 'PLAY' as ButtonLabel;
const PAUSE_LABEL = 'PAUSE' as ButtonLabel;
const PLAY_DENIED_FALLBACK = 'The Node dispatcher could not start playing.';

export const DispatchToggleWidget = (): React.JSX.Element | null => {
  const { state, isLoading } = useDispatchStateBinding();

  if (isLoading || state === null) {
    return null;
  }

  const isPlaying = state.mode === 'node-playing';
  // `mode` is the user's lever and `hold` is the guardrail's, so both render: the button keeps
  // saying what a click will do, and the notice says why nothing is moving meanwhile.
  const hold = state.hold ?? null;

  return (
    <div data-testid="DISPATCH_TOGGLE">
      {hold === null ? null : <DispatchHoldNoticeWidget hold={hold} />}
      <PixelBtnWidget
        label={isPlaying ? PAUSE_LABEL : PLAY_LABEL}
        disabled={!isPlaying && hold !== null}
        onClick={(): void => {
          if (isPlaying) {
            orchestrationDispatchPauseBroker().catch((error: unknown) => {
              globalThis.console.error('[dispatch-toggle] pause failed', error);
            });
            return;
          }
          orchestrationDispatchPlayBroker()
            .then((result) => {
              if (!result.allowed) {
                mantineNotificationsShowAdapter({
                  message: result.reason ?? PLAY_DENIED_FALLBACK,
                  color: 'red',
                });
              }
            })
            .catch((error: unknown) => {
              globalThis.console.error('[dispatch-toggle] play failed', error);
            });
        }}
      />
    </div>
  );
};
