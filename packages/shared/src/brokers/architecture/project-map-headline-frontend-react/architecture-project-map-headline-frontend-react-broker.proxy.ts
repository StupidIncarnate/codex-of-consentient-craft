import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { architectureWidgetTreeBrokerProxy } from '../widget-tree/architecture-widget-tree-broker.proxy';
import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { architectureStateWritesBrokerProxy } from '../state-writes/architecture-state-writes-broker.proxy';
import { widgetTreeSectionRenderLayerBrokerProxy } from './widget-tree-section-render-layer-broker.proxy';
import { widgetHubsSectionRenderLayerBrokerProxy } from './widget-hubs-section-render-layer-broker.proxy';
import { widgetExemplarSectionRenderLayerBrokerProxy } from './widget-exemplar-section-render-layer-broker.proxy';

export const architectureProjectMapHeadlineFrontendReactBrokerProxy = (): {
  setup: ({
    widgetFilePaths,
    widgetSources,
    responderFilePaths,
    responderContents,
    flowFilePaths,
    flowContents,
    serverStaticsSource,
    webStaticsSource,
    httpFlowFiles,
    httpBrokerFiles,
    sourceFilePaths,
    sourceContents,
    stateDirNames,
  }: {
    widgetFilePaths: AbsoluteFilePath[];
    widgetSources: ContentText[];
    responderFilePaths: AbsoluteFilePath[];
    responderContents: ContentText[];
    flowFilePaths: AbsoluteFilePath[];
    flowContents: ContentText[];
    serverStaticsSource: ContentText;
    webStaticsSource: ContentText;
    httpFlowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    httpBrokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
    sourceFilePaths: AbsoluteFilePath[];
    sourceContents: ContentText[];
    stateDirNames: string[];
  }) => void;
  setupEmpty: () => void;
} => {
  const widgetTreeProxy = architectureWidgetTreeBrokerProxy();
  const edgeGraphProxy = architectureEdgeGraphBrokerProxy();
  const stateWritesProxy = architectureStateWritesBrokerProxy();
  widgetTreeSectionRenderLayerBrokerProxy();
  widgetHubsSectionRenderLayerBrokerProxy();
  widgetExemplarSectionRenderLayerBrokerProxy();

  return {
    setup: ({
      widgetFilePaths,
      widgetSources,
      responderFilePaths,
      responderContents,
      flowFilePaths,
      flowContents,
      serverStaticsSource,
      webStaticsSource,
      httpFlowFiles,
      httpBrokerFiles,
      sourceFilePaths,
      sourceContents,
      stateDirNames,
    }: {
      widgetFilePaths: AbsoluteFilePath[];
      widgetSources: ContentText[];
      responderFilePaths: AbsoluteFilePath[];
      responderContents: ContentText[];
      flowFilePaths: AbsoluteFilePath[];
      flowContents: ContentText[];
      serverStaticsSource: ContentText;
      webStaticsSource: ContentText;
      httpFlowFiles: { path: AbsoluteFilePath; source: ContentText }[];
      httpBrokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
      sourceFilePaths: AbsoluteFilePath[];
      sourceContents: ContentText[];
      stateDirNames: string[];
    }): void => {
      widgetTreeProxy.setupPackage({
        widgetFilePaths,
        widgetSources,
        responderFilePaths,
        responderContents,
        flowFilePaths,
        flowContents,
      });

      edgeGraphProxy.setup({
        serverStaticsSource,
        webStaticsSource,
        flowFiles: httpFlowFiles,
        brokerFiles: httpBrokerFiles,
      });

      // Only set up state-writes when there is real data to provide.
      // When sourceFilePaths and stateDirNames are empty, the edge-graph
      // virtualTreeFn already returns [] for unknown src/state paths, so
      // queuing empty once-values would conflict with edge-graph's readdir slots.
      if (sourceFilePaths.length > 0 || stateDirNames.length > 0) {
        stateWritesProxy.setupSourceFiles({
          filePaths: sourceFilePaths,
          contents: sourceContents,
          stateDirNames,
        });
      }
    },

    setupEmpty: (): void => {
      widgetTreeProxy.setupEmpty();

      // Edge graph: no flows or brokers — provide empty statics so file reads return empty.
      // State-writes is intentionally omitted: the edge-graph virtualTreeFn returns [] for
      // unknown src/state paths, providing the same empty result without queuing once-values
      // that would conflict with edge-graph readdir slots.
      edgeGraphProxy.setup({
        serverStaticsSource: ContentTextStub({ value: '' }),
        webStaticsSource: ContentTextStub({ value: '' }),
        flowFiles: [],
        brokerFiles: [],
      });
    },
  };
};
