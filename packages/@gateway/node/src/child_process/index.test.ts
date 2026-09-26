import * as ourModule from './index';

describe('@dungeonmaster/node/child_process', () => {
  it('VALID: {module} => exports exactly the curated wrappers, no raw spawn/exec/execSync', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'RunNotFoundError',
      'run',
      'runFireAndForget',
      'runSync',
      'spawnDetached',
      'spawnLive',
      'spawnLongLived',
      'stream',
      'streamLines',
    ]);
  });
});
