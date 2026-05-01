import { httpEdgesLayerBrokerProxy } from './http-edges-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureEdgeGraphBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    brokerFiles,
  }: {
    serverStaticsSource: ContentText;
    webStaticsSource: ContentText;
    flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    brokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const httpProxy = httpEdgesLayerBrokerProxy();

  return {
    setup: ({
      serverStaticsSource,
      webStaticsSource,
      flowFiles,
      brokerFiles,
    }: {
      serverStaticsSource: ContentText;
      webStaticsSource: ContentText;
      flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
      brokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      httpProxy.setup({ serverStaticsSource, webStaticsSource, flowFiles, brokerFiles });
    },
  };
};
