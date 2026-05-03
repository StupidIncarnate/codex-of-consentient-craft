import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { hooksSectionRenderLayerBrokerProxy } from './hooks-section-render-layer-broker.proxy';

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
  const hooksSectionProxy = hooksSectionRenderLayerBrokerProxy();

  return {
    setupMultiBin: ({
      binEntries,
      startupSource,
    }: {
      binEntries: Record<string, string>;
      startupSource: ContentText;
    }): void => {
      pkgJsonProxy.setupJson({ json: { bin: binEntries } });
      hooksSectionProxy.setupImplementation({ fn: () => startupSource });
    },

    setupEmpty: (): void => {
      pkgJsonProxy.setupMissing();
    },
  };
};
