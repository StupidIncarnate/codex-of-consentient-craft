// PURPOSE: Builds the `evaluate` and `pause` a settle wait is handed, over a VIRTUAL clock that
// `Date.now` then reads, so a wait covering seconds costs no real time and every elapsed assertion is
// exact. Each scenario method decides what the page-side probe reports on each poll; `onEachTick`
// lets a test drive request notes from inside the wait, which is how a page polling DURING a wait is
// modelled.
// USAGE: const proxy = settlePollLayerBrokerProxy(); const fake = proxy.pageQuiet();
//        await settlePollLayerBroker({ evaluate: fake.evaluate, pause: fake.pause, ... });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { RawSettleProbeStub } from '../../../contracts/raw-settle-probe/raw-settle-probe.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';

type EpochMs = ReturnType<typeof EpochMsStub>;
type ContentText = ReturnType<typeof ContentTextStub>;
type ReadingCount = ReturnType<typeof ReadingCountStub>;
type RawSettleProbe = ReturnType<typeof RawSettleProbeStub>;

const START_EPOCH_MS = 1_700_000_000_000;

export const settlePollLayerBrokerProxy = (): {
  pageQuiet: () => {
    evaluate: (params: { source: ContentText }) => Promise<RawSettleProbe>;
    pause: (params: { ms: number }) => Promise<void>;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
    getProbeSources: () => readonly ContentText[];
  };
  pageMutatingFor: (params: { mutatingForMs: number }) => {
    evaluate: (params: { source: ContentText }) => Promise<RawSettleProbe>;
    pause: (params: { ms: number }) => Promise<void>;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
    getProbeSources: () => readonly ContentText[];
  };
  pageAnimatingForever: () => {
    evaluate: (params: { source: ContentText }) => Promise<RawSettleProbe>;
    pause: (params: { ms: number }) => Promise<void>;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
    getProbeSources: () => readonly ContentText[];
  };
  pageProbeRejects: (params: { message: string }) => {
    evaluate: (params: { source: ContentText }) => Promise<RawSettleProbe>;
    pause: (params: { ms: number }) => Promise<void>;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
    getProbeSources: () => readonly ContentText[];
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
    probeSources: [] as ContentText[],
  };

  registerSpyOn({ object: Date, method: 'now' })
    .calledWith([])
    .implement((): EpochMs => clock.nowMs);

  const build = (): {
    evaluate: (params: { source: ContentText }) => Promise<RawSettleProbe>;
    pause: (params: { ms: number }) => Promise<void>;
    onEachTick: (params: { tick: () => void }) => void;
    getProbeCount: () => ReadingCount;
    getProbeSources: () => readonly ContentText[];
  } => ({
    evaluate: async ({ source }: { source: ContentText }): Promise<RawSettleProbe> => {
      state.probeSources.push(source);
      state.probeCount = ReadingCountStub({ value: state.probeCount + 1 });
      if (state.rejectMessage !== null) {
        return Promise.reject(new Error(state.rejectMessage));
      }
      if (clock.nowMs - START_EPOCH_MS < state.mutatingForMs) {
        state.lastMutationAtMs = clock.nowMs;
      }
      return Promise.resolve(
        RawSettleProbeStub({
          nowMs: clock.nowMs,
          lastMutationAtMs: state.lastMutationAtMs,
          runningAnimations: state.runningAnimations,
        }),
      );
    },
    pause: async ({ ms }: { ms: number }): Promise<void> => {
      clock.nowMs = EpochMsStub({ value: clock.nowMs + ms });
      if (state.tick !== null) {
        state.tick();
      }
      return Promise.resolve(undefined);
    },
    onEachTick: ({ tick }: { tick: () => void }): void => {
      state.tick = tick;
    },
    getProbeCount: (): ReadingCount => state.probeCount,
    getProbeSources: (): readonly ContentText[] => state.probeSources,
  });

  return {
    pageQuiet: build,

    // Mutates on every probe until `mutatingForMs` of virtual time has passed, then holds still —
    // the page that renders for a moment and then stops.
    pageMutatingFor: ({ mutatingForMs }: { mutatingForMs: number }) => {
      state.mutatingForMs = mutatingForMs;
      return build();
    },

    // One finite animation that never finishes: the signal that can never go quiet, so the wait has
    // to report the ceiling rather than hang.
    pageAnimatingForever: () => {
      state.runningAnimations = ReadingCountStub({ value: 1 });
      return build();
    },

    pageProbeRejects: ({ message }: { message: string }) => {
      state.rejectMessage = ContentTextStub({ value: message });
      return build();
    },
  };
};
