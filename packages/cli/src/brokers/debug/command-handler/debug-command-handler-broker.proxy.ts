import { handleStartLayerBrokerProxy } from './handle-start-layer-broker.proxy';
import { handleInputLayerBrokerProxy } from './handle-input-layer-broker.proxy';
import { handleKeypressLayerBrokerProxy } from './handle-keypress-layer-broker.proxy';
import { handleGetScreenLayerBrokerProxy } from './handle-get-screen-layer-broker.proxy';
import { handleExitLayerBrokerProxy } from './handle-exit-layer-broker.proxy';

export const debugCommandHandlerBrokerProxy = (): Record<PropertyKey, never> => {
  handleStartLayerBrokerProxy();
  handleInputLayerBrokerProxy();
  handleKeypressLayerBrokerProxy();
  handleGetScreenLayerBrokerProxy();
  handleExitLayerBrokerProxy();
  return {};
};
