/**
 * PURPOSE: Stands one QA walk up on a stack nothing else shares — its own OS-assigned port pair,
 * its own throwaway dungeonmaster home, its own headless Chromium — so several walks can run at
 * once without seeing each other. Different ports mean different origins, which is what separates
 * localStorage and IndexedDB for free; different homes separate guilds, quests and the reset
 * recipe. Reach for this rather than `playwright.config.ts`'s webServer, which owns the same three
 * processes for a SPEC RUN and tears them down when the suite ends: a walk holds one page open
 * across many commands, because six of nine defects on the paste flow were races and replaying a
 * race is not being in one. The fake Claude CLI stays wired on purpose — a BROKEN WOULD SHOW
 * reading taken against non-deterministic real-agent output is not a measurement.
 *
 * USAGE:
 * const lane = await siegeLane({ laneName: 'p1' });
 * await lane.page.goto('/');
 * lane.readNetwork();
 * // Every exchange since boot, request and response bodies included
 * await lane.stop();
 */
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { chromium } from '@playwright/test';
import type { Page, Response as PlaywrightResponse } from '@playwright/test';
import { netFreePortPairAdapter } from '@dungeonmaster/shared/adapters';
import { contentTextContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, FilePath, NetworkPort } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

// A cold Vite pre-bundle of the whole shared surface plus a tsx boot of the API server is the
// slowest thing here; 180s is generous enough that a loaded machine does not report a boot
// failure that was only a slow boot.
const BOOT_TIMEOUT_MS = 180_000;
const READY_POLL_MS = 250;
const KILL_GRACE_MS = 3_000;
// Response bodies are the reason this driver exists, so the cap is high enough to hold a whole
// quest.json rather than a preview of one.
const MAX_BODY_CHARS = 200_000;
const SERVER_WORKSPACE = '@dungeonmaster/server';
const WEB_WORKSPACE = '@dungeonmaster/web';
// Reading a body costs a round trip to the browser, and a bundle's body answers no question a
// siege asks. Everything else — xhr, fetch, document, websocket handshakes — keeps its body.
const BODY_SKIP_RESOURCE_TYPES = new Set(['script', 'stylesheet', 'image', 'font', 'media']);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const FAKE_CLAUDE_CLI = path.resolve(__dirname, '..', 'harnesses', 'claude-mock', 'bin', 'claude');
const FAKE_WARD_CLI = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'orchestrator',
  'test-fixtures',
  'fake-ward-bin',
  'dungeonmaster-ward',
);

