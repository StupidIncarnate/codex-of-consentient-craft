/**
 * PURPOSE: Counts window.setInterval registrations at the elapsed-tick period for the SESSION
 * transcript route, plus a positive-control probe that registers one from the page so a spec can
 * prove the counter itself was armed. A NEW, self-contained file rather than a method added to
 * elapsed-duration.harness.ts — that file belongs to the elapsed-duration flow and to the quest-chat
 * live-tick spec, both of which other sessions may be walking against this same tree; both harnesses
 * read the same elapsedDisplayConfigStatics.refresh.tickMs, so the period cannot drift between them.
 *
 * USAGE:
 * const probe = sessionSubagentDurationHarness({ page });
 * await probe.installIntervalCounter(); // BEFORE page.goto
 * await page.goto(`/${guildId}/session/${sessionId}`);
 * const counts = await probe.readIntervalCounts();
 * // { registered: 0, cleared: 0, live: 0 } — the session view never ticks on its own
 * await probe.registerElapsedPeriodInterval();
 * const armed = await probe.readIntervalCounts();
 * // { registered: 1, cleared: 0, live: 1 } — proves the counter was actually watching
 */
import type { Page } from '@playwright/test';

// Package-local, not `@dungeonmaster/shared` — the elapsed-tick period lives in this package's own
// statics/. `enforce-harness-patterns` only bans `.proxy` paths and paths ending `-contract`, so a
// relative reach into `src/` is mechanically unblocked (mirrors elapsed-duration.harness.ts's own
// reach into this exact statics file).
import { elapsedDisplayConfigStatics } from '../../../src/statics/elapsed-display-config/elapsed-display-config-statics';

export const sessionSubagentDurationHarness = ({
  page,
}: {
  page: Page;
}): {
  installIntervalCounter: () => Promise<void>;
  // Fields stay `unknown`, never a raw TS `number` keyword, which @dungeonmaster/ban-primitives
  // forbids outside a function parameter position — these are interval-id tallies with no domain
  // contract to brand. The values a spec reads back are still real numbers at runtime; only the
  // written TYPE ANNOTATION widens.
  readIntervalCounts: () => Promise<{ registered: unknown; cleared: unknown; live: unknown }>;
  registerElapsedPeriodInterval: () => Promise<void>;
} => {
  // Wraps window.setInterval/clearInterval BEFORE any application code runs, so every interval the
  // session route would register at the elapsed-tick period is captured. Patches via
  // `Object.assign(globalThis, {...})` rather than `globalThis.setInterval = fn` — a direct
  // assignment has to satisfy `typeof globalThis.setInterval`'s own overloaded signature exactly,
  // which resolves differently depending on whether the ambient `@types/node` globals or DOM's
  // lib.dom.d.ts win the merge; `Object.assign`'s generic signature sidesteps that entirely.
  const installIntervalCounter = async (): Promise<void> => {
    await page.addInitScript((tickMs: number) => {
      const registered: unknown[] = [];
      const cleared: unknown[] = [];
      Object.assign(globalThis, { __sessionSubagentTickIntervalIds: { registered, cleared } });

      const originalSetInterval = globalThis.setInterval;
      const originalClearInterval = globalThis.clearInterval;

      Object.assign(globalThis, {
        setInterval: (handler: () => void, timeout?: number) => {
          const id = originalSetInterval(handler, timeout);
          if (timeout === tickMs) {
            registered.push(id);
          }
          return id;
        },
        clearInterval: (id?: number) => {
          if (id !== undefined && registered.includes(id)) {
            cleared.push(id);
          }
          originalClearInterval(id);
        },
      });
    }, elapsedDisplayConfigStatics.refresh.tickMs);
  };

  const readIntervalCounts = async (): Promise<{
    registered: unknown;
    cleared: unknown;
    live: unknown;
  }> =>
    page.evaluate(() => {
      const store = globalThis as unknown as {
        __sessionSubagentTickIntervalIds?: { registered: unknown[]; cleared: unknown[] };
      };
      const registeredCount = store.__sessionSubagentTickIntervalIds?.registered.length ?? 0;
      const clearedCount = store.__sessionSubagentTickIntervalIds?.cleared.length ?? 0;
      return {
        registered: registeredCount,
        cleared: clearedCount,
        live: registeredCount - clearedCount,
      };
    });

  // The positive control: registers one REAL interval at the identical tick period, from inside the
  // page, through whatever `setInterval` is bound at call time — the patched one, once
  // installIntervalCounter has run. A spec calls this AFTER reading a zero count, so a follow-up
  // {registered: 1, cleared: 0, live: 1} proves the zero came from an armed counter observing
  // nothing, not from a counter that was never watching at all.
  const registerElapsedPeriodInterval = async (): Promise<void> => {
    await page.evaluate((tickMs: number) => {
      globalThis.setInterval((): void => undefined, tickMs);
    }, elapsedDisplayConfigStatics.refresh.tickMs);
  };

  return {
    installIntervalCounter,
    readIntervalCounts,
    registerElapsedPeriodInterval,
  };
};
