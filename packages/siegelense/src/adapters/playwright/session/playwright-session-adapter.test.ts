import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { DomReadingStub } from '../../../contracts/dom-reading/dom-reading.stub';
import { FocusedElementStub } from '../../../contracts/focused-element/focused-element.stub';
import { RawDomReadingStub } from '../../../contracts/raw-dom-reading/raw-dom-reading.stub';
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

  describe('waitForPredicate()', () => {
    it('VALID: {source, timeoutMs} => calls page.waitForFunction with the source and the timeout', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.waitForPredicate({
        source: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3',
        timeoutMs: driverStatics.run.defaultStepTimeoutMs,
      });

      expect(proxy.getWaitForFunctionCalls()).toStrictEqual([
        {
          source: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3',
          options: { timeout: driverStatics.run.defaultStepTimeoutMs },
        },
      ]);
    });

    it('ERROR: {predicate never becomes true} => rejects with the underlying timeout', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setWaitForFunctionRejects();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await expect(session.waitForPredicate({ source: 'false', timeoutMs: 5000 })).rejects.toThrow(
        /Timeout 30000ms exceeded/u,
      );
    });
  });

  describe('describeMatches()', () => {
    it('VALID: {two matches} => returns both candidates with their real content', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setDescribeMatchesResult({
        raw: [
          {
            index: 0,
            ref: 16,
            within: '[data-testid="GUILD_LIST"]',
            text: '+',
            rect: '(444,348) 27x25',
          },
          {
            index: 1,
            ref: 23,
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
          ref: 16,
          within: '[data-testid="GUILD_LIST"]',
          text: '+',
          rect: '(444,348) 27x25',
        }),
        StepCandidateStub({
          index: 1,
          ref: 23,
          within: '[data-testid="GUILD_SESSION_LIST"]',
          text: '+',
          rect: '(965,348) 27x25',
        }),
      ]);
    });

    it('VALID: {a described candidate} => its ref becomes drivable, because describing mints one exactly as a look does', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setDescribeMatchesResult({
        raw: [
          {
            index: 0,
            ref: 16,
            within: '[data-testid="GUILD_LIST"]',
            text: '+',
            rect: '(444,348) 27x25',
          },
        ],
      });
      proxy.setRefState({ state: 'out-of-range' });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });
      await session.describeMatches({ target: TARGET });

      const result = await session.refState({ ref: 16 });

      expect(result).toStrictEqual({ state: 'stale', boundary: 'navigation', highestMinted: 16 });
    });
  });

  describe('look()', () => {
    it('VALID: {a page reading} => returns the whole listing, rendered', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setKeyReadResult({
        raw: {
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: 'MAP_FRAME',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
          ],
          highestRef: 1,
          skipped: [],
        },
      });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.look({ within: null });

      expect(result.rendered).toBe(
        [
          'key: 1 rows',
          'ref  element          text / value  attrs  flags',
          '---  ---------------  ------------  -----  -----',
          '  1  MAP_FRAME <div>',
        ].join('\n'),
      );
    });

    it('VALID: {a within scope} => the scope rides the listing', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setKeyReadResult({ raw: { rows: [], highestRef: 0, skipped: [] } });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.look({ within: WITHIN });

      expect(result.within).toBe(WITHIN);
    });
  });

  describe('the ref registry', () => {
    it('VALID: {a session} => the init script is added once, before any navigation', async () => {
      const proxy = playwrightSessionAdapterProxy();
      await playwrightSessionAdapter({ baseUrl: BASE_URL, evidencePath: EVIDENCE_PATH });

      expect(proxy.getInitScripts()).toStrictEqual([
        [
          '(() => {',
          '  const existing = window.__siege;',
          '  if (existing === undefined) {',
          '    window.__siege = { refs: [] };',
          '    return;',
          '  }',
          '  if (Array.isArray(existing.refs) === false) {',
          '    existing.refs = [];',
          '  }',
          '})()',
        ].join('\n'),
      ]);
    });

    it('VALID: {a ref nothing ever minted} => answers unknown rather than resolving to something else', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setRefState({ state: 'out-of-range' });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.refState({ ref: 99 });

      expect(result).toStrictEqual({ state: 'unknown', boundary: null, highestMinted: 0 });
    });

    it('VALID: {a look, then a ref inside what it minted, gone} => answers stale naming the navigation', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setKeyReadResult({ raw: { rows: [], highestRef: 41, skipped: [] } });
      proxy.setRefState({ state: 'out-of-range' });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });
      await session.look({ within: null });

      const result = await session.refState({ ref: 23 });

      expect(result).toStrictEqual({ state: 'stale', boundary: 'navigation', highestMinted: 41 });
    });
  });

  describe('clickRef()', () => {
    it('VALID: {ref} => stamps, clicks the stamp through the strict locator, then unstamps', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.clickRef({ ref: 26, timeoutMs: 5000 });

      expect(proxy.getClickCalls()).toStrictEqual([
        { selector: '[siege-target]', options: { timeout: 5000 } },
      ]);
    });

    it('VALID: {ref} => the stamp is removed afterwards, so the mutation never outlives the step', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.clickRef({ ref: 26, timeoutMs: 5000 });

      expect(proxy.getStampCalls()).toStrictEqual(['stamp', 'unstamp']);
    });
  });

  describe('fillRef()', () => {
    it('VALID: {ref, value} => fills the stamp through the strict locator', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.fillRef({ ref: 14, value: 'guild-alpha', timeoutMs: 5000 });

      expect(proxy.getFillCalls()).toStrictEqual([
        { selector: '[siege-target]', value: 'guild-alpha', options: { timeout: 5000 } },
      ]);
    });
  });

  describe('boxRef()', () => {
    it('VALID: {ref} => reads the geometry of the ref from the page', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setBoxResult({
        raw: {
          ref: 26,
          x: 607,
          y: 472,
          width: 66,
          height: 27,
          viewport: { width: 1280, height: 720 },
          visible: true,
          inViewport: true,
        },
      });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.boxRef({ ref: 26 });

      expect(result).toStrictEqual({
        ref: 26,
        x: 607,
        y: 472,
        width: 66,
        height: 27,
        viewport: { width: 1280, height: 720 },
        visible: true,
        inViewport: true,
      });
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

  describe('readDom()', () => {
    it('VALID: {target, fields: null, text: null} => returns DomReading from page evaluate and domReadLayerAdapter', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setDomReadResult({
        raw: RawDomReadingStub(),
      });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.readDom({
        target: 'button',
        fields: null,
        text: null,
      });

      expect(result).toStrictEqual(DomReadingStub());
    });
  });

  describe('pressKey()', () => {
    it('VALID: {press: "Enter", nothing focused} => calls page.keyboard.press and returns KeyReading with focused: null', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setFocusedResult({ raw: null });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const reading = await session.pressKey({ press: 'Enter' });

      expect(proxy.getKeyboardPressCalls()).toStrictEqual(['Enter']);
      expect(reading).toStrictEqual({
        press: 'Enter',
        focused: null,
      });
    });

    it('VALID: {press: "Tab", active element focused} => calls page.keyboard.press and returns KeyReading with focused element', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const raw = FocusedElementStub({
        tag: 'input',
        testId: 'NAME_INPUT',
        text: 'alice',
        ref: 14,
      });
      proxy.setFocusedResult({ raw });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const reading = await session.pressKey({ press: 'Tab' });

      expect(proxy.getKeyboardPressCalls()).toStrictEqual(['Tab']);
      expect(reading).toStrictEqual({
        press: 'Tab',
        focused: {
          tag: 'input',
          testId: 'NAME_INPUT',
          role: null,
          domId: null,
          text: 'alice',
          ref: 14,
        },
      });
    });
  });

  describe('checkRootPresent()', () => {
    it('VALID: {root is present} => returns true', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setRootPresent({ present: true });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.checkRootPresent();

      expect(result).toBe(true);
    });

    it('VALID: {root is absent} => returns false', async () => {
      const proxy = playwrightSessionAdapterProxy();
      proxy.setRootPresent({ present: false });
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      const result = await session.checkRootPresent();

      expect(result).toBe(false);
    });
  });

  describe('setViewport()', () => {
    it('VALID: {width: 1280, height: 720} => calls page.setViewportSize with width and height', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.setViewport({ width: 1280, height: 720 });

      expect(proxy.getSetViewportSizeCalls()).toStrictEqual([{ width: 1280, height: 720 }]);
    });
  });

  describe('addInitScript()', () => {
    it('VALID: {source: "window.__test = 1;"} => delegates to initScriptAddLayerAdapter', async () => {
      const proxy = playwrightSessionAdapterProxy();
      const session = await playwrightSessionAdapter({
        baseUrl: BASE_URL,
        evidencePath: EVIDENCE_PATH,
      });

      await session.addInitScript({ source: 'window.__test = 1;' });

      expect(proxy.getInitScripts().slice(1)).toStrictEqual([{ content: 'window.__test = 1;' }]);
    });
  });
});
