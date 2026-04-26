import { spawnOptionsSnapshotContract } from './spawn-options-snapshot-contract';
import { SpawnOptionsSnapshotStub } from './spawn-options-snapshot.stub';

describe('spawnOptionsSnapshotContract', (): void => {
  it('VALID: {default stub} => parses with empty env', (): void => {
    const opts = SpawnOptionsSnapshotStub();

    expect(opts).toStrictEqual({ env: {} });
  });

  it('VALID: {cwd + env} => parses with both', (): void => {
    const opts = spawnOptionsSnapshotContract.parse({
      cwd: '/abs/path',
      env: { FOO: 'bar' },
    });

    expect(opts).toStrictEqual({ cwd: '/abs/path', env: { FOO: 'bar' } });
  });

  it('VALID: {extra unknown keys} => preserved via passthrough', (): void => {
    const opts = spawnOptionsSnapshotContract.parse({ shell: '/bin/sh' });

    expect((opts as { shell?: unknown }).shell).toBe('/bin/sh');
  });

  it('VALID: {empty object} => parses', (): void => {
    const opts = spawnOptionsSnapshotContract.parse({});

    expect(opts.cwd).toBe(undefined);
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => spawnOptionsSnapshotContract.parse('foo')).toThrow(/Expected object/u);
  });
});
