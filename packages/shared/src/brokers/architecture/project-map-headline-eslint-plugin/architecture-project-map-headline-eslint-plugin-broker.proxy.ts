import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { configPresetsSectionRenderLayerBrokerProxy } from './config-presets-section-render-layer-broker.proxy';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';

export const architectureProjectMapHeadlineEslintPluginBrokerProxy = (): {
  setup: ({ startupSource }: { startupSource: ContentText | undefined }) => void;
} => {
  configPresetsSectionRenderLayerBrokerProxy();
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setup: ({ startupSource }: { startupSource: ContentText | undefined }): void => {
      const unifiedRead = (_filePath: ContentText): ContentText =>
        startupSource ?? ContentTextStub({ value: '' });

      readProxy.setupImplementation({ fn: unifiedRead });
    },
  };
};
