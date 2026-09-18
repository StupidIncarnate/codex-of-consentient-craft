import { initScriptAddLayerAdapter } from './init-script-add-layer-adapter';
import { initScriptAddLayerAdapterProxy } from './init-script-add-layer-adapter.proxy';

describe('initScriptAddLayerAdapter', () => {
  it('VALID: {page, source} => calls page.addInitScript and returns success', async () => {
    const proxy = initScriptAddLayerAdapterProxy();
    const { page, getAddInitScriptCalls } = proxy.page();

    const result = await initScriptAddLayerAdapter({
      page,
      source: 'window.__injected = true;',
    });

    expect(getAddInitScriptCalls()).toStrictEqual([{ content: 'window.__injected = true;' }]);
    expect(result).toStrictEqual({ success: true });
  });
});
