import { architectureBackRefBrokerProxy } from '../back-ref/architecture-back-ref-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const sideChannelRenderLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
} => {
  const backRefProxy = architectureBackRefBrokerProxy();
  return {
    setupSource: ({ content }: { content: ContentText }): void => {
      backRefProxy.setupSource({ content });
    },
    setupMissing: (): void => {
      backRefProxy.setupMissing();
    },
  };
};
