import { pointerFooterRenderLayerBroker } from './pointer-footer-render-layer-broker';
import { pointerFooterRenderLayerBrokerProxy } from './pointer-footer-render-layer-broker.proxy';

describe('pointerFooterRenderLayerBroker', () => {
  it('VALID: {} => returns pointer footer text', () => {
    pointerFooterRenderLayerBrokerProxy();
    const result = pointerFooterRenderLayerBroker();

    expect(result).toStrictEqual(
      '> Call `get-project-inventory({ packageName })` for the per-package folder/file detail.',
    );
  });
});
