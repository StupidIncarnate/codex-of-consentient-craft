import { eventBusStatesFindLayerBrokerProxy } from './event-bus-states-find-layer-broker.proxy';
import { busEmitterSitesFindLayerBrokerProxy } from './bus-emitter-sites-find-layer-broker.proxy';
import { busSubscriberFilesFindLayerBrokerProxy } from './bus-subscriber-files-find-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureEventBusBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  // All three child layer brokers share the same listTsFiles/readFile mock surface
  // (singleton registerMock dispatch). Setting up each child's proxy with the
  // same sourceFiles list is idempotent — the last setup wins, but the content
  // is identical so this is a no-op overwrite.
  const statesProxy = eventBusStatesFindLayerBrokerProxy();
  const emittersProxy = busEmitterSitesFindLayerBrokerProxy();
  const subscribersProxy = busSubscriberFilesFindLayerBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      statesProxy.setup({ sourceFiles });
      emittersProxy.setup({ sourceFiles });
      subscribersProxy.setup({ sourceFiles });
    },
  };
};
