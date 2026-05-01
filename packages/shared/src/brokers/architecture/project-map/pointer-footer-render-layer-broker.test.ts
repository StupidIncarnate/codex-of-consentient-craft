import { pointerFooterRenderLayerBroker } from './pointer-footer-render-layer-broker';
import { pointerFooterRenderLayerBrokerProxy } from './pointer-footer-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('pointerFooterRenderLayerBroker', () => {
  it('VALID: {} => returns pointer footer text', () => {
    pointerFooterRenderLayerBrokerProxy();
    const result = pointerFooterRenderLayerBroker();

    expect(result).toStrictEqual(
      ContentTextStub({
        value:
          '> Call `get-project-inventory({ packageName })` for the per-package folder/file detail.',
      }),
    );
  });
});
