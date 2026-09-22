import { settleWaitLayerAdapter } from './settle-wait-layer-adapter';
import { settleWaitLayerAdapterProxy } from './settle-wait-layer-adapter.proxy';

const POLL_URL = 'http://localhost:3737/api/quests';
const POLL_SHAPE = 'GET http://localhost:3737/api/quests';
const WORK_URL = 'http://localhost:3737/api/quests/abc';

const INSTALL_SOURCE_TEXT = [
  '(() => {',
  '  const existing = window.__siegeSettle;',
  '  if (existing !== undefined && existing.observer !== null) { return; }',
  '  const state = { lastMutationAt: null, observer: null };',
  '  window.__siegeSettle = state;',
  '  state.observer = new MutationObserver(() => { state.lastMutationAt = Date.now(); });',
  '  state.observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });',
  '})()',
].join('\n');

const PROBE_SOURCE_TEXT = [
  '(() => {',
  `${INSTALL_SOURCE_TEXT};`,
  '  const state = window.__siegeSettle;',
  "  const animations = typeof document.getAnimations === 'function' ? document.getAnimations() : [];",
  '  let running = 0;',
  '  animations.forEach((animation) => {',
  "    if (animation.playState !== 'running') { return; }",
  '    const effect = animation.effect;',
  '    const iterations = effect === null || effect === undefined ? 1 : effect.getTiming().iterations;',
  '    if (iterations === Infinity) { return; }',
  '    running += 1;',
  '  });',
  '  return { nowMs: Date.now(), lastMutationAtMs: state.lastMutationAt, runningAnimations: running };',
  '})()',
].join('\n');

