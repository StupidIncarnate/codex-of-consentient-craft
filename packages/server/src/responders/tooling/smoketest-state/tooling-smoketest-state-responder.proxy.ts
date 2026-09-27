import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const ToolingSmoketestStateResponderProxy = (): Record<PropertyKey, never> => {
  StartOrchestratorProxy();
  // Second handle on the SAME mocked StartOrchestrator.getSmoketestState function — shares staged
  // calls with the handle StartOrchestratorProxy already registered (jestRegisterMockAdapter keys
  // its state by the mock function itself, the same pattern quest-chat-responder.proxy.ts uses for
  // startChatHandle). enforce-proxy-patterns forbids calling a child proxy's own semantic method
  // (orchestrator.getSmoketestStateReturns(...)) as a constructor-level side effect, so the default
  // is staged directly on a second handle instead. Matches smoketestRunState's own no-run-active
  // shape (smoketest-run-state.test.ts), so a test that never stages its own scenario still gets
  // the same answer the deleted adapter's real, unmocked call used to produce.
  registerMock({ fn: StartOrchestrator.getSmoketestState })
    .calledWith([])
    .returns({ active: null, events: [] });
  return {};
};
