import { healthBadgeStatics } from './health-badge-statics';

describe('healthBadgeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(healthBadgeStatics).toStrictEqual({
      online: 'ONLINE',
      degraded: 'DEGRADED',
      offline: 'OFFLINE',
      checking: 'CHECKING',
      testId: 'HEALTH_BADGE',
      silenceThresholdMs: 30000,
      silenceTickMs: 1000,
      offlineTitleUnreachable: 'No response from server',
      offlineTitleServerError: 'Server returned',
      offlineTitleSilence: 'No heartbeat for 30 seconds',
    });
  });
});
