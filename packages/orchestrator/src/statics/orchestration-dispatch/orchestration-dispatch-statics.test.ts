import { orchestrationDispatchStatics } from './orchestration-dispatch-statics';

describe('orchestrationDispatchStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(orchestrationDispatchStatics).toStrictEqual({
      mcpHeartbeatTtlMs: 300_000,
      loop: {
        longPollTotalMs: 2_000,
        longPollIntervalMs: 500,
      },
      processIdPrefix: 'node-dispatch',
      exclusivity: {
        mcpIdleReason:
          'Node dispatcher is playing — pause it on the /queue page before driving quests with /dumpster-launch.',
        heartbeatRefusalReason:
          'A /dumpster-launch loop polled get-next-step within the last 5 minutes — stop it (or wait for it to go quiet) before playing the Node dispatcher, or retry with force.',
        inFlightRefusalReason:
          'A /dumpster-launch-dispatched agent is still in flight — wait for it to finish before playing the Node dispatcher, or retry with force.',
      },
    });
  });
});
