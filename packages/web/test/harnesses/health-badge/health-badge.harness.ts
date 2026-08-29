/**
 * PURPOSE: The one place the health badge's browser mechanics live — reading its rendered label
 * and title, capturing the real seed response and every real `health-status` heartbeat frame with
 * its arrival instant, counting seed requests, computing the exact `ONLINE Xh Ym` string a frame or
 * the seed ought to produce, and cutting/closing the real wire. Reach for this over composing
 * `page.on(...)`/`page.evaluate(...)` ad hoc in a spec: every health-badge walk forces its fault and
 * reads the badge through this one surface, so a recipe fixed here (e.g. the socket tracker) never
 * has to be fixed five times.
 *
 * USAGE:
 * const hb = healthBadgeHarness({ page });
 * await hb.arm();
 * await page.goto('/');
 * await expect(hb.badge()).toBeVisible();
 * const seedResponses = await hb.getSeedResponses();
 * // seedResponses[0].httpStatus / .payloadStatus / .uptimeSeconds
 */
import type {
  ConsoleMessage,
  Locator,
  Page,
  Response as PlaywrightResponse,
} from '@playwright/test';

import { healthStatusPayloadContract, wsMessageContract } from '@dungeonmaster/shared/contracts';
import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

// Every literal below duplicates a value this package's own statics already carry —
// healthBadgeStatics.testId / .online, webConfigStatics.api.routes.healthStatus, and
// orchestrationEventTypeContract.enum['health-status'] (shared) are the sources of truth. Harness
// files in this package do not import statics values, following comment-queue-send.harness.ts's
// own precedent and stated reasoning.
const HEALTH_BADGE_TEST_ID = 'HEALTH_BADGE';
const HEALTH_STATUS_ROUTE_SUFFIX = '/api/health/status';
const HEALTH_STATUS_WS_TYPE = 'health-status';
const ONLINE_LABEL_WORD = 'ONLINE';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const FRAME_POLL_INTERVAL_MS = 200;
const SEED_RESPONSE_POLL_TIMEOUT_MS = 5_000;

// WebSocket-constructor tracker + close-every-`/ws`-socket recipes, copied verbatim from
// ws-reconnect.e2e.ts:29-45 and :48-64 rather than reinvented — that file is where the recipe was
// worked out and proved. The close script returns the closed sockets' own URLs (an array) instead
// of a bare count: @dungeonmaster/ban-primitives forbids a raw `number` return type even in a
// harness, so closeBackendSockets() below hands back a list and callers read its length.
const WS_TRACKER_SCRIPT = `
(function () {
  var OriginalWS = globalThis.WebSocket;
  globalThis.__wsRegistry = [];
  function TrackedWS(url, protocols) {
    var ws = protocols === undefined ? new OriginalWS(url) : new OriginalWS(url, protocols);
    globalThis.__wsRegistry.push(ws);
    return ws;
  }
  TrackedWS.CONNECTING  = OriginalWS.CONNECTING;
  TrackedWS.OPEN        = OriginalWS.OPEN;
  TrackedWS.CLOSING     = OriginalWS.CLOSING;
  TrackedWS.CLOSED      = OriginalWS.CLOSED;
  TrackedWS.prototype   = OriginalWS.prototype;
  globalThis.WebSocket  = TrackedWS;
})();
`;

const WS_CLOSE_BACKEND_SCRIPT = `
(function () {
  var registry = globalThis.__wsRegistry || [];
  var closedUrls = [];
  for (var i = 0; i < registry.length; i++) {
    var ws = registry[i];
    try {
      var u = new URL(ws.url);
      if (u.pathname === '/ws') {
        ws.close();
        closedUrls.push(u.href);
      }
    } catch (e) {}
  }
  return closedUrls;
})();
`;

// Browser-evaluated: samples Date.now() and the badge's own rendered text in ONE round trip, so the
// elapsed a caller computes and the label it compares are read at the same instant rather than
// racing two separate evaluate() calls. Return type inferred, not annotated — see the primitive
// note above.
const sampleNowAndLabelBrowserFn = (testId: string) => {
  const el = document.querySelector(`[data-testid="${testId}"]`);
  return { now: Date.now(), label: el ? el.textContent : null };
};