export const siegeLane = async ({
  laneName,
}: {
  laneName: string;
}): Promise<{
  apiPort: NetworkPort;
  webPort: NetworkPort;
  home: FilePath;
  baseUrl: ContentText;
  laneDir: FilePath;
  screenshotDir: FilePath;
  page: Page;
  readConsole: () => readonly ContentText[];
  readNetwork: () => readonly ContentText[];
  readWebsocket: () => readonly ContentText[];
  stop: () => Promise<void>;
}> => {
  const { firstPort: apiPort, secondPort: webPort } = await netFreePortPairAdapter();

  const homePath = filePathContract.parse(
    path.join(os.tmpdir(), `dm-siege-${laneName}-${String(process.pid)}`),
  );
  const claudeQueueDir = path.join(homePath, 'claude-queue');
  const wardQueueDir = path.join(homePath, 'ward-queue');
  const laneDir = filePathContract.parse(path.join(REPO_ROOT, 'tmp', 'siege', laneName));
  const screenshotDir = filePathContract.parse(path.join(laneDir, 'screenshots'));

  fs.mkdirSync(claudeQueueDir, { recursive: true });
  fs.mkdirSync(wardQueueDir, { recursive: true });
  fs.mkdirSync(screenshotDir, { recursive: true });

  const apiLogFd = fs.openSync(path.join(laneDir, 'api-server.log'), 'a');
  const webLogFd = fs.openSync(path.join(laneDir, 'web-server.log'), 'a');

  // `dev:no-watch`, never `dev`. The server's `dev` is `tsx watch --conditions=source`, which puts
  // every packages/*/src file in this repo into its module graph — one save anywhere restarts the
  // API server for ~1.5s and Vite's /api proxy answers every request in that window with a bare
  // 500 and an empty body. A lane is held open across a whole path walk while the repo is being
  // edited, so a watcher here would poison measurements at random.
  const apiServer = spawn('npm', ['run', 'dev:no-watch', `--workspace=${SERVER_WORKSPACE}`], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: ['ignore', apiLogFd, apiLogFd],
    env: {
      ...process.env,
      DUNGEONMASTER_PORT: String(apiPort),
      DUNGEONMASTER_HOME: homePath,
      HOME: homePath,
      CLAUDE_CLI_PATH: FAKE_CLAUDE_CLI,
      FAKE_CLAUDE_QUEUE_DIR: claudeQueueDir,
      FAKE_WARD_QUEUE_DIR: wardQueueDir,
      WARD_CLI_PATH: FAKE_WARD_CLI,
      // Registers the env-gated signal-back route so the fake Claude CLI — which has no MCP
      // client — can still drive the operations-ledger relay over HTTP.
      E2E_SIGNAL_BACK_HTTP: '1',
      DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500',
    },
  });

  const webServer = spawn('npm', ['run', 'dev', `--workspace=${WEB_WORKSPACE}`], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: ['ignore', webLogFd, webLogFd],
    env: {
      ...process.env,
      DUNGEONMASTER_PORT: String(apiPort),
      // Vite must bind the SAME port the browser is pointed at. Both sides fall back to
      // `API port + 1`, and those fallbacks agree only while one launcher picks both ports —
      // netFreePortPairAdapter asks the OS for them independently, so they usually do not.
      DUNGEONMASTER_WEB_PORT: String(webPort),
    },
  });

  const killTree = ({ child, signal }: { child: ChildProcess; signal: NodeJS.Signals }): void => {
    const { pid } = child;
    // A child that already reported an exit or a signal took the SIGTERM pass, so the SIGKILL pass
    // has nothing left to address — sending it anyway logs `kill ESRCH` on every clean teardown,
    // which reads as a failure in the one log a later session opens to find out what went wrong.
    if (pid === undefined || child.exitCode !== null || child.signalCode !== null) {
      return;
    }
    try {
      // `npm run` is a wrapper: the listener is its grandchild via `sh -c`. `detached: true`
      // above made the child a process-group leader, so the negative pid takes the whole tree.
      process.kill(-pid, signal);
    } catch (error: unknown) {
      // ESRCH here means the tree is already gone, which is the outcome this is asking for.
      process.stderr.write(`[siege] ${signal} to group ${String(pid)}: ${String(error)}\n`);
    }
  };

  const sleep = async ({ ms }: { ms: number }): Promise<void> => {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  const probeHttp = async ({ url }: { url: string }): Promise<boolean> => {
    try {
      await fetch(url);
      return true;
    } catch {
      // A refused connection is the normal answer while a server is still binding its port; the
      // deadline in waitForHttp is what turns a persistent refusal into a reported failure.
      return false;
    }
  };

  const waitForHttp = async ({
    url,
    deadline,
  }: {
    url: string;
    deadline: number;
  }): Promise<boolean> => {
    const reachable = await probeHttp({ url });
    if (reachable) {
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await sleep({ ms: READY_POLL_MS });
    return waitForHttp({ url, deadline });
  };

  const apiUrl = `http://${environmentStatics.hostname}:${String(apiPort)}`;
  const baseUrl = `http://${environmentStatics.hostname}:${String(webPort)}`;
  const deadline = Date.now() + BOOT_TIMEOUT_MS;

  const [apiReady, webReady] = await Promise.all([
    waitForHttp({ url: `${apiUrl}/api/guilds`, deadline }),
    waitForHttp({ url: `${baseUrl}/`, deadline }),
  ]);

  if (!apiReady || !webReady) {
    killTree({ child: apiServer, signal: 'SIGKILL' });
    killTree({ child: webServer, signal: 'SIGKILL' });
    throw new Error(
      `[siege] lane ${laneName} never came up within ${String(BOOT_TIMEOUT_MS)}ms ` +
        `(api ${apiUrl} ready=${String(apiReady)}, web ${baseUrl} ready=${String(webReady)}). ` +
        `Logs: ${laneDir}`,
    );
  }

  process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(os.homedir(), '.cache', 'ms-playwright');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl });
  // A real Ctrl+V is the only paste that arrives with isTrusted true, and it needs the clipboard
  // to be readable from the page's own origin.
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl });
  const page = await context.newPage();

  const consoleLines: ContentText[] = [];
  const networkLines: ContentText[] = [];
  const websocketLines: ContentText[] = [];

  // Every listener below is armed HERE, once, before the page has navigated anywhere. A listener
  // attached when a `console` or `network` command runs has already missed every message that
  // command was asked about.
  page.on('console', (message) => {
    const location = message.location();
    consoleLines.push(
      contentTextContract.parse(
        JSON.stringify({
          at: Date.now(),
          kind: 'console',
          type: message.type(),
          text: message.text(),
          url: location.url,
          line: location.lineNumber,
        }),
      ),
    );
  });

  page.on('pageerror', (error) => {
    consoleLines.push(
      contentTextContract.parse(
        JSON.stringify({
          at: Date.now(),
          kind: 'pageerror',
          type: error.name,
          text: error.message,
          stack: error.stack,
        }),
      ),
    );
  });

  const readResponseBody = async ({
    response,
  }: {
    response: PlaywrightResponse;
  }): Promise<ContentText> => {
    if (BODY_SKIP_RESOURCE_TYPES.has(response.request().resourceType())) {
      return contentTextContract.parse('<body not captured for this resource type>');
    }
    try {
      const body = await response.text();
      return contentTextContract.parse(body.slice(0, MAX_BODY_CHARS));
    } catch (error: unknown) {
      return contentTextContract.parse(`<body unavailable: ${String(error)}>`);
    }
  };

  const captureResponse = async ({ response }: { response: PlaywrightResponse }): Promise<void> => {
    const request = response.request();
    const responseBody = await readResponseBody({ response });
    networkLines.push(
      contentTextContract.parse(
        JSON.stringify({
          at: Date.now(),
          method: request.method(),
          url: request.url(),
          resourceType: request.resourceType(),
          status: response.status(),
          requestBody: request.postData(),
          responseBody,
        }),
      ),
    );
  };

  page.on('response', (response) => {
    captureResponse({ response }).catch((error: unknown) => {
      process.stderr.write(`[siege] response capture failed: ${String(error)}\n`);
    });
  });

  page.on('requestfailed', (request) => {
    networkLines.push(
      contentTextContract.parse(
        JSON.stringify({
          at: Date.now(),
          method: request.method(),
          url: request.url(),
          resourceType: request.resourceType(),
          status: null,
          requestBody: request.postData(),
          responseBody: `<request failed: ${request.failure()?.errorText ?? 'unknown'}>`,
        }),
      ),
    );
  });

  page.on('websocket', (socket) => {
    const socketUrl = socket.url();
    socket.on('framesent', (frame) => {
      const { payload } = frame;
      websocketLines.push(
        contentTextContract.parse(
          JSON.stringify({
            at: Date.now(),
            url: socketUrl,
            direction: 'sent',
            payload: typeof payload === 'string' ? payload.slice(0, MAX_BODY_CHARS) : '<binary>',
          }),
        ),
      );
    });
    socket.on('framereceived', (frame) => {
      const { payload } = frame;
      websocketLines.push(
        contentTextContract.parse(
          JSON.stringify({
            at: Date.now(),
            url: socketUrl,
            direction: 'received',
            payload: typeof payload === 'string' ? payload.slice(0, MAX_BODY_CHARS) : '<binary>',
          }),
        ),
      );
    });
    socket.on('close', () => {
      websocketLines.push(
        contentTextContract.parse(
          JSON.stringify({ at: Date.now(), url: socketUrl, direction: 'closed', payload: '' }),
        ),
      );
    });
  });

  const stop = async (): Promise<void> => {
    await browser.close();
    killTree({ child: apiServer, signal: 'SIGTERM' });
    killTree({ child: webServer, signal: 'SIGTERM' });
    await sleep({ ms: KILL_GRACE_MS });
    killTree({ child: apiServer, signal: 'SIGKILL' });
    killTree({ child: webServer, signal: 'SIGKILL' });
    fs.closeSync(apiLogFd);
    fs.closeSync(webLogFd);
    fs.rmSync(homePath, { recursive: true, force: true });
  };

  return {
    apiPort,
    webPort,
    home: homePath,
    baseUrl: contentTextContract.parse(baseUrl),
    laneDir,
    screenshotDir,
    page,
    readConsole: (): readonly ContentText[] => [...consoleLines],
    readNetwork: (): readonly ContentText[] => [...networkLines],
    readWebsocket: (): readonly ContentText[] => [...websocketLines],
    stop,
  };
};

export type SiegeLane = Awaited<ReturnType<typeof siegeLane>>;
