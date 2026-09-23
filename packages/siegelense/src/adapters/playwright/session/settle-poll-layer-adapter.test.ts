import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { settlePollLayerAdapter } from './settle-poll-layer-adapter';
import { settlePollLayerAdapterProxy } from './settle-poll-layer-adapter.proxy';

const PROBE_SOURCE = ContentTextStub({ value: '(() => ({}))()' });

describe('settlePollLayerAdapter', () => {
  describe('a page that is already still', () => {
    it('VALID: {no mutation, no animation, no requests} => settles on the first probe with waitedMs 0', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageQuiet();

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 5000,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 102,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 0,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });
  });

  describe('the dom signal', () => {
    it('VALID: {mutating for 300ms, quietWindow 250} => settles at 500ms, one quiet window after the last mutation', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageMutatingFor({ mutatingForMs: 300 });

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 5000,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 102,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 500,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {mutating for 300ms} => probes every 50ms up to the settle, eleven probes in all', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageMutatingFor({ mutatingForMs: 300 });

      await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 5000,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 102,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(fake.getProbeCount()).toBe(11);
    });
  });

  describe('the network signal', () => {
    it('VALID: {one request pending throughout, ceiling 200} => reports the ceiling and names network', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageQuiet();

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 200,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 6,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 1 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 200,
        unsettled: ['network'],
        pendingRequests: 1,
        pollersDiscounted: [],
      });
    });

    it('VALID: {nothing pending, last activity just now, quietWindow 100} => settles one window after that activity', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const activityAtMs = EpochMsStub({ value: Date.now() });

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 100,
        ceilingMs: 5000,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 102,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: activityAtMs,
          pollersDiscounted: [],
        }),
      });

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 100,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });
  });

  describe('a page that never settles', () => {
    it('VALID: {a finite animation that never ends, ceiling 500} => reports settled false and names animation', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageAnimatingForever();

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 500,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 12,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 500,
        unsettled: ['animation'],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {a finite animation that never ends, ceiling 500} => stops probing at the ceiling rather than recursing on', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageAnimatingForever();

      await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 500,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 12,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(fake.getProbeCount()).toBe(11);
    });

    it('EDGE: {attemptsLeft: 1, a clock that never advances} => the attempt bound ends the wait at the first probe', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageAnimatingForever();

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 5000,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 1,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 0 }),
          lastActivityAtMs: null,
          pollersDiscounted: [],
        }),
      });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 0,
        unsettled: ['animation'],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {network and dom both moving, ceiling 100} => names both signals in the reading', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageMutatingFor({ mutatingForMs: 1000 });

      const reading = await settlePollLayerAdapter({
        page: fake.page,
        probeSource: PROBE_SOURCE,
        quietWindowMs: 250,
        ceilingMs: 100,
        pollMs: 50,
        startedAtMs: Date.now(),
        attemptsLeft: 4,
        networkSnapshot: () => ({
          pendingRequests: ReadingCountStub({ value: 2 }),
          lastActivityAtMs: null,
          pollersDiscounted: [ContentTextStub({ value: 'GET http://localhost:3737/api/quests' })],
        }),
      });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 100,
        unsettled: ['network', 'dom'],
        pendingRequests: 2,
        pollersDiscounted: ['GET http://localhost:3737/api/quests'],
      });
    });
  });

  describe('a probe that throws', () => {
    it('ERROR: {page.evaluate rejects} => the rejection surfaces rather than being swallowed', async () => {
      const proxy = settlePollLayerAdapterProxy();
      const fake = proxy.pageProbeRejects({
        message: 'Execution context was destroyed, most likely because of a navigation',
      });

      await expect(
        settlePollLayerAdapter({
          page: fake.page,
          probeSource: PROBE_SOURCE,
          quietWindowMs: 250,
          ceilingMs: 5000,
          pollMs: 50,
          startedAtMs: Date.now(),
          attemptsLeft: 102,
          networkSnapshot: () => ({
            pendingRequests: ReadingCountStub({ value: 0 }),
            lastActivityAtMs: null,
            pollersDiscounted: [],
          }),
        }),
      ).rejects.toThrow(/^Execution context was destroyed, most likely because of a navigation$/u);
    });
  });
});
