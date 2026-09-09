/**
 * PURPOSE: Stamps `startedAt`/`completedAt`/`status` directly onto an already-written quest.json's
 * work items — the fields questHarness.writeQuestFile's write-mapping silently drops, because its
 * whitelist has no `startedAt` key and builds every item from an explicit key list with no spread.
 * Reach for this any time a spec needs an execution row to render a duration figure; nothing else
 * under packages/web/test/ can put `startedAt` on disk. Also records which of the browser's
 * `setInterval` registrations are the execution panel's own shared 60-second elapsed tick, so a
 * live-update spec can prove the tick starts and stops rather than only reading its output once.
 *
 * USAGE:
 * const elapsed = elapsedDurationHarness({ page });
 * elapsed.stampWorkItems({
 *   questFilePath,
 *   items: [{ id: workItemId, startedAt: '2026-01-01T11:56:00.000Z' }],
 * });
 * await elapsed.installIntervalCounter(); // BEFORE page.goto
 * const counts = await elapsed.readIntervalCounts();
 * // { registered: 1, cleared: 0, live: 1 }
 */
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

import type { Page } from '@playwright/test';

// Package-local, not `@dungeonmaster/shared` — the elapsed-tick period lives in this package's own
// statics/. `enforce-harness-patterns` only bans `.proxy` paths and paths ending `-contract`, so a
// relative reach into `src/` is mechanically unblocked (mirrors transcript-images.harness.ts's own
// reach into `src/statics/web-config/`).
import { elapsedDisplayConfigStatics } from '../../../src/statics/elapsed-display-config/elapsed-display-config-statics';

const JSON_INDENT = 2;

// Deliberately opaque, mirroring quest.harness.ts's PersistedQuestInput: the point of a
// read-modify-write stamp is that every key it does not name survives untouched, so naming any of
// them here would invite a caller to reach past the one method this file exposes.
type PersistedQuestInput = Record<PropertyKey, unknown>;
type PersistedWorkItemInput = Record<PropertyKey, unknown>;

export const elapsedDurationHarness = ({
  page,
}: {
  page: Page;
}): {
  stampWorkItems: (params: {
    questFilePath: string;
    items: {
      id: string;
      startedAt?: string;
      completedAt?: string;
      status?: string;
    }[];
  }) => void;
  installIntervalCounter: () => Promise<void>;
  // Fields stay `unknown`, never a raw TS `number` keyword, which @dungeonmaster/ban-primitives
  // forbids outside a function parameter position — these are interval-id tallies with no domain
  // contract to brand, structural echoes of a browser-side count the same way
  // composer-send.harness.ts's DOM-read fields are. The values a spec reads back are still real
  // numbers at runtime; only the written TYPE ANNOTATION widens.
  readIntervalCounts: () => Promise<{ registered: unknown; cleared: unknown; live: unknown }>;
} => {
  const stampWorkItems = ({
    questFilePath,
    items,
  }: {
    questFilePath: string;
    items: {
      id: string;
      startedAt?: string;
      completedAt?: string;
      status?: string;
    }[];
  }): void => {
    const persisted = JSON.parse(readFileSync(questFilePath, 'utf8')) as PersistedQuestInput;
    const workItems = Array.isArray(persisted.workItems)
      ? (persisted.workItems as PersistedWorkItemInput[])
      : [];

    const stamped = workItems.map((wi) => {
      const match = items.find((item) => item.id === wi.id);
      if (match === undefined) {
        return wi;
      }
      return {
        ...wi,
        ...(match.startedAt === undefined ? {} : { startedAt: match.startedAt }),
        ...(match.completedAt === undefined ? {} : { completedAt: match.completedAt }),
        ...(match.status === undefined ? {} : { status: match.status }),
      };
    });

    writeFileSync(
      questFilePath,
      JSON.stringify({ ...persisted, workItems: stamped }, null, JSON_INDENT),
    );

    // Mirrors questHarness's rewindQuestStatus: questFilePath shape is
    // <DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questFolder>/quest.json, so four dirname
    // calls reach DUNGEONMASTER_HOME, where the watcher's outbox lives. Appended unconditionally —
    // a live-mounted panel needs this frame to re-read; a not-yet-navigated one just ignores it.
    const dungeonmasterHome = dirname(dirname(dirname(dirname(questFilePath))));
    appendFileSync(
      `${dungeonmasterHome}/event-outbox.jsonl`,
      `${JSON.stringify({ questId: String(persisted.id), timestamp: new Date().toISOString() })}\n`,
    );
  };

  // Wraps window.setInterval/clearInterval BEFORE any application code runs, so every interval the
  // execution panel's shared elapsed-tick binding registers is captured. Patches via
  // `Object.assign(globalThis, {...})` rather than `globalThis.setInterval = fn` — a direct
  // assignment has to satisfy `typeof globalThis.setInterval`'s own overloaded signature exactly,
  // which resolves differently depending on whether the ambient `@types/node` globals or DOM's
  // lib.dom.d.ts win the merge; `Object.assign`'s generic signature sidesteps that entirely.
  const installIntervalCounter = async (): Promise<void> => {
    await page.addInitScript((tickMs: number) => {
      const registered: unknown[] = [];
      const cleared: unknown[] = [];
      Object.assign(globalThis, { __elapsedTickIntervalIds: { registered, cleared } });

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
        __elapsedTickIntervalIds?: { registered: unknown[]; cleared: unknown[] };
      };
      const registeredCount = store.__elapsedTickIntervalIds?.registered.length ?? 0;
      const clearedCount = store.__elapsedTickIntervalIds?.cleared.length ?? 0;
      return {
        registered: registeredCount,
        cleared: clearedCount,
        live: registeredCount - clearedCount,
      };
    });

  return {
    stampWorkItems,
    installIntervalCounter,
    readIntervalCounts,
  };
};
