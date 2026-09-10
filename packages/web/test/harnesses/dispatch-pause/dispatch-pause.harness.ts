/**
 * PURPOSE: Stops the Node dispatcher over HTTP — the one construction site for the pause route,
 * shared by the e2e-fixtures auto-fixture (which pauses for EVERY test) and by dispatchHarness.
 *
 * The route is the only thing that reaches a RUNNING loop. That loop reads an in-memory mirror
 * (`orchestrationDispatchState`), not `<DUNGEONMASTER_HOME>/dispatch-state.json`, so writing the
 * state file — what `dispatchHarness.releaseQueueHold` and `holdQueueWithMcpHeartbeat` do — leaves
 * a loop that has already woken running. The responder preserves any `mcpHeartbeatAt` it reads, so
 * pausing never releases a queue hold a spec is relying on.
 *
 * USAGE:
 * await dispatchPauseHarness({ request }).pause();
 */
import type { APIRequestContext } from '@playwright/test';

export const DISPATCH_PAUSE_ROUTE = '/api/orchestration/dispatch/pause';

export const dispatchPauseHarness = ({
  request,
}: {
  request: APIRequestContext;
}): {
  pause: () => Promise<void>;
} => {
  return {
    // Throws on a non-2xx rather than swallowing it. Every spec in the run depends on this call
    // landing, so a pause route answering 500 is the invariant genuinely broken — a silent catch
    // would hand the next spec a running loop and blame the spec for what it then does.
    pause: async (): Promise<void> => {
      const response = await request.post(DISPATCH_PAUSE_ROUTE);

      if (!response.ok()) {
        throw new Error(
          `${DISPATCH_PAUSE_ROUTE} answered ${String(response.status())}; the dispatcher may still be running`,
        );
      }
    },
  };
};
