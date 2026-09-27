import * as ourModule from './child_process';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto a CJS
// module, and comparing against that synthetic shape would add a key the barrel never exports.
import pkgModule = require('child_process');

const OUR_WRAPPERS = [
  'RunNotFoundError',
  'run',
  'runFireAndForget',
  'runSync',
  'spawnDetached',
  'spawnLive',
  'spawnLongLived',
  'stream',
  'streamLines',
] as const;

describe('#gateway/node/child_process', () => {
  it('VALID: {module} => exports every raw child_process export plus the curated wrappers', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(
      [...new Set([...Object.keys(pkgModule), ...OUR_WRAPPERS])].sort(),
    );
  });
});
