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
  });
});
