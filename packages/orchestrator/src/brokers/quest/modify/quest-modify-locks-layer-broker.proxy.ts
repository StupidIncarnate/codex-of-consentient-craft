import { questModifyLocksLayerBroker } from './quest-modify-locks-layer-broker';

export const questModifyLocksLayerBrokerProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    questModifyLocksLayerBroker.clear();
  },
});
