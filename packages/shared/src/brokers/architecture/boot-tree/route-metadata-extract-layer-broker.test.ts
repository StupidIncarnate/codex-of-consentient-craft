import { routeMetadataExtractLayerBroker } from './route-metadata-extract-layer-broker';
import { routeMetadataExtractLayerBrokerProxy } from './route-metadata-extract-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('routeMetadataExtractLayerBroker', () => {
  describe('reads flow source and extracts routes', () => {
    it('VALID: {flow file with Route JSX} => returns metadata entries', () => {
      const proxy = routeMetadataExtractLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/flows/quest-chat/quest-chat-flow.tsx',
      });
      proxy.setupSource({
        content: ContentTextStub({
          value: `<Route path="/:guildSlug/quest" element={<AppQuestChatResponder />} />`,
        }),
      });
      const result = routeMetadataExtractLayerBroker({ flowFile });

      expect(result).toStrictEqual([
        {
          path: ContentTextStub({ value: '/:guildSlug/quest' }),
          responderSymbol: ContentTextStub({ value: 'AppQuestChatResponder' }),
        },
      ]);
    });
  });

  describe('missing source', () => {
    it('EMPTY: {flow file missing on disk} => returns empty array', () => {
      const proxy = routeMetadataExtractLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/flows/missing/missing-flow.tsx',
      });
      proxy.setupMissing();
      const result = routeMetadataExtractLayerBroker({ flowFile });

      expect(result).toStrictEqual([]);
    });
  });

  describe('non-router flow', () => {
    it('VALID: {flow file with no Route JSX} => returns empty array', () => {
      const proxy = routeMetadataExtractLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/cli/src/flows/cli/cli-flow.ts',
      });
      proxy.setupSource({
        content: ContentTextStub({
          value: `export const CliFlow = () => CliInitResponder();`,
        }),
      });
      const result = routeMetadataExtractLayerBroker({ flowFile });

      expect(result).toStrictEqual([]);
    });
  });
});
