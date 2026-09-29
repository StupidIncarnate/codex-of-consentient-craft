import type { UserConfig } from './vite';
import { ViteUserConfigStub } from './user-config/user-config.stub';

describe('#gateway/npm/vite', () => {
  it('VALID: {UserConfig} => types a config carrying vite server options', () => {
    const config: UserConfig = {
      ...ViteUserConfigStub({ cacheDir: 'node_modules/.vite-40000' }),
      server: { port: 40001, hmr: false, watch: null },
    };

    expect(config).toStrictEqual({
      cacheDir: 'node_modules/.vite-40000',
      server: { port: 40001, hmr: false, watch: null },
    });
  });
});
