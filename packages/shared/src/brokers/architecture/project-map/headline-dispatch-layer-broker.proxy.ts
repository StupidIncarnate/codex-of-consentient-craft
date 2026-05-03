import { architectureProjectMapHeadlineLibraryBrokerProxy } from '../project-map-headline-library/architecture-project-map-headline-library-broker.proxy';
import { architectureProjectMapHeadlineEslintPluginBrokerProxy } from '../project-map-headline-eslint-plugin/architecture-project-map-headline-eslint-plugin-broker.proxy';
import { architectureProjectMapHeadlineHttpBackendBrokerProxy } from '../project-map-headline-http-backend/architecture-project-map-headline-http-backend-broker.proxy';
import { architectureProjectMapHeadlineMcpServerBrokerProxy } from '../project-map-headline-mcp-server/architecture-project-map-headline-mcp-server-broker.proxy';
import { architectureProjectMapHeadlineCliToolBrokerProxy } from '../project-map-headline-cli-tool/architecture-project-map-headline-cli-tool-broker.proxy';
import { architectureProjectMapHeadlineHookHandlersBrokerProxy } from '../project-map-headline-hook-handlers/architecture-project-map-headline-hook-handlers-broker.proxy';
import { architectureProjectMapHeadlineFrontendReactBrokerProxy } from '../project-map-headline-frontend-react/architecture-project-map-headline-frontend-react-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const headlineDispatchLayerBrokerProxy = (): {
  setupForLibrary: () => void;
  setupForEslintPlugin: () => void;
  setupForHttpBackend: () => void;
} => {
  const libraryProxy = architectureProjectMapHeadlineLibraryBrokerProxy();
  const eslintProxy = architectureProjectMapHeadlineEslintPluginBrokerProxy();
  const httpBackendProxy = architectureProjectMapHeadlineHttpBackendBrokerProxy();
  architectureProjectMapHeadlineMcpServerBrokerProxy();
  architectureProjectMapHeadlineCliToolBrokerProxy();
  architectureProjectMapHeadlineHookHandlersBrokerProxy();
  architectureProjectMapHeadlineFrontendReactBrokerProxy();

  return {
    setupForLibrary: (): void => {
      libraryProxy.setup({
        packageJsonContent: ContentTextStub({ value: '{}' }),
        barrelFileCounts: [],
        staticsFolderNames: [],
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
        packages: [],
        sourceFiles: [],
      });
    },

    setupForEslintPlugin: (): void => {
      eslintProxy.setup({
        startupSource: undefined,
      });
    },

    setupForHttpBackend: (): void => {
      httpBackendProxy.setup({
        serverStaticsSource: ContentTextStub({ value: '' }),
        webStaticsSource: ContentTextStub({ value: '' }),
        flowFiles: [],
        responderFiles: [],
        adapterFiles: [],
      });
    },
  };
};
