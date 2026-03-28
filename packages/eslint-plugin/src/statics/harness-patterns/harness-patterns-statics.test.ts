import { harnessPatternsStatics } from './harness-patterns-statics';

describe('harnessPatternsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(harnessPatternsStatics).toStrictEqual({
      bannedNodeBuiltins: [
        'fs',
        'fs/promises',
        'path',
        'os',
        'child_process',
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:os',
        'node:child_process',
      ],
    });
  });
});
