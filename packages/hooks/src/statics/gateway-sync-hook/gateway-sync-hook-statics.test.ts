import { gatewaySyncHookStatics } from './gateway-sync-hook-statics';

describe('gatewaySyncHookStatics', () => {
  it('VALID: exported value => names the sync command, the hook entry and the time limits', () => {
    expect(gatewaySyncHookStatics).toStrictEqual({
      command: {
        name: 'dungeonmaster',
        args: ['gateway-sync'],
        display: 'dungeonmaster gateway-sync',
      },
      hook: {
        matcher: 'Bash',
        bin: 'dungeonmaster-post-bash',
        settingsTimeoutSeconds: 300,
      },
      limits: {
        runTimeoutMs: 280_000,
      },
    });
  });
});
