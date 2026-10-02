import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { eslintIsPathIgnoredBroker } from './eslint-is-path-ignored-broker';
import { eslintIsPathIgnoredBrokerProxy } from './eslint-is-path-ignored-broker.proxy';

describe('eslintIsPathIgnoredBroker', () => {
  it('VALID: {cwd, filePath ignored by config} => returns true', async () => {
    const proxy = eslintIsPathIgnoredBrokerProxy();
    proxy.setIgnored({ filePath: 'smoke-repo/fixture.ts', ignored: true });

    const result = await eslintIsPathIgnoredBroker({
      cwd: '/project',
      filePath: 'smoke-repo/fixture.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {cwd, filePath not ignored} => returns false', async () => {
    const proxy = eslintIsPathIgnoredBrokerProxy();
    proxy.setIgnored({ filePath: 'src/file.ts', ignored: false });

    const result = await eslintIsPathIgnoredBroker({
      cwd: '/project',
      filePath: 'src/file.ts',
    });

    expect(result).toBe(false);
  });

  it('VALID: {cwd, filePath} => asks ESLint about the path resolved against that cwd', async () => {
    const proxy = eslintIsPathIgnoredBrokerProxy();
    proxy.setIgnored({ filePath: 'src/checked.ts', ignored: false });

    await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'src/checked.ts' });

    expect(proxy.getCheckedPathsFor({ filePath: 'src/checked.ts' })).toStrictEqual([
      ['src/checked.ts'],
    ]);
  });

  it('ERROR: {ESLint throws for a path outside cwd} => returns false so the hook still lints', async () => {
    const proxy = eslintIsPathIgnoredBrokerProxy();
    proxy.setLookupThrows({
      filePath: '/outside/x.ts',
      error: NativeErrorStub({ message: 'outside of base path' }),
    });

    const result = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: '/outside/x.ts' });

    expect(result).toBe(false);
  });
});
