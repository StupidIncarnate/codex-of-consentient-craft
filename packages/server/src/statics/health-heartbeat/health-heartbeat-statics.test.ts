import { healthHeartbeatStatics } from './health-heartbeat-statics';

describe('healthHeartbeatStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(healthHeartbeatStatics).toStrictEqual({
      broadcast: {
        intervalMs: 5000,
      },
    });
  });
});
