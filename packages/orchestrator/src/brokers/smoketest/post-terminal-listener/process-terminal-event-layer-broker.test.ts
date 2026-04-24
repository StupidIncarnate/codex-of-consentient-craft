import { processTerminalEventLayerBroker } from './process-terminal-event-layer-broker';
import { processTerminalEventLayerBrokerProxy } from './process-terminal-event-layer-broker.proxy';

describe('processTerminalEventLayerBroker', () => {
  it('VALID: {export shape} => is a function', () => {
    processTerminalEventLayerBrokerProxy();

    expect(processTerminalEventLayerBroker).toStrictEqual(expect.any(Function));
  });
});
