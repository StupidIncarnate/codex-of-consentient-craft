import { viewportSetLayerAdapter } from './viewport-set-layer-adapter';
import { viewportSetLayerAdapterProxy } from './viewport-set-layer-adapter.proxy';

describe('viewportSetLayerAdapter', () => {
  it('VALID: {page, width: 1280, height: 720} => calls page.setViewportSize and returns success', async () => {
    const proxy = viewportSetLayerAdapterProxy();
    const { page, getSetViewportSizeCalls } = proxy.page();

    const result = await viewportSetLayerAdapter({ page, width: 1280, height: 720 });

    expect(getSetViewportSizeCalls()).toStrictEqual([{ width: 1280, height: 720 }]);
    expect(result).toStrictEqual({ success: true });
  });
});