describe('settleWaitLayerAdapter', () => {
  describe('page-side sources', () => {
    it('VALID: {} => initScriptSource installs the MutationObserver on the document', () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();

      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      expect(settleWait.initScriptSource()).toBe(INSTALL_SOURCE_TEXT);
    });

    it('VALID: {} => probeSource re-installs the observer and skips infinite animations', () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();

      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      expect(settleWait.probeSource()).toBe(PROBE_SOURCE_TEXT);
    });
  });

  describe('a page that goes quiet promptly', () => {
    it('VALID: {nothing ever mutated, no requests} => settles on the first probe with waitedMs 0', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      const reading = await settleWait.waitForSettle({});

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 0,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {mutating for 300ms, quietWindow 250} => settles at 500ms, one quiet window after the last mutation', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageMutatingFor({ mutatingForMs: 300 });
      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      const reading = await settleWait.waitForSettle({});

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 500,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {mutating for 300ms} => probes every 50ms until it settles, eleven probes in all', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageMutatingFor({ mutatingForMs: 300 });
      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      await settleWait.waitForSettle({});

      expect(fake.getProbeCount()).toBe(11);
    });
  });

  describe('a page issuing a repeating poll and nothing else', () => {
    it('VALID: {one shape polled every tick} => settles at 300ms and names the discounted poller', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });
      settleWait.noteRequestStarted({ method: 'GET', url: POLL_URL, resourceType: 'fetch' });
      settleWait.noteRequestSettled({ method: 'GET', url: POLL_URL });
      fake.onEachTick({
        tick: (): void => {
          settleWait.noteRequestStarted({ method: 'GET', url: POLL_URL, resourceType: 'fetch' });
          settleWait.noteRequestSettled({ method: 'GET', url: POLL_URL });
        },
      });

      const reading = await settleWait.waitForSettle({});

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 300,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [POLL_SHAPE],
      });
    });

    it('VALID: {a poll whose cursor changes every tick} => the query string is dropped, so it is still one shape', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });
      settleWait.noteRequestStarted({
        method: 'GET',
        url: `${POLL_URL}?since=1`,
        resourceType: 'fetch',
      });
      settleWait.noteRequestSettled({ method: 'GET', url: `${POLL_URL}?since=1` });
      fake.onEachTick({
        tick: (): void => {
          const cursor = String(Date.now());
          settleWait.noteRequestStarted({
            method: 'GET',
            url: `${POLL_URL}?since=${cursor}`,
            resourceType: 'fetch',
          });
          settleWait.noteRequestSettled({ method: 'GET', url: `${POLL_URL}?since=${cursor}` });
        },
      });

      const reading = await settleWait.waitForSettle({});

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 300,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [POLL_SHAPE],
      });
    });

    it('VALID: {an eventsource opened and never closed} => never counts as pending, so the wait settles at once', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });
      settleWait.noteRequestStarted({
        method: 'GET',
        url: 'http://localhost:3737/api/events',
        resourceType: 'eventsource',
      });

      const reading = await settleWait.waitForSettle({});

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

  describe('real in-flight work', () => {
    it('VALID: {one request in flight, finishing on the first tick, quietWindow 100} => settles at 150ms with nothing discounted', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });
      settleWait.noteRequestStarted({ method: 'POST', url: WORK_URL, resourceType: 'fetch' });
      fake.onEachTick({
        tick: (): void => {
          settleWait.noteRequestSettled({ method: 'POST', url: WORK_URL });
        },
      });

      const reading = await settleWait.waitForSettle({ quietWindowMs: 100 });

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 150,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {one request that never finishes, ceiling 200} => reports the ceiling with the request still pending', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });
      settleWait.noteRequestStarted({ method: 'POST', url: WORK_URL, resourceType: 'fetch' });

      const reading = await settleWait.waitForSettle({ ceilingMs: 200, pollMs: 50 });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 200,
        unsettled: ['network'],
        pendingRequests: 1,
        pollersDiscounted: [],
      });
    });
  });

  describe('a page that never settles', () => {
    it('VALID: {a finite animation that never ends, ceiling 500} => reports settled false and names the animation signal', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageAnimatingForever();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      const reading = await settleWait.waitForSettle({ ceilingMs: 500, pollMs: 50 });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 500,
        unsettled: ['animation'],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {a finite animation that never ends, ceiling 500} => stops probing at the ceiling rather than looping on', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageAnimatingForever();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      await settleWait.waitForSettle({ ceilingMs: 500, pollMs: 50 });

      expect(fake.getProbeCount()).toBe(11);
    });
  });

  describe('request shapes', () => {
    it('VALID: {a shape started twice} => still counts as work, so it is not discounted', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });
      settleWait.noteRequestStarted({ method: 'GET', url: POLL_URL, resourceType: 'fetch' });
      settleWait.noteRequestSettled({ method: 'GET', url: POLL_URL });
      settleWait.noteRequestStarted({ method: 'GET', url: POLL_URL, resourceType: 'fetch' });
      settleWait.noteRequestSettled({ method: 'GET', url: POLL_URL });

      const reading = await settleWait.waitForSettle({ quietWindowMs: 100, pollMs: 50 });

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 100,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {pollerRepeatThreshold: 2} => the second occurrence is already background noise', async () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page, pollerRepeatThreshold: 2 });
      settleWait.noteRequestStarted({ method: 'GET', url: POLL_URL, resourceType: 'fetch' });
      settleWait.noteRequestSettled({ method: 'GET', url: POLL_URL });
      settleWait.noteRequestStarted({ method: 'GET', url: POLL_URL, resourceType: 'fetch' });

      const reading = await settleWait.waitForSettle({ quietWindowMs: 100, pollMs: 50 });

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 100,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [POLL_SHAPE],
      });
    });

    it('VALID: {noteRequestStarted} => hands back the shape it recorded the start against', () => {
      const proxy = settleWaitLayerAdapterProxy();
      const fake = proxy.pageQuiet();
      const settleWait = settleWaitLayerAdapter({ page: fake.page });

      const shape = settleWait.noteRequestStarted({
        method: 'get',
        url: `${POLL_URL}?since=99#top`,
        resourceType: 'fetch',
      });

      expect(shape).toBe(POLL_SHAPE);
    });
  });
});
