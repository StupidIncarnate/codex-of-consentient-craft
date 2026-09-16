import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { StepCandidateStub } from '../../../contracts/step-candidate/step-candidate.stub';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { playwrightSessionAdapter } from './playwright-session-adapter';
import { playwrightSessionAdapterProxy } from './playwright-session-adapter.proxy';

const BASE_URL = 'http://localhost:5555';
const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/home/user/.dungeonmaster/siegelense/inst_1',
});
const TARGET = '[data-testid="PIXEL_BTN"]';
const WITHIN = '[data-testid="GUILD_LIST"]';

describe('playwrightSessionAdapter', () => {
  describe('countMatches()', () => {
    it('VALID: {zero matches} => returns 0', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setLocatorCount({ selector: TARGET, count: 0 });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.countMatches({ target: TARGET });

      expect(result).toBe(0);
    });

    it('VALID: {one match} => returns 1', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setLocatorCount({ selector: TARGET, count: 1 });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.countMatches({ target: TARGET });

      expect(result).toBe(1);
    });

    it('VALID: {several matches} => returns the real count', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setLocatorCount({ selector: TARGET, count: 4 });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.countMatches({ target: TARGET });

      expect(result).toBe(4);
    });

    it('VALID: {target and within} => counts against "within target" composed into one selector, not the bare target', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setLocatorCount({ selector: TARGET, count: 9 });
      proxy.setLocatorCount({ selector: `${WITHIN} ${TARGET}`, count: 2 });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.countMatches({ target: TARGET, within: WITHIN });

      expect(result).toBe(2);
    });
  });

  describe('clickMatch()', () => {
    it('VALID: {target only} => clicks the locator built from the bare target', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.clickMatch({
        target: TARGET,
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getClickCalls()).toStrictEqual([
        { selector: TARGET, options: { timeout: driverStatics.run.defaultStepTimeoutMs } },
      ]);
    });

    it('VALID: {target and within} => clicks the locator built from "within target" composed into one selector', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.clickMatch({
        target: TARGET,
        within: WITHIN,
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getClickCalls()).toStrictEqual([
        {
          selector: `${WITHIN} ${TARGET}`,
          options: { timeout: driverStatics.run.defaultStepTimeoutMs },
        },
      ]);
    });
  });

  describe('fillMatch()', () => {
    it('VALID: {target only} => fills the locator built from the bare target', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.fillMatch({
        target: TARGET,
        value: 'quest name',
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getFillCalls()).toStrictEqual([
        {
          selector: TARGET,
          value: 'quest name',
          options: { timeout: driverStatics.run.defaultStepTimeoutMs },
        },
      ]);
    });

    it('VALID: {target and within} => fills the locator built from "within target" composed into one selector', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.fillMatch({
        target: TARGET,
        within: WITHIN,
        value: 'quest name',
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getFillCalls()).toStrictEqual([
        {
          selector: `${WITHIN} ${TARGET}`,
          value: 'quest name',
          options: { timeout: driverStatics.run.defaultStepTimeoutMs },
        },
      ]);
    });
  });

  describe('waitForMatch()', () => {
    it('VALID: {target only} => waits on the locator built from the bare target', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.waitForMatch({
        target: TARGET,
        state: 'visible',
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getWaitForCalls()).toStrictEqual([
        {
          selector: TARGET,
          options: { state: 'visible', timeout: driverStatics.run.defaultStepTimeoutMs },
        },
      ]);
    });

    it('VALID: {target and within} => waits on the locator built from "within target" composed into one selector', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.waitForMatch({
        target: TARGET,
        within: WITHIN,
        state: 'visible',
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getWaitForCalls()).toStrictEqual([
        {
          selector: `${WITHIN} ${TARGET}`,
          options: { state: 'visible', timeout: driverStatics.run.defaultStepTimeoutMs },
        },
      ]);
    });
  });

  describe('describeMatches()', () => {
    it('VALID: {two matches} => returns both candidates with their real content', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setDescribeMatchesResult({
        raw: [
          { index: 0, within: '[data-testid="GUILD_LIST"]', text: '+', rect: '(444,348) 27x25' },
          {
            index: 1,
            within: '[data-testid="GUILD_SESSION_LIST"]',
            text: '+',
            rect: '(965,348) 27x25',
          },
        ],
      });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.describeMatches({ target: TARGET });

      expect(result).toStrictEqual([
        StepCandidateStub({
          index: 0,
          within: '[data-testid="GUILD_LIST"]',
          text: '+',
          rect: '(444,348) 27x25',
        }),
        StepCandidateStub({
          index: 1,
          within: '[data-testid="GUILD_SESSION_LIST"]',
          text: '+',
          rect: '(965,348) 27x25',
        }),
      ]);
    });
  });

  describe('capture()', () => {
    it('VALID: {filePath} => calls screenshot with animations disabled and the caret hidden', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.capture({ filePath: '/tmp/siegelense/step1.png' });

      expect(proxy.getScreenshotCalls()).toStrictEqual([
        { path: '/tmp/siegelense/step1.png', animations: 'disabled', caret: 'hide' },
      ]);
    });
  });

  describe('readConsoleSince()', () => {
    it('VALID: {a console message, then a pageerror} => returns both in order', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      proxy.emitConsoleMessage({ type: 'log', text: 'first', url: 'http://x/a.js', line: 1 });
      proxy.emitPageError({ name: 'TypeError', message: 'boom', stack: 'TypeError: boom\n at x' });

      const result = session.readConsoleSince({ fromIndex: 0 });

      expect(result).toStrictEqual([
        '{"at":1700000000000,"kind":"console","type":"log","text":"first","url":"http://x/a.js","line":1}',
        '{"at":1700000000000,"kind":"pageerror","type":"TypeError","text":"boom","stack":"TypeError: boom\\n at x"}',
      ]);
    });

    it('EDGE: {fromIndex at the current buffer length} => returns an empty array', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      proxy.emitConsoleMessage({ type: 'log', text: 'only', url: 'http://x', line: 1 });

      const result = session.readConsoleSince({ fromIndex: 1 });

      expect(result).toStrictEqual([]);
    });
  });

  describe('readNetworkSince()', () => {
    it('VALID: {a response, then a failed request} => returns both in order', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await proxy.emitResponse({
        method: 'GET',
        url: 'http://x/api/quests',
        resourceType: 'fetch',
        status: 200,
        requestBody: null,
        responseText: '{"quests":[]}',
      });
      proxy.emitRequestFailed({
        method: 'GET',
        url: 'http://x/api/guilds',
        resourceType: 'fetch',
        requestBody: null,
        errorText: 'net::ERR_CONNECTION_REFUSED',
      });

      const result = session.readNetworkSince({ fromIndex: 0 });

      expect(result).toStrictEqual([
        '{"at":1700000000000,"method":"GET","url":"http://x/api/quests","resourceType":"fetch","status":200,"requestBody":null,"responseBody":"{\\"quests\\":[]}"}',
        '{"at":1700000000000,"method":"GET","url":"http://x/api/guilds","resourceType":"fetch","status":null,"requestBody":null,"responseBody":"<request failed: net::ERR_CONNECTION_REFUSED>"}',
      ]);
    });

    it('VALID: {a response for a body-skipped resource type} => reports the body as not captured, without reading it', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setResponseTextThrows();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await proxy.emitResponse({
        method: 'GET',
        url: 'http://x/app.js',
        resourceType: 'script',
        status: 200,
        requestBody: null,
        responseText: 'console.log(1)',
      });

      const result = session.readNetworkSince({ fromIndex: 0 });

      expect(result).toStrictEqual([
        '{"at":1700000000000,"method":"GET","url":"http://x/app.js","resourceType":"script","status":200,"requestBody":null,"responseBody":"<body not captured for this resource type>"}',
      ]);
    });
  });

  describe('readWebsocketSince()', () => {
    it('VALID: {a sent frame, a received frame, then close} => returns all three in order', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const socket = proxy.emitWebsocket({ url: 'ws://x/socket' });
      socket.frameSent({ payload: 'ping' });
      socket.frameReceived({ payload: 'pong' });
      socket.close();

      const result = session.readWebsocketSince({ fromIndex: 0 });

      expect(result).toStrictEqual([
        '{"at":1700000000000,"url":"ws://x/socket","direction":"sent","payload":"ping"}',
        '{"at":1700000000000,"url":"ws://x/socket","direction":"received","payload":"pong"}',
        '{"at":1700000000000,"url":"ws://x/socket","direction":"closed","payload":""}',
      ]);
    });
  });

  describe('bufferLengths()', () => {
    it('VALID: {one entry pushed to each buffer} => reports each buffer at length one', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      proxy.emitConsoleMessage({ type: 'log', text: 'x', url: 'http://x', line: 1 });
      proxy.emitRequestFailed({
        method: 'GET',
        url: 'http://x',
        resourceType: 'fetch',
        requestBody: null,
        errorText: 'net::ERR_CONNECTION_REFUSED',
      });
      proxy.emitWebsocket({ url: 'ws://x' }).close();

      const result = session.bufferLengths();

      expect(result).toStrictEqual({ consoleLines: 1, networkLines: 1, websocketLines: 1 });
    });
  });

  describe('nearestNames()', () => {
    it('VALID: {testids on the page} => returns them deduplicated and sorted', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setNearestNamesResult({ raw: ['PIXEL_BTN', 'GUILD_LIST', 'PIXEL_BTN'] });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.nearestNames({ target: '[data-testid="GUILD_ADD"]' });

      expect(result).toStrictEqual(['GUILD_LIST', 'PIXEL_BTN']);
    });
  });

  describe('evaluateSource()', () => {
    it('VALID: {source} => returns the JSON-serialized evaluate result', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setEvaluateSourceResult({ result: { ok: true } });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.evaluateSource({ source: '({ ok: true })' });

      expect(result).toBe('{"ok":true}');
    });
  });
});
