/**
 * PURPOSE: Records the ordered status-badge labels an execution row passes through, so a spec can
 * assert the row REALLY entered a state rather than sampling for it and hoping the sample lands
 * inside it
 *
 * USAGE:
 * const rowStatus = executionRowStatusHarness({ page });
 * await rowStatus.recordStatuses({ rowTexts: ['chaos: gather quest requirements'] }); // BEFORE goto
 * const seen = await rowStatus.readStatuses({ rowText: 'chaos: gather quest requirements' });
 * // e.g. ['PENDING', 'RUNNING', 'DONE']
 *
 * Playwright's web-first assertions are a SAMPLER, not an observer: `frames.js` polls
 * `[100, 250, 500, 1000]` and then repeats the last interval, so from ~850 ms after an assertion
 * starts it looks at the DOM once per second. A state that lives for less than that — an execution
 * row RUNNING for as long as its agent runs, which in a fixture is under a second — is missed
 * whenever its phase falls between two samples, and the miss reads as "element(s) not found" on a
 * transition the browser really did render. A MutationObserver sees every state the DOM ever held,
 * so the ORDERED SEQUENCE it records is decidable no matter how briefly each state existed.
 */
import type { Page } from '@playwright/test';

import type { DisplayLabel } from '../../../src/contracts/display-label/display-label-contract';

export const executionRowStatusHarness = ({
  page,
}: {
  page: Page;
}): {
  recordStatuses: (params: { rowTexts: string[] }) => Promise<void>;
  readStatuses: (params: { rowText: string }) => Promise<DisplayLabel[]>;
} => ({
  recordStatuses: async ({ rowTexts }: { rowTexts: string[] }): Promise<void> => {
    await page.addInitScript((texts) => {
      // Index-aligned with `texts` rather than keyed by it, so the page-side store needs no
      // dictionary whose keys would be raw strings.
      const byRowIndex: DisplayLabel[][] = texts.map(() => []);
      Object.assign(globalThis, {
        __executionRowTexts: texts,
        __executionRowStatuses: byRowIndex,
      });

      const record = (): void => {
        const panel = document.querySelector('[data-testid="execution-panel-widget"]');
        if (panel === null) {
          return;
        }
        const rows = Array.from(
          panel.querySelectorAll('[data-testid="execution-row-layer-widget"]'),
        );
        texts.forEach((rowText, index) => {
          const row = rows.find((candidate) => (candidate.textContent ?? '').includes(rowText));
          if (row === undefined) {
            return;
          }
          const badge = row.querySelector('[data-testid="execution-row-status-badge"]');
          const label = (badge?.textContent ?? '').trim();
          // An empty label is a row mid-render with no badge text yet, not a state the row was
          // ever in — recording it would put a phantom step between two real ones.
          if (label.length === 0) {
            return;
          }
          const seen = byRowIndex[index] ?? [];
          if (seen[seen.length - 1] !== label) {
            seen.push(label as DisplayLabel);
          }
        });
      };

      // `characterData` is the load-bearing half here and `childList` alone is not enough: React
      // re-renders the badge by writing the text node's data in place, which is a characterData
      // mutation and fires no childList record at all — the recorder would then hold only the
      // label the row first mounted with. Observe `document`, not `document.documentElement`: an
      // init script runs at document-start where documentElement can still be null, and
      // observe(null) throws, silently leaving the recorder empty and every assertion vacuous.
      new MutationObserver(record).observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      record();
    }, rowTexts);
  },

  readStatuses: async ({ rowText }: { rowText: string }): Promise<DisplayLabel[]> =>
    page.evaluate((text) => {
      const store = globalThis as unknown as {
        __executionRowTexts?: DisplayLabel[];
        __executionRowStatuses?: DisplayLabel[][];
      };
      const index = (store.__executionRowTexts ?? []).indexOf(text as DisplayLabel);
      return index === -1 ? [] : (store.__executionRowStatuses?.[index] ?? []);
    }, rowText),
});
