import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

export const ToolingSmoketestStateResponderProxy = (): {
  setupNoActiveRun: () => void;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    // smoketestRunState's own no-run-active shape (smoketest-run-state.test.ts).
    setupNoActiveRun: (): void => {
      orchestrator.getSmoketestStateReturns({ result: { active: null, events: [] } });
    },
  };
};
