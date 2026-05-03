import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { readStartupFileLayerBrokerProxy } from './read-startup-file-layer-broker.proxy';
import { subcommandsSectionRenderLayerBrokerProxy } from './subcommands-section-render-layer-broker.proxy';

export const architectureProjectMapHeadlineCliToolBrokerProxy = (): {
  setup: ({
    binName,
    startupFileName,
    startupSource,
  }: {
    binName: string;
    startupFileName: string;
    startupSource: ContentText;
  }) => void;
  setupEmpty: () => void;
  setupSingleBin: ({
    binName,
    startupFileName,
    startupSource,
  }: {
    binName: string;
    startupFileName: string;
    startupSource: ContentText;
  }) => void;
} => {
  const pkgJsonProxy = readPackageJsonLayerBrokerProxy();
  const startupProxy = readStartupFileLayerBrokerProxy();
  subcommandsSectionRenderLayerBrokerProxy();

  return {
    setup: ({
      binName,
      startupFileName,
      startupSource,
    }: {
      binName: string;
      startupFileName: string;
      startupSource: ContentText;
    }): void => {
      pkgJsonProxy.setupJson({ json: { bin: { [binName]: `./dist/bin/${binName}.js` } } });
      startupProxy.setup({ fileName: startupFileName, source: startupSource });
    },

    setupEmpty: (): void => {
      pkgJsonProxy.setupMissing();
      startupProxy.setupEmpty();
    },

    setupSingleBin: ({
      binName,
      startupFileName,
      startupSource,
    }: {
      binName: string;
      startupFileName: string;
      startupSource: ContentText;
    }): void => {
      pkgJsonProxy.setupJson({ json: { bin: { [binName]: `./dist/bin/${binName}.js` } } });
      startupProxy.setup({ fileName: startupFileName, source: startupSource });
    },
  };
};
