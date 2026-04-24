import { EnqueueOrchestrationScenarioLayerResponder } from './enqueue-orchestration-scenario-layer-responder';
import { EnqueueOrchestrationScenarioLayerResponderProxy } from './enqueue-orchestration-scenario-layer-responder.proxy';

describe('EnqueueOrchestrationScenarioLayerResponder', () => {
  it('VALID: {export shape} => is a function', () => {
    EnqueueOrchestrationScenarioLayerResponderProxy();

    expect(EnqueueOrchestrationScenarioLayerResponder).toStrictEqual(expect.any(Function));
  });
});
