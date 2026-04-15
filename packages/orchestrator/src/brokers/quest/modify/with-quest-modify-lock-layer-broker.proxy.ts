import { questModifyLocksLayerBrokerProxy } from './quest-modify-locks-layer-broker.proxy';

export const withQuestModifyLockLayerBrokerProxy = (): {
  setupEmpty: () => void;
} => {
  const locksProxy = questModifyLocksLayerBrokerProxy();

  return {
    setupEmpty: (): void => {
      locksProxy.setupEmpty();
    },
  };
};
