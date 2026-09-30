import { httpEdgesLayerBrokerProxy } from './http-edges-layer-broker.proxy';

export const architectureEdgeGraphBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    brokerFiles,
  }: {
    serverStaticsSource: string;
    webStaticsSource: string;
    flowFiles: { path: string; source: string }[];
    brokerFiles: { path: string; source: string }[];
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
      serverStaticsSource: string;
      webStaticsSource: string;
      flowFiles: { path: string; source: string }[];
      brokerFiles: { path: string; source: string }[];
    }): void => {
      httpProxy.setup({ serverStaticsSource, webStaticsSource, flowFiles, brokerFiles });
    },
  };
};
