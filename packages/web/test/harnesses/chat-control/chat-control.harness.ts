/**
 * PURPOSE: Records which of the chat composer's two control buttons is mounted, in order, so specs
 * can assert the control NEVER reverted rather than only sampling its state at one moment
 *
 * USAGE:
 * const chatControl = chatControlHarness({ page });
 * await chatControl.recordTransitions();             // BEFORE page.goto — installs an init script
 * const seen = await chatControl.readTransitions();  // e.g. ['SEND_BUTTON', 'STOP_BUTTON']
 *
 * Playwright's `toBeVisible` retries until it passes, so a point-in-time check reports green on a
 * control that went dark and came back on its own. The recorded ORDER is what makes "never
 * reverted" expressible as an assertion.
 */
import type { Page } from '@playwright/test';

import type { TestId } from '../../../src/contracts/test-id/test-id-contract';

export const chatControlHarness = ({
  page,
}: {
  page: Page;
}): {
  recordTransitions: () => Promise<void>;
  readTransitions: () => Promise<TestId[]>;
} => ({
  recordTransitions: async (): Promise<void> => {
    await page.addInitScript(() => {
      const seen: TestId[] = [];
      Object.assign(globalThis, { __chatControlTestIds: seen });

      const record = (): void => {
        const stop = document.querySelector('[data-testid="STOP_BUTTON"]');
        const send = document.querySelector('[data-testid="SEND_BUTTON"]');
        // Neither mounted (mode still resolving, route swap mid-flight) records nothing, so a
        // composer-less frame cannot masquerade as a state change.
        if (stop === null && send === null) {
          return;
        }
        const next = (stop === null ? 'SEND_BUTTON' : 'STOP_BUTTON') as TestId;
        if (seen[seen.length - 1] !== next) {
          seen.push(next);
        }
      };

      // MutationObserver, not a poll: setInterval and requestAnimationFrame are throttled to ~1s in
      // a backgrounded tab, long enough to miss the sub-100ms revert this exists to catch.
      // Observe `document`, not `document.documentElement` — an init script runs at document-start
      // where documentElement can still be null, and observe(null) throws, silently leaving the
      // recorder empty and every assertion against it vacuous.
      new MutationObserver(record).observe(document, {
        childList: true,
        subtree: true,
      });

      record();
    });
  },

  readTransitions: async (): Promise<TestId[]> =>
    page.evaluate(
      () =>
        (globalThis as unknown as { __chatControlTestIds?: TestId[] }).__chatControlTestIds ?? [],
    ),
});
