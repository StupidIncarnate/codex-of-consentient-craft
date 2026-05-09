import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questSaveInvariantsTransformer } from './quest-save-invariants-transformer';

describe('questSaveInvariantsTransformer', () => {
  it('VALID: {default empty quest} => returns empty array', () => {
    const quest = QuestStub();

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([]);
  });

  it('INVALID: {two flows share id} => returns only the failed Flow ID Uniqueness check', () => {
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
    });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([
      {
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      },
    ]);
  });

  it('VALID: {nextStatus omitted, quest with unsatisfied observable} => returns empty array (completeness skipped)', () => {
    // The 'completeness' scope only fires when nextStatus === 'in_progress'. With
    // nextStatus omitted, an unsatisfied observable does NOT trigger a failure here
    // — minions can commit slice-by-slice during seek_synth without rejection.
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([]);
  });

  it('INVALID: {nextStatus: in_progress, quest with unsatisfied observable} => returns the completeness failure', () => {
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({ quest, nextStatus: 'in_progress' });

    expect(failures).toStrictEqual([
      {
        name: 'Observables Are Satisfied',
        passed: false,
        details:
          "Unsatisfied observables: observable 'login-redirects-to-dashboard' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied",
      },
    ]);
  });

  it('VALID: {nextStatus: seek_synth, quest with unsatisfied observable} => returns empty array (completeness only fires on in_progress)', () => {
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({ quest, nextStatus: 'seek_synth' });

    expect(failures).toStrictEqual([]);
  });
});
