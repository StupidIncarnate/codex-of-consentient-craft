import { edgesFooterRenderLayerBroker } from './edges-footer-render-layer-broker';
import { edgesFooterRenderLayerBrokerProxy } from './edges-footer-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

describe('edgesFooterRenderLayerBroker', () => {
  describe('no edges', () => {
    it('EMPTY: {no flow or broker files} => returns EDGES footer with zero counts', () => {
      const proxy = edgesFooterRenderLayerBrokerProxy();
      proxy.setupEmpty();

      const result = edgesFooterRenderLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: '## EDGES\n\n```\nHTTP edges (paired): 0\nHTTP edges (orphan): 0\n```',
        }),
      );
    });
  });

  describe('unpaired server routes', () => {
    it('VALID: {server routes with no web callers} => returns EDGES footer with orphan count', () => {
      const proxy = edgesFooterRenderLayerBrokerProxy();
      proxy.setupWithOrphanEdges();

      const result = edgesFooterRenderLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual(
        ContentTextStub({
          value: '## EDGES\n\n```\nHTTP edges (paired): 0\nHTTP edges (orphan): 2\n```',
        }),
      );
    });
  });
});
