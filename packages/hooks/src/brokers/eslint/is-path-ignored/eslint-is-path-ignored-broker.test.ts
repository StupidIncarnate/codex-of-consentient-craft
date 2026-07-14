import { eslintIsPathIgnoredBroker } from './eslint-is-path-ignored-broker';
import { eslintIsPathIgnoredBrokerProxy } from './eslint-is-path-ignored-broker.proxy';

describe('eslintIsPathIgnoredBroker', () => {
  it('VALID: {cwd, filePath ignored by config} => returns true', async () => {
    const proxy = eslintIsPathIgnoredBrokerProxy();
    proxy.setIgnored({ ignored: true });

    const result = await eslintIsPathIgnoredBroker({
      cwd: '/project',
      filePath: 'smoke-repo/fixture.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {cwd, filePath not ignored} => returns false', async () => {
    const proxy = eslintIsPathIgnoredBrokerProxy();
    proxy.setIgnored({ ignored: false });

    const result = await eslintIsPathIgnoredBroker({
      cwd: '/project',
      filePath: 'src/file.ts',
    });

    expect(result).toBe(false);
  });
});
