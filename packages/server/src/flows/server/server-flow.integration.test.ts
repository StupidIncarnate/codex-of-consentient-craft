// serverWsHarness mocks NOTHING: it boots this file's own ServerFlow fully real and finds the
// listener it bound by scanning `process._getActiveHandles()`. Import order carries no weight
// here — see the harness's own header for why no transport interception is possible from a
// `.harness.ts` at all.
import { serverWsHarness } from '../../../test/harnesses/server-ws/server-ws.harness';
import { ServerFlow } from './server-flow';

import {
  HealthStatusPayloadStub,
  OrchestrationEventTypeStub,
  QuestIdStub,
  WsMessageStub,
} from '@dungeonmaster/shared/contracts';

describe('ServerFlow', () => {
  it('VALID: {export} => ServerFlow is a function', () => {
    expect(ServerFlow).toStrictEqual(expect.any(Function));
  });

  // Flow: health-badge, nodes #subscribe-heartbeat -> #server-emits -> #relay-broadcast. Boots
  // the REAL ServerInitResponder (via ServerFlow) on a REAL listening server and completes a REAL
  // `/ws` upgrade — every other coverage of this path replaces both npm transports, so nothing
  // else in the repo proves the heartbeat reaches an actual client socket.
  describe('health-status heartbeat over a real /ws upgrade', () => {
    const serverWs = serverWsHarness();

    it('VALID: {two real clients, one silent and one subscribed to a nonexistent quest} => both receive the identical health-status frame', async () => {
      await serverWs.start();

      // Client A: completes the upgrade and sends NOTHING. Proves check-client-in-broadcast-set
      // — the heartbeat must reach a socket that never subscribed to anything.
      const silentClient = await serverWs.openClient();
      // Client B: sends subscribe-quest for a quest that does not exist on disk. Hostile on
      // purpose — a fan-out that consulted clientSubscriptions for health-status would then
      // deliver to NEITHER client, and the comparison below would red instead of passing by
      // accident.
      const subscribedClient = await serverWs.openClient();
      subscribedClient.send(
        JSON.stringify({
          type: 'subscribe-quest',
          questId: QuestIdStub({ value: 'health-badge-nonexistent-quest' }),
        }),
      );

      const [silentFrame, subscribedFrame] = await Promise.all([
        silentClient.waitForHealthStatusFrame({ timeoutMs: 15000 }),
        subscribedClient.waitForHealthStatusFrame({ timeoutMs: 15000 }),
      ]);

      // uptimeSeconds/version are read live off the real process and cannot be pinned to a
      // literal; echoing them back off the silent client's own frame pins the SHAPE (exactly
      // these three payload keys) and the LITERAL type/status, while the comparison against
      // the subscribed client's frame is what actually proves the fan-out delivered the SAME
      // frame to both.
      const expectedFrame = WsMessageStub({
        type: OrchestrationEventTypeStub({ value: 'health-status' }),
        payload: HealthStatusPayloadStub({
          uptimeSeconds: silentFrame.payload.uptimeSeconds,
          version: silentFrame.payload.version,
        }),
        timestamp: silentFrame.timestamp,
      });

      expect([silentFrame, subscribedFrame]).toStrictEqual([expectedFrame, expectedFrame]);
    }, 20000);

    it('VALID: {one real client, silent, held open across the emit interval} => collects three health-status frames spaced ten seconds apart, each with a strictly higher uptime, and an unstripped wire envelope', async () => {
      await serverWs.start();

      // A single SILENT client: sending anything (e.g. subscribe-quest) earns a reply frame of
      // its own before any heartbeat, which would break check-frame-crosses-wire's "nothing but
      // three health-status messages" assertion below (NOTES 6).
      const client = await serverWs.openClient();

      // `waitForHealthStatusFrames` hands back the exact snapshot it held the instant the
      // third health-status frame existed — every assertion below reads THAT snapshot, never a
      // fresh call to the client, so a fourth heartbeat landing after the wait cannot inflate
      // what these assertions see (hazard d).
      const records = await client.waitForHealthStatusFrames({ count: 3, timeoutMs: 35000 });
      // noUncheckedIndexedAccess makes every index read `T | undefined`; `!` is how this repo's
      // own test files assert an index a prior wait already proved exists (e.g.
      // mcp-server-flow.integration.test.ts's `firstContent!.text`) — the ESLint config turns
      // `no-non-null-assertion` off for `**/*.test.ts` for exactly this.
      const first = records[0]!;
      const second = records[1]!;
      const third = records[2]!;

      // health-badge:observable:check-emit-interval — the whole-second gaps between the three
      // RECORDED ARRIVAL instants are exactly ten seconds each, read off `arrivedAt` (never off
      // each frame's own server-stamped `timestamp`, which a batched flush would satisfy —
      // DECISIONS).
      expect([
        Math.round((second.arrivedAt.getTime() - first.arrivedAt.getTime()) / 1000),
        Math.round((third.arrivedAt.getTime() - second.arrivedAt.getTime()) / 1000),
      ]).toStrictEqual([10, 10]);

      // health-badge:observable:check-emit-payload-advances — each frame's raw text,
      // JSON.parsed and compared WHOLE against exactly {type, payload, timestamp} built from
      // that frame's own live uptime/version (neither can be pinned to a literal), proves the
      // payload carries exactly {status, uptimeSeconds, version} and nothing else; the second
      // half is uptimeSeconds strictly increasing frame over frame with no fixed delta —
      // Math.floor(process.uptime()) across a 10 000ms interval can land on 9, 10 or 11
      // depending on where the ticks fall inside a second (DECISIONS).
      const firstRaw: unknown = JSON.parse(first.raw);
      const secondRaw: unknown = JSON.parse(second.raw);
      const thirdRaw: unknown = JSON.parse(third.raw);

      expect(firstRaw).toStrictEqual(
        WsMessageStub({
          type: OrchestrationEventTypeStub({ value: 'health-status' }),
          payload: HealthStatusPayloadStub({
            uptimeSeconds: first.parsed.payload.uptimeSeconds,
            version: first.parsed.payload.version,
          }),
          timestamp: first.parsed.timestamp,
        }),
      );
      expect(secondRaw).toStrictEqual(
        WsMessageStub({
          type: OrchestrationEventTypeStub({ value: 'health-status' }),
          payload: HealthStatusPayloadStub({
            uptimeSeconds: second.parsed.payload.uptimeSeconds,
            version: second.parsed.payload.version,
          }),
          timestamp: second.parsed.timestamp,
        }),
      );
      expect(thirdRaw).toStrictEqual(
        WsMessageStub({
          type: OrchestrationEventTypeStub({ value: 'health-status' }),
          payload: HealthStatusPayloadStub({
            uptimeSeconds: third.parsed.payload.uptimeSeconds,
            version: third.parsed.payload.version,
          }),
          timestamp: third.parsed.timestamp,
        }),
      );
      expect([
        second.parsed.payload.uptimeSeconds > first.parsed.payload.uptimeSeconds,
        third.parsed.payload.uptimeSeconds > second.parsed.payload.uptimeSeconds,
      ]).toStrictEqual([true, true]);

      // health-badge:observable:check-frame-crosses-wire — the three whole-envelope
      // comparisons above already prove the RAW text carries exactly {type, payload,
      // timestamp}; what remains is the transport-level half: every message reached this
      // client as a non-binary text frame, and — since both comparisons below are against the
      // WHOLE `records` array rather than three plucked entries — it received nothing but these
      // three health-status messages, no fourth member either way.
      expect(records.map((record) => record.isBinary)).toStrictEqual([false, false, false]);
      expect(records.map((record) => record.parsed.type)).toStrictEqual([
        'health-status',
        'health-status',
        'health-status',
      ]);
    }, 60000);
  });
});
