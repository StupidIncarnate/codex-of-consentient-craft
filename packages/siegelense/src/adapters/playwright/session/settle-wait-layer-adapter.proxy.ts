// PURPOSE: Delegates every fake-page scenario to settlePollLayerAdapterProxy, which owns the
// virtual clock, so a test of the facade drives the REAL poll layer against a faked page rather
// than a second fake of its own.
// USAGE: const proxy = settleWaitLayerAdapterProxy(); const fake = proxy.pageQuiet();

import type { Page } from '@playwright/test';

import type { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { settlePollLayerAdapterProxy } from './settle-poll-layer-adapter.proxy';

type ReadingCount = ReturnType<typeof ReadingCountStub>;

export const settleWaitLayerAdapterProxy = (): {
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
} => {
  const pollProxy = settlePollLayerAdapterProxy();

  return {
    pageQuiet: (): {
      page: Page;
      onEachTick: (params: { tick: () => void }) => void;
      getProbeCount: () => ReadingCount;
    } => pollProxy.pageQuiet(),

    pageMutatingFor: ({
      mutatingForMs,
    }: {
      mutatingForMs: number;
    }): {
      page: Page;
      onEachTick: (params: { tick: () => void }) => void;
      getProbeCount: () => ReadingCount;
    } => pollProxy.pageMutatingFor({ mutatingForMs }),

    pageAnimatingForever: (): {
      page: Page;
      onEachTick: (params: { tick: () => void }) => void;
      getProbeCount: () => ReadingCount;
    } => pollProxy.pageAnimatingForever(),
  };
};