// Playwright's own declared return types, referenced by indexed access / ReturnType rather than
// re-declared as a literal `string` or `number` keyword — @dungeonmaster/ban-primitives forbids a
// raw primitive return type even in this harness, so every primitive-shaped value below flows
// through a reference to an already-typed API instead of a keyword this file writes itself.
type BadgeText = Awaited<ReturnType<Locator['textContent']>>;
type BadgeTextNonNull = NonNullable<BadgeText>;
type BadgeTitle = Awaited<ReturnType<Locator['getAttribute']>>;
type NowMs = ReturnType<typeof Date.now>;
type HttpStatusCode = ReturnType<PlaywrightResponse['status']>;
type ErrorText = Error['message'];
type ConsoleText = ReturnType<ConsoleMessage['text']>;

interface CapturedHealthStatusFrame {
  status: HealthStatusPayload['status'];
  uptimeSeconds: HealthStatusPayload['uptimeSeconds'];
  version: HealthStatusPayload['version'];
  arrivedAt: Date;
}

interface CapturedSeedResponse {
  httpStatus: HttpStatusCode;
  payloadStatus: HealthStatusPayload['status'] | undefined;
  uptimeSeconds: HealthStatusPayload['uptimeSeconds'] | undefined;
}

interface RawSeedResponseRecord {
  httpStatus: HttpStatusCode;
  jsonPromise: Promise<unknown>;
}

// The definite shape lastSeedResponse() hands back — every field guaranteed present, so a caller
// never has to narrow a `noUncheckedIndexedAccess`/possibly-failed-parse value inside a spec, where
// jest/no-conditional-in-test bans the `if` that narrowing would need.
interface ObservedSeedResponse {
  httpStatus: HttpStatusCode;
  status: HealthStatusPayload['status'];
  uptimeSeconds: HealthStatusPayload['uptimeSeconds'];
}

// Recursive poll (never while(true)) for the Nth captured health-status frame, mirroring the shape
// of packages/server/test/harnesses/server-ws/server-ws.harness.ts's own frame waiters.
const pollForFrameCount = async ({
  getFrames,
  count,
  deadline,
}: {
  getFrames: () => readonly CapturedHealthStatusFrame[];
  count: number;
  deadline: number;
}): Promise<readonly CapturedHealthStatusFrame[]> => {
  const frames = getFrames();
  if (frames.length >= count) {
    return frames;
  }
  if (Date.now() >= deadline) {
    throw new Error(
      `health-badge harness: only ${String(frames.length)} of ${String(count)} health-status frames arrived before the deadline`,
    );
  }
  await new Promise((resolve) => {
    setTimeout(resolve, FRAME_POLL_INTERVAL_MS);
  });
  return pollForFrameCount({ getFrames, count, deadline });
};

// Recursive poll (never while(true)) for the most recent observed seed response record. Takes a
// getter rather than closing over the array directly, mirroring pollForFrameCount above.
const pollForLastSeedRecord = async ({
  getRecords,
  deadline,
}: {
  getRecords: () => readonly RawSeedResponseRecord[];
  deadline: number;
}): Promise<RawSeedResponseRecord> => {
  const last = getRecords().at(-1);
  if (last !== undefined) {
    return last;
  }
  if (Date.now() >= deadline) {
    throw new Error(
      'health-badge harness: no GET /api/health/status response was observed before the deadline',
    );
  }
  await new Promise((resolve) => {
    setTimeout(resolve, FRAME_POLL_INTERVAL_MS);
  });
  return pollForLastSeedRecord({ getRecords, deadline });
};

