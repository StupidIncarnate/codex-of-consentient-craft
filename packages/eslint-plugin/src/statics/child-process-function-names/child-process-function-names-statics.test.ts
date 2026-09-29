import { childProcessFunctionNamesStatics } from './child-process-function-names-statics';

describe('childProcessFunctionNamesStatics', () => {
  it('VALID: {} => names the gateway, raw, and single-string-raw process-start functions', () => {
    expect(childProcessFunctionNamesStatics).toStrictEqual({
      gatewayFunctionNames: [
        'run',
        'runSync',
        'runSyncWithInput',
        'stream',
        'streamLines',
        'spawnDetached',
        'spawnLongLived',
        'spawnLive',
        'spawnPiped',
        'runFireAndForget',
      ],
      rawFunctionNames: ['spawn', 'exec', 'execSync', 'execFile', 'execFileSync', 'spawnSync'],
      singleStringRawFunctionNames: ['exec', 'execSync'],
    });
  });
});
