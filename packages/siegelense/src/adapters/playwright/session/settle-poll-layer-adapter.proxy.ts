// PURPOSE: Builds a fake Page whose `waitForTimeout` advances a VIRTUAL clock that `Date.now` then
// reads, so a settle wait covering seconds costs no real time and every elapsed assertion is exact.
// Each scenario method decides what the page-side probe reports on each poll; `onEachTick` lets a
// test drive request notes from inside the wait, which is how a page polling DURING a wait is
// modelled.
// USAGE: const proxy = settlePollLayerAdapterProxy(); const fake = proxy.pageQuiet();

import type { Page } from '@playwright/test';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';

type EpochMs = ReturnType<typeof EpochMsStub>;
type ContentText = ReturnType<typeof ContentTextStub>;
type ReadingCount = ReturnType<typeof ReadingCountStub>;

const START_EPOCH_MS = 1_700_000_000_000;

export const settlePollLayerAdapterProxy = (): {
  pageQuiet: () => {
    page: Page;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
  };
  pageMutatingFor: (params: { mutatingForMs: number }) => {
    page: Page;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
  };
  pageAnimatingForever: () => {
    page: Page;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
  };
  pageProbeRejects: (params: { message: string }) => {
    page: Page;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
  };
} => {
  const clock = { nowMs: EpochMsStub({ value: START_EPOCH_MS }) };
  const state = {
    probeCount: ReadingCountStub({ value: 0 }),
    mutatingForMs: 0,
    lastMutationAtMs: null as EpochMs | null,
    runningAnimations: ReadingCountStub({ value: 0 }),
    rejectMessage: null as ContentText | null,
    tick: null as (() => void) | null,
  };

  registerSpyOn({ object: Date, method: 'now' })
    .calledWith([])
    .implement((): EpochMs => clock.nowMs);

  const page = {
    evaluate: async (): Promise<unknown> => {
      state.probeCount = ReadingCountStub({ value: state.probeCount + 1 });
      if (state.rejectMessage !== null) {
        return Promise.reject(new Error(state.rejectMessage));
      }
      if (clock.nowMs - START_EPOCH_MS < state.mutatingForMs) {
        state.lastMutationAtMs = clock.nowMs;
      }
      return Promise.resolve({
        nowMs: clock.nowMs,
        lastMutationAtMs: state.lastMutationAtMs,
        runningAnimations: state.runningAnimations,
      });
    },
    waitForTimeout: async (ms: number): Promise<void> => {
      clock.nowMs = EpochMsStub({ value: clock.nowMs + ms });
      if (state.tick !== null) {
        state.tick();
      }
      return Promise.resolve(undefined);
    },
  };

  const build = (): {
    page: Page;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
  } => ({
    page: page as never,
    onEachTick: ({ tick }: { tick: () => void }): void => {
      state.tick = tick;
    },
    getProbeCount: (): ReadingCount => state.probeCount,
  });

  return {
    pageQuiet: build,

    // Mutates on every probe until `mutatingForMs` of virtual time has passed, then holds still —
    // the page that renders for a moment and then stops.
    pageMutatingFor: ({
      mutatingForMs,
    }: {
      mutatingForMs: number;
    }): {
      page: Page;
      onEachTick: (params: { tick: () => void }) => void;
      getProbeCount: () => ReadingCount;
    } => {
      state.mutatingForMs = mutatingForMs;
      return build();
    },

    // One finite animation that never finishes: the signal that can never go quiet, so the wait has
    // to report the ceiling rather than hang.
    pageAnimatingForever: (): {
      page: Page;
      onEachTick: (params: { tick: () => void }) => void;
      getProbeCount: () => ReadingCount;
    } => {
      state.runningAnimations = ReadingCountStub({ value: 1 });
      return build();
    },

    pageProbeRejects: ({
      message,
    }: {
      message: string;
    }): {
      page: Page;
      onEachTick: (params: { tick: () => void }) => void;
      getProbeCount: () => ReadingCount;
    } => {
      state.rejectMessage = ContentTextStub({ value: message });
      return build();
    },
  };
};
