import { chromium } from './chromium';
import { chromiumProxy } from './chromium.proxy';

describe('chromiumProxy', () => {
  describe('launch', () => {
    it('VALID: {options staged} => resolves a browser and records the launch options', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });

      const browser = await chromium.launch({ headless: true, timeout: 5000 });
      await browser.close();

      expect({
        launches: proxy.getLaunchCalls(),
        closes: proxy.getBrowserCloseCalls(),
      }).toStrictEqual({ launches: [[{ headless: true, timeout: 5000 }]], closes: [[]] });
    });

    it('ERROR: {options differ from the staged ones} => the launch throws, no default browser', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });

      await expect(
        Promise.resolve().then(async () => chromium.launch({ headless: false })),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call launch\(\{"headless":false\}\)\. Calls that ARE set up: \(\{"headless":true\}\)$/u,
      );
    });

    it('ERROR: {nothing staged} => the launch throws', async () => {
      chromiumProxy();

      await expect(
        Promise.resolve().then(async () => chromium.launch({ headless: true })),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call launch\(\{"headless":true\}\)\. Calls that ARE set up: $/u,
      );
    });
  });

  describe('browser context', () => {
    it('VALID: {newContext, grantPermissions, newPage} => records the options each was given', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const browser = await chromium.launch({ headless: true });

      const context = await browser.newContext({
        baseURL: 'http://localhost:5173',
        recordVideo: { dir: '/evidence/video' },
      });
      await context.grantPermissions(['clipboard-read'], { origin: 'http://localhost:5173' });
      await context.newPage();

      expect({
        newContext: proxy.getNewContextCalls(),
        grantPermissions: proxy.getGrantPermissionsCalls(),
      }).toStrictEqual({
        newContext: [
          [{ baseURL: 'http://localhost:5173', recordVideo: { dir: '/evidence/video' } }],
        ],
        grantPermissions: [[['clipboard-read'], { origin: 'http://localhost:5173' }]],
      });
    });
  });

  describe('page.evaluate', () => {
    it('VALID: {two string sources staged} => each source gets its own result', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.evaluateReturns({ source: /childElementCount/u, result: { rows: 2 } });
      proxy.evaluateReturns({ source: /__siegeSettle/u, result: { quiet: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      const dom: unknown = await page.evaluate('(() => document.body.childElementCount)()');
      const settle: unknown = await page.evaluate('window.__siegeSettle');

      expect({ dom, settle }).toStrictEqual({ dom: { rows: 2 }, settle: { quiet: true } });
    });

    it('VALID: {function page function staged by predicate} => answers it and records its arg', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const isClipboardWrite = (value: unknown): boolean => String(value).includes('clipboard');
      proxy.evaluateReturns({ source: isClipboardWrite, result: 'written' });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const writeClipboard = async (text: string): Promise<string> =>
        Promise.resolve(`clipboard ${text}`);

      const result = await page.evaluate(writeClipboard, 'hello');

      expect({
        result,
        calls: proxy.getEvaluateCallsFor({ source: isClipboardWrite }),
      }).toStrictEqual({ result: 'written', calls: [[writeClipboard, 'hello']] });
    });

    it('EDGE: {string source handed an arg} => resolves undefined, as real Playwright drops the arg', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.evaluateReturns({ source: /getBoundingClientRect/u, result: [{ ref: 1 }] });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      const result: unknown = await page.evaluate('(p) => p.getBoundingClientRect()', {
        target: 'button',
      });

      expect(result).toBe(undefined);
    });

    it('ERROR: {source never staged} => the call throws, no default answer', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.evaluateReturns({ source: 'document.title', result: 'Title' });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await expect(
        Promise.resolve().then(async () => page.evaluate('document.location.href')),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call evaluate\("document\.location\.href"\)\. Calls that ARE set up: .*\("document\.title"\)$/u,
      );
    });

    it('ERROR: {evaluateRejects} => rejects with the staged error', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.evaluateRejects({
        source: /removeAttribute/u,
        error: new Error('Execution context was destroyed'),
      });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await expect(page.evaluate("el.removeAttribute('siege-target')")).rejects.toThrow(
        /^Execution context was destroyed$/u,
      );
    });
  });

  describe('locator', () => {
    it('VALID: {counts staged for two selectors} => each selector answers its own count', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.locatorCountReturns({ selector: '[data-testid="A"]', count: 1 });
      proxy.locatorCountReturns({ selector: '[data-testid="B"]', count: 3 });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      const countA = await page.locator('[data-testid="A"]').count();
      const countB = await page.locator('[data-testid="B"]').count();

      expect({ countA, countB }).toStrictEqual({ countA: 1, countB: 3 });
    });

    it('ERROR: {count for an unstaged selector} => throws, no default zero', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.locatorCountReturns({ selector: 'button', count: 1 });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await expect(Promise.resolve().then(async () => page.locator('a').count())).rejects.toThrow(
        /^registerMock: nothing set up for the call count\("a"\)\. Calls that ARE set up: \("button"\)$/u,
      );
    });

    it('VALID: {click, fill, focus, waitFor} => each records the selector and its own arguments', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await page.locator('button').click({ timeout: 100 });
      await page.locator('input').fill('hello', { timeout: 200 });
      await page.locator('textarea').focus({ timeout: 300 });
      await page.locator('dialog').waitFor({ state: 'hidden', timeout: 400 });

      expect({
        click: proxy.getLocatorCalls({ action: 'click' }),
        fill: proxy.getLocatorCalls({ action: 'fill' }),
        focus: proxy.getLocatorCalls({ action: 'focus' }),
        waitFor: proxy.getLocatorCalls({ action: 'waitFor' }),
      }).toStrictEqual({
        click: [['button', { timeout: 100 }]],
        fill: [['input', 'hello', { timeout: 200 }]],
        focus: [['textarea', { timeout: 300 }]],
        waitFor: [['dialog', { state: 'hidden', timeout: 400 }]],
      });
    });

    it('ERROR: {locatorActionRejects for one selector} => that action rejects, another selector still resolves', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.locatorActionRejects({
        action: 'click',
        selector: '[siege-target]',
        error: new Error('strict mode violation'),
      });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await page.locator('button').click();

      await expect(page.locator('[siege-target]').click()).rejects.toThrow(
        /^strict mode violation$/u,
      );
    });
  });

  describe('page actions', () => {
    it('VALID: {keyboard, waits, init script, viewport, screenshot, goto} => each records its arguments', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await page.keyboard.press('Control+V');
      await page.waitForFunction('window.ready === true', undefined, { timeout: 500 });
      await page.waitForTimeout(50);
      await page.addInitScript('window.__siegeSettle = {}');
      await page.setViewportSize({ width: 800, height: 600 });
      const shot = await page.screenshot({ path: '/evidence/a.png', animations: 'disabled' });
      await page.goto('/quests', { waitUntil: 'domcontentloaded' });

      expect({
        press: proxy.getKeyboardPressCalls(),
        waitForFunction: proxy.getWaitForFunctionCalls(),
        waitForTimeout: proxy.getWaitForTimeoutCalls(),
        addInitScript: proxy.getAddInitScriptCalls(),
        setViewportSize: proxy.getSetViewportSizeCalls(),
        screenshot: proxy.getScreenshotCalls(),
        shot,
        goto: proxy.getGotoCalls(),
      }).toStrictEqual({
        press: [['Control+V']],
        waitForFunction: [['window.ready === true', undefined, { timeout: 500 }]],
        waitForTimeout: [[50]],
        addInitScript: [['window.__siegeSettle = {}']],
        setViewportSize: [[{ width: 800, height: 600 }]],
        screenshot: [[{ path: '/evidence/a.png', animations: 'disabled' }]],
        shot: Buffer.alloc(0),
        goto: [['/quests', { waitUntil: 'domcontentloaded' }]],
      });
    });

    it('ERROR: {waitForFunctionRejects for a source} => that wait rejects with the staged error', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.waitForFunctionRejects({
        source: 'window.never === true',
        error: new Error('Timeout 30000ms exceeded.'),
      });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      await expect(page.waitForFunction('window.never === true')).rejects.toThrow(
        /^Timeout 30000ms exceeded\.$/u,
      );
    });
  });

  describe('page.video', () => {
    it('VALID: {videoRecorded} => video().path() resolves the staged path', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.videoRecorded({ path: '/evidence/video/run.webm' });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      const path = await page.video()?.path();

      expect(path).toBe('/evidence/video/run.webm');
    });

    it('EMPTY: {videoAbsent} => video() returns null', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      proxy.videoAbsent();
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      expect(page.video()).toBe(null);
    });

    it('ERROR: {neither staged} => video() throws', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();

      expect(() => page.video()).toThrow(
        /^registerMock: nothing set up for the call video\(\)\. Calls that ARE set up: $/u,
      );
    });
  });

  describe('page events', () => {
    it('VALID: {emitConsole} => a console listener reads type, text and location', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('console', (message) => {
        seen.push({ type: message.type(), text: message.text(), location: message.location() });
      });

      proxy.emitConsole({ type: 'error', text: 'boom', url: 'http://x/app.js', lineNumber: 7 });

      expect(seen).toStrictEqual([
        {
          type: 'error',
          text: 'boom',
          location: { url: 'http://x/app.js', lineNumber: 7, columnNumber: 0 },
        },
      ]);
    });

    it('VALID: {emitPageError with a stack} => a pageerror listener reads name, message and stack', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('pageerror', (error) => {
        seen.push({ name: error.name, message: error.message, stack: error.stack });
      });

      proxy.emitPageError({ name: 'TypeError', message: 'x is undefined', stack: 'at app.js:1' });

      expect(seen).toStrictEqual([
        { name: 'TypeError', message: 'x is undefined', stack: 'at app.js:1' },
      ]);
    });

    it('EMPTY: {emitPageError without a stack} => the error carries no stack', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('pageerror', (error) => {
        seen.push(error.stack);
      });

      proxy.emitPageError({ name: 'Error', message: 'thrown string' });

      expect(seen).toStrictEqual([undefined]);
    });

    it('VALID: {emitRequest} => a request listener reads method, url and resource type', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('request', (request) => {
        seen.push([request.method(), request.url(), request.resourceType()]);
      });

      proxy.emitRequest({ method: 'GET', url: '/api/quests', resourceType: 'fetch' });

      expect(seen).toStrictEqual([['GET', '/api/quests', 'fetch']]);
    });

    it('VALID: {emitResponse with a body} => a listener reads the request, status and body text', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('response', (response) => {
        const request = response.request();
        response
          .text()
          .then((body) => {
            seen.push([
              request.method(),
              request.url(),
              request.postData(),
              response.status(),
              body,
            ]);
          })
          .catch((error: unknown) => {
            seen.push(error);
          });
      });

      await proxy.emitResponse({
        method: 'POST',
        url: '/api/quests',
        resourceType: 'fetch',
        postData: '{"a":1}',
        status: 201,
        body: '{"id":"q1"}',
      });

      expect(seen).toStrictEqual([['POST', '/api/quests', '{"a":1}', 201, '{"id":"q1"}']]);
    });

    it('ERROR: {emitResponse with an Error body} => response.text() rejects with that error', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('response', (response) => {
        response
          .text()
          .then((body) => {
            seen.push(body);
          })
          .catch((error: unknown) => {
            seen.push(String(error));
          });
      });

      await proxy.emitResponse({
        method: 'GET',
        url: '/logo.png',
        resourceType: 'image',
        postData: null,
        status: 200,
        body: new Error('Response body is unavailable for redirect responses'),
      });

      expect(seen).toStrictEqual(['Error: Response body is unavailable for redirect responses']);
    });

    it('VALID: {emitRequestFailed} => a listener reads the request and its failure text', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('requestfailed', (request) => {
        seen.push([
          request.method(),
          request.url(),
          request.resourceType(),
          request.postData(),
          request.failure(),
        ]);
      });

      proxy.emitRequestFailed({
        method: 'GET',
        url: '/api/down',
        resourceType: 'xhr',
        postData: null,
        errorText: 'net::ERR_CONNECTION_REFUSED',
      });

      expect(seen).toStrictEqual([
        ['GET', '/api/down', 'xhr', null, { errorText: 'net::ERR_CONNECTION_REFUSED' }],
      ]);
    });

    it('VALID: {emitWebsocket then frames and close} => the socket listeners see each in order', async () => {
      const proxy = chromiumProxy();
      proxy.launchResolves({ options: { headless: true } });
      const page = await (await (await chromium.launch({ headless: true })).newContext()).newPage();
      const seen: unknown[] = [];
      page.on('websocket', (socket) => {
        const url = socket.url();
        socket.on('framesent', (frame) => {
          seen.push(['sent', url, frame.payload]);
        });
        socket.on('framereceived', (frame) => {
          seen.push(['received', url, frame.payload]);
        });
        socket.on('close', () => {
          seen.push(['close', url]);
        });
      });

      const socket = proxy.emitWebsocket({ url: 'ws://localhost/ws' });
      socket.frameSent({ payload: 'ping' });
      socket.frameReceived({ payload: 'pong' });
      socket.close();

      expect(seen).toStrictEqual([
        ['sent', 'ws://localhost/ws', 'ping'],
        ['received', 'ws://localhost/ws', 'pong'],
        ['close', 'ws://localhost/ws'],
      ]);
    });
  });
});
