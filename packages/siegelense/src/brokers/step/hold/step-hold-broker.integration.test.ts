import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { playwrightSessionAdapter } from '../../../adapters/playwright/session/playwright-session-adapter';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { stepHoldBroker } from './step-hold-broker';

const BASE_URL = 'http://localhost';
const BROWSER_TIMEOUT_MS = 90_000;

// Two frames per hold, not more: under jest one full-viewport pixel comparison costs about 5s
// (measured 4.8s, against 0.3s for the same broker under plain node), so each extra frame pushes a
// test past ward's integration bar without proving anything a single pair does not.

const TICK_AREA_PAGE =
  '<!doctype html><html><body style="background:#111;color:#eee;font-size:32px"><div id="area"></div></body></html>';

// The DEF-143 repro: an eval starts a timer rewriting one small text node every 400ms. On a
// 1280x720 capture a text change like this moves about 0.1% of the pixels, which a whole-percent
// reading rounds to 0%. Started AFTER `goto` rather than from an inline script, because `goto`
// waits for the page to settle and a page ticking from load never does.
const START_TICKING_SOURCE =
  'window.ticks=0;setInterval(()=>{window.ticks+=1;document.getElementById("area").textContent="tick "+window.ticks},400);"started"';

const STILL_PAGE =
  '<!doctype html><html><body style="background:#111;color:#eee;font-size:32px"><div>still</div></body></html>';

const TICK_AREA_URL = `data:text/html,${encodeURIComponent(TICK_AREA_PAGE)}`;
const STILL_URL = `data:text/html,${encodeURIComponent(STILL_PAGE)}`;

describe('stepHoldBroker against a real Chromium', () => {
  it(
    'VALID: {a timer rewriting a text node every 400ms, 2 frames 1000ms apart} => frame 2 differs from frame 1 and is named',
    async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'step-hold-ticking' }),
      });
      const evidencePath = AbsoluteFilePathStub({ value: testbed.guildPath });
      const session = await playwrightSessionAdapter({ baseUrl: BASE_URL, evidencePath });
      await session.goto({ url: TICK_AREA_URL });
      const started = await session.evaluateSource({ source: START_TICKING_SOURCE });

      const rendered = await stepHoldBroker({
        lane: LaneSessionStub({ evidencePath }),
        session,
        index: StepIndexStub({ value: 2 }),
        shotPath: null,
        frames: 2,
        everyMs: 1000,
      });
      const areaText = await session.evaluateSource({
        source: 'document.getElementById("area").textContent',
      });
      await session.close();
      testbed.cleanup();

      expect(JSON.parse(rendered)).toStrictEqual({
        frames: 2,
        differing: 1,
        changed: [2],
        reading: 'still changing at 1s — these frames differ from the one before: 2',
        shots: [`${testbed.guildPath}/step2_frame1.png`, `${testbed.guildPath}/step2_frame2.png`],
      });
      expect(started).toBe('"started"');
      expect(areaText).toMatch(/^"tick \d+"$/u);
    },
    BROWSER_TIMEOUT_MS,
  );

  it(
    'VALID: {a page nothing rewrites, 2 frames 500ms apart} => no frame differs',
    async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'step-hold-still' }),
      });
      const evidencePath = AbsoluteFilePathStub({ value: testbed.guildPath });
      const session = await playwrightSessionAdapter({ baseUrl: BASE_URL, evidencePath });
      await session.goto({ url: STILL_URL });

      const rendered = await stepHoldBroker({
        lane: LaneSessionStub({ evidencePath }),
        session,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        frames: 2,
        everyMs: 500,
      });
      await session.close();
      testbed.cleanup();

      expect(JSON.parse(rendered)).toStrictEqual({
        frames: 2,
        differing: 0,
        changed: [],
        reading: 'NOTHING CHANGED across 0.5s',
        shots: [`${testbed.guildPath}/step1_frame1.png`, `${testbed.guildPath}/step1_frame2.png`],
      });
    },
    BROWSER_TIMEOUT_MS,
  );
});
