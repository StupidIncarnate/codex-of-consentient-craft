import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { readStartupFileLayerBrokerProxy } from './read-startup-file-layer-broker.proxy';
import { subcommandsSectionRenderLayerBrokerProxy } from './subcommands-section-render-layer-broker.proxy';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';

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
  const exemplarProxy = exemplarSectionRenderLayerBrokerProxy();

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
      exemplarProxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });
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
      exemplarProxy.setupImplementation({ fn: () => ContentTextStub({ value: '' }) });
    },
  };
};
