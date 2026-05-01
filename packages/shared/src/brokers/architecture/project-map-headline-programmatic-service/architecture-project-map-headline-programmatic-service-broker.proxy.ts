import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { findStartupFileLayerBrokerProxy } from './find-startup-file-layer-broker.proxy';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { apiSectionRenderLayerBrokerProxy } from './api-section-render-layer-broker.proxy';
import { eventsSectionRenderLayerBrokerProxy } from './events-section-render-layer-broker.proxy';
import { stateWritesSectionRenderLayerBrokerProxy } from './state-writes-section-render-layer-broker.proxy';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';

export const architectureProjectMapHeadlineProgrammaticServiceBrokerProxy = (): {
  setup: ({
    startupFileName,
    startupSource,
    sourceFiles,
  }: {
    startupFileName: string;
    startupSource: ContentText;
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
  setupEmpty: () => void;
} => {
  const findStartupProxy = findStartupFileLayerBrokerProxy();
  const readProxy = readSourceLayerBrokerProxy();
  // Initialize child proxies for enforce-proxy-child-creation compliance.
  // api and exemplar sections have no I/O boundaries to mock at the parent level.
  apiSectionRenderLayerBrokerProxy();
  const eventsProxy = eventsSectionRenderLayerBrokerProxy();
  const stateProxy = stateWritesSectionRenderLayerBrokerProxy();
  exemplarSectionRenderLayerBrokerProxy();

  return {
    setup: ({
      startupFileName,
      startupSource,
      sourceFiles,
    }: {
      startupFileName: string;
      startupSource: ContentText;
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      // Setup startup file discovery
      findStartupProxy.setupStartupFiles({ names: [startupFileName] });

      // Build unified file map: startup source + other source files
      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const f of sourceFiles) {
        fileMap.set(f.path, f.source);
      }

      const unifiedFn = (filePath: ContentText): ContentText => {
        const pathStr = String(filePath);
        if (pathStr.endsWith(startupFileName)) {
          return startupSource;
        }
        for (const [key, source] of fileMap) {
          if (String(key) === pathStr) {
            return source;
          }
        }
        return ContentTextStub({ value: '' });
      };

      // Events section: set up file listing and read first, then override with unified fn last
      eventsProxy.setup({ sourceFiles });

      // Wire all read-source calls through the unified implementation (must come after
      // eventsProxy.setup so the unified fn wins for the startup file path)
      readProxy.setupImplementation({ fn: unifiedFn });
      eventsProxy.setupImplementation({ fn: unifiedFn });
    },

    setupEmpty: (): void => {
      findStartupProxy.setupStartupFiles({ names: [] });
      eventsProxy.setupEmpty();
      stateProxy.setupEmpty();
    },
  };
};
