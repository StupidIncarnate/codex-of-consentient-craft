import { orchestratorGetSmoketestStateAdapter } from './orchestrator-get-smoketest-state-adapter';
import { orchestratorGetSmoketestStateAdapterProxy } from './orchestrator-get-smoketest-state-adapter.proxy';

describe('orchestratorGetSmoketestStateAdapter', () => {
  it('VALID: {invocation} => returns object with events array', () => {
    orchestratorGetSmoketestStateAdapterProxy();
    const state = orchestratorGetSmoketestStateAdapter();

    expect(Array.isArray(state.events)).toBe(true);
  });
});
