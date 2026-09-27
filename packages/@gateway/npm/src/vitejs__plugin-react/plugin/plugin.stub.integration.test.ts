import { VitePluginReactStub } from './plugin.stub';

describe('VitePluginReactStub', () => {
  it('VALID: {} => the real two Vite plugins the factory produces, in their real names', () => {
    const plugins = VitePluginReactStub();

    expect(plugins.map((plugin) => plugin.name)).toStrictEqual([
      'vite:react-babel',
      'vite:react-refresh',
    ]);
  });
});
