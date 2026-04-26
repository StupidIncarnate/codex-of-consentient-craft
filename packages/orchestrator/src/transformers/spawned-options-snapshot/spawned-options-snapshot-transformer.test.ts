import { SpawnOptionsSnapshotStub } from '../../contracts/spawn-options-snapshot/spawn-options-snapshot.stub';
import { spawnedOptionsSnapshotTransformer } from './spawned-options-snapshot-transformer';

describe('spawnedOptionsSnapshotTransformer', (): void => {
  it('VALID: {default stub passthrough} => returns parsed snapshot with empty env', (): void => {
    const result = spawnedOptionsSnapshotTransformer({ rawOptions: SpawnOptionsSnapshotStub() });

    expect(result).toStrictEqual({ env: {} });
  });

  it('VALID: {raw cwd + env} => narrows fields', (): void => {
    const result = spawnedOptionsSnapshotTransformer({
      rawOptions: { cwd: '/abs/path', env: { FOO: 'bar' } },
    });

    expect(result).toStrictEqual({ cwd: '/abs/path', env: { FOO: 'bar' } });
  });

  it('EMPTY: {invalid input} => returns empty snapshot', (): void => {
    const result = spawnedOptionsSnapshotTransformer({ rawOptions: 'not-an-object' });

    expect(result).toStrictEqual({});
  });
});
