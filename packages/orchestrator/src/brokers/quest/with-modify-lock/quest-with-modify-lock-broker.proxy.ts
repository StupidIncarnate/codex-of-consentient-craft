import { questModifyLocksLayerBrokerProxy } from './quest-modify-locks-layer-broker.proxy';

export const questWithModifyLockBrokerProxy = (): {
  setupEmpty: () => void;
} => {
  const locksProxy = questModifyLocksLayerBrokerProxy();

  return {
    setupEmpty: (): void => {
      locksProxy.setupEmpty();
    },
  };
};
