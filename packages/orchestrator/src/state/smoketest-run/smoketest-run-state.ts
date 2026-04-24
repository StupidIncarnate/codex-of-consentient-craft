/**
 * PURPOSE: Singleton tracking the currently-active smoketest run (at most one) plus a bounded buffer of recent progress events for drawer replay
 *
 * USAGE:
 * smoketestRunState.start({ runId, suite });
 * smoketestRunState.isActive();
 * smoketestRunState.getActive();
 * smoketestRunState.appendEvent({ event });
 * smoketestRunState.getRecentEvents();
 * smoketestRunState.end();
 */

import type { SmoketestRunId, SmoketestSuite } from '@dungeonmaster/shared/contracts';

import {
  activeSmoketestRunContract,
  type ActiveSmoketestRun,
} from '../../contracts/active-smoketest-run/active-smoketest-run-contract';
import { isoTimestampContract } from '../../contracts/iso-timestamp/iso-timestamp-contract';

const MAX_BUFFERED_EVENTS = 200;

const state: {
  active: ActiveSmoketestRun | null;
  events: readonly unknown[];
} = {
  active: null,
  events: [],
};

export const smoketestRunState = {
  start: ({ runId, suite }: { runId: SmoketestRunId; suite: SmoketestSuite }): void => {
    state.active = activeSmoketestRunContract.parse({
      runId,
      suite,
      startedAt: isoTimestampContract.parse(new Date().toISOString()),
    });
    state.events = [];
  },

  getActive: (): ActiveSmoketestRun | null => state.active,

  isActive: (): boolean => state.active !== null,

  appendEvent: ({ event }: { event: unknown }): void => {
    const next = [...state.events, event];
    state.events = next.slice(Math.max(0, next.length - MAX_BUFFERED_EVENTS));
  },

  getRecentEvents: (): readonly unknown[] => state.events,

  end: (): void => {
    state.active = null;
  },
};
