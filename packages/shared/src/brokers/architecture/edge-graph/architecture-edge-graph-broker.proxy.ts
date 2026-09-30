import { httpEdgesLayerBrokerProxy } from './http-edges-layer-broker.proxy';
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
    flowFiles: { path: string; source: ContentText }[];
    brokerFiles: { path: string; source: ContentText }[];
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
      flowFiles: { path: string; source: ContentText }[];
      brokerFiles: { path: string; source: ContentText }[];
    }): void => {
      httpProxy.setup({ serverStaticsSource, webStaticsSource, flowFiles, brokerFiles });
    },
  };
};