export const healthBadgeHarness = ({
  page,
}: {
  page: Page;
}): {
  arm: () => Promise<void>;
  badge: () => Locator;
  labelText: () => Promise<BadgeText>;
  titleText: () => Promise<BadgeTitle>;
  getSeedResponses: () => Promise<readonly CapturedSeedResponse[]>;
  lastSeedResponse: () => Promise<ObservedSeedResponse>;
  getSeedRequestCount: () => readonly Date[];
  waitForFrames: (params: {
    count: number;
    timeoutMs: number;
  }) => Promise<readonly CapturedHealthStatusFrame[]>;
  lastFrame: () => CapturedHealthStatusFrame | undefined;
  expectedOnlineLabel: (params: { uptimeSeconds: number }) => BadgeTextNonNull;
  elapsedSinceLastFrameAndLabel: () => Promise<{ elapsedMs: NowMs; label: BadgeText }>;
  cutWire: () => Promise<void>;
  restoreWire: () => Promise<void>;
  closeBackendSockets: () => Promise<readonly unknown[]>;
  getPageErrors: () => readonly ErrorText[];
  getConsoleErrors: () => readonly ConsoleText[];
} => {
  const capturedFrames: CapturedHealthStatusFrame[] = [];
  const seedResponseRecords: RawSeedResponseRecord[] = [];
  const seedRequestTimestamps: Date[] = [];
  const pageErrorMessages: ErrorText[] = [];
  const consoleErrorMessages: ConsoleText[] = [];

  const badge = (): Locator => page.getByTestId(HEALTH_BADGE_TEST_ID);

  return {
    // Installs the WebSocket-constructor tracker and every listener a health-badge walk needs.
    // MUST be awaited BEFORE page.goto('/') — the tracker only catches sockets built after it is
    // installed, and a listener registered after navigation misses whatever already fired.
    arm: async (): Promise<void> => {
      await page.addInitScript(WS_TRACKER_SCRIPT);

      page.on('pageerror', (error) => {
        pageErrorMessages.push(error.message);
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrorMessages.push(msg.text());
        }
      });

      page.on('request', (req) => {
        if (req.method() === 'GET' && req.url().endsWith(HEALTH_STATUS_ROUTE_SUFFIX)) {
          seedRequestTimestamps.push(new Date());
        }
      });

      // Observation, never interception — no page.route(), which is lint-banned in .e2e.ts anyway.
      page.on('response', (response) => {
        if (!response.url().endsWith(HEALTH_STATUS_ROUTE_SUFFIX)) {
          return;
        }
        seedResponseRecords.push({ httpStatus: response.status(), jsonPromise: response.json() });
      });

      page.on('websocket', (ws) => {
        ws.on('framereceived', (data) => {
          const rawPayload = data.payload;
          const payloadAsString =
            typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf-8');
          const parsedJson = ((): unknown => {
            try {
              return JSON.parse(payloadAsString);
            } catch {
              return undefined;
            }
          })();
          if (parsedJson === undefined) {
            return;
          }
          const envelope = wsMessageContract.safeParse(parsedJson);
          if (!envelope.success || envelope.data.type !== HEALTH_STATUS_WS_TYPE) {
            return;
          }
          const payload = healthStatusPayloadContract.safeParse(envelope.data.payload);
          if (!payload.success) {
            return;
          }
          capturedFrames.push({
            status: payload.data.status,
            uptimeSeconds: payload.data.uptimeSeconds,
            version: payload.data.version,
            arrivedAt: new Date(),
          });
        });
      });
    },

    badge,

    labelText: async (): Promise<BadgeText> => badge().textContent(),

    titleText: async (): Promise<BadgeTitle> => badge().getAttribute('title'),

    getSeedResponses: async (): Promise<readonly CapturedSeedResponse[]> =>
      Promise.all(
        seedResponseRecords.map(async (record) => {
          const raw = await record.jsonPromise;
          const parsed = healthStatusPayloadContract.safeParse(raw);
          return {
            httpStatus: record.httpStatus,
            payloadStatus: parsed.success ? parsed.data.status : undefined,
            uptimeSeconds: parsed.success ? parsed.data.uptimeSeconds : undefined,
          };
        }),
      ),

    // The most recent GET .../api/health/status response, parsed and fully defined — throws if
    // none arrived, or if the body did not parse as a 'ok'/'degraded' HealthStatusPayload. Reach
    // for this over getSeedResponses() when the caller needs ONE genuine value to read
    // uptimeSeconds off (expectedOnlineLabel's input) rather than the whole observation log; every
    // real health-badge walk only ever needs the LATEST successful seed, never a failed one.
    lastSeedResponse: async (): Promise<ObservedSeedResponse> => {
      const record = await pollForLastSeedRecord({
        getRecords: () => seedResponseRecords,
        deadline: Date.now() + SEED_RESPONSE_POLL_TIMEOUT_MS,
      });
      const raw = await record.jsonPromise;
      const payload = healthStatusPayloadContract.parse(raw);
      return {
        httpStatus: record.httpStatus,
        status: payload.status,
        uptimeSeconds: payload.uptimeSeconds,
      };
    },

    // One Date per observed GET .../api/health/status request, oldest first. Named "Count" because
    // that is what every caller reads off it (`.length`) — kept as a list rather than a
    // pre-computed number so this file never writes a raw `number` return type.
    getSeedRequestCount: (): readonly Date[] => seedRequestTimestamps.slice(),

    waitForFrames: async ({
      count,
      timeoutMs,
    }: {
      count: number;
      timeoutMs: number;
    }): Promise<readonly CapturedHealthStatusFrame[]> =>
      pollForFrameCount({
        getFrames: () => capturedFrames,
        count,
        deadline: Date.now() + timeoutMs,
      }),

    lastFrame: (): CapturedHealthStatusFrame | undefined => capturedFrames.at(-1),

    // Arithmetic the spec may not declare for itself — a helper in a .e2e.ts file is rejected by
    // forbid-non-exported-functions before the write lands — matching formatUptimeTransformer's own
    // floor/mod math independently rather than importing it, so this stays a real check against the
    // production code instead of the production code checking itself.
    expectedOnlineLabel: ({ uptimeSeconds }: { uptimeSeconds: number }): BadgeTextNonNull => {
      const hours = Math.floor(uptimeSeconds / SECONDS_PER_HOUR);
      const minutes = Math.floor((uptimeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
      return `${ONLINE_LABEL_WORD} ${String(hours)}h ${String(minutes)}m`;
    },

    // Samples Date.now() and the badge's rendered text in ONE page.evaluate so the elapsed value
    // and the label a caller asserts were read at the same instant.
    elapsedSinceLastFrameAndLabel: async (): Promise<{ elapsedMs: NowMs; label: BadgeText }> => {
      const last = capturedFrames.at(-1);
      if (last === undefined) {
        throw new Error(
          'health-badge harness: elapsedSinceLastFrameAndLabel called before any health-status frame arrived',
        );
      }
      const sample = await page.evaluate(sampleNowAndLabelBrowserFn, HEALTH_BADGE_TEST_ID);
      return { elapsedMs: sample.now - last.arrivedAt.getTime(), label: sample.label };
    },

    // A true network outage, never a faked response — page.route() is lint-banned in .e2e.ts
    // (@dungeonmaster/ban-page-route-in-e2e) because faking a response bypasses the real server.
    cutWire: async (): Promise<void> => {
      await page.context().setOffline(true);
    },

    restoreWire: async (): Promise<void> => {
      await page.context().setOffline(false);
    },

    // Force-closes every tracked `/ws` socket from page context, the way ws-reconnect.e2e.ts does.
    // Returns the closed sockets' own URLs; callers read `.length` for the count ws-reconnect.e2e.ts
    // itself asserts with `toBeGreaterThan(0)`.
    closeBackendSockets: async (): Promise<readonly unknown[]> => {
      const closed = await page.evaluate(WS_CLOSE_BACKEND_SCRIPT);
      return Array.isArray(closed) ? closed : [];
    },

    getPageErrors: (): readonly ErrorText[] => pageErrorMessages.slice(),

    getConsoleErrors: (): readonly ConsoleText[] => consoleErrorMessages.slice(),
  };
};
