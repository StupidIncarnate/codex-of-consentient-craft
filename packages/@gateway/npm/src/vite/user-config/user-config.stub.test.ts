import { ViteUserConfigStub } from './user-config.stub';

describe('ViteUserConfigStub', () => {
  it('VALID: {} => defaults cacheDir to node_modules/.vite', () => {
    expect(ViteUserConfigStub()).toStrictEqual({ cacheDir: 'node_modules/.vite' });
  });

  it('VALID: {cacheDir} => carries it through unchanged', () => {
    expect(ViteUserConfigStub({ cacheDir: 'node_modules/.vite-40001' })).toStrictEqual({
      cacheDir: 'node_modules/.vite-40001',
    });
  });
});
