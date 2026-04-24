import { RunOrchestrationLoopLayerResponder } from './run-orchestration-loop-layer-responder';
import { RunOrchestrationLoopLayerResponderProxy } from './run-orchestration-loop-layer-responder.proxy';

describe('RunOrchestrationLoopLayerResponder', () => {
  it('VALID: {export shape} => is a function', () => {
    RunOrchestrationLoopLayerResponderProxy();

    expect(RunOrchestrationLoopLayerResponder).toStrictEqual(expect.any(Function));
  });
});
