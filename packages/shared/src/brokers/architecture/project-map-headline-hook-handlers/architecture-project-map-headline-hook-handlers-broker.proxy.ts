import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { hooksSectionRenderLayerBrokerProxy } from './hooks-section-render-layer-broker.proxy';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';

export const architectureProjectMapHeadlineHookHandlersBrokerProxy = (): {
  setupMultiBin: ({
    binEntries,
    startupSource,
  }: {
    binEntries: Record<string, string>;
    startupSource: ContentText;
  }) => void;
  setupEmpty: () => void;
} => {
  const pkgJsonProxy = readPackageJsonLayerBrokerProxy();
  const readSourceProxy = readSourceLayerBrokerProxy();
  const hooksSectionProxy = hooksSectionRenderLayerBrokerProxy();
  const exemplarProxy = exemplarSectionRenderLayerBrokerProxy();

  return {
    setupMultiBin: ({
      binEntries,
      startupSource,
    }: {
      binEntries: Record<string, string>;
      startupSource: ContentText;
    }): void => {
      pkgJsonProxy.setupJson({ json: { bin: binEntries } });
      readSourceProxy.setupMissing();
      hooksSectionProxy.setupImplementation({ fn: () => startupSource });
      exemplarProxy.setupImplementation({ fn: () => startupSource });
    },

    setupEmpty: (): void => {
      pkgJsonProxy.setupMissing();
    },
  };
};
