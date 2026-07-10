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

  it('VALID: {currentStatus and nextStatus omitted, quest with unsatisfied observable} => returns empty array (completeness skipped)', () => {
    // The 'completeness' scope only fires at the legacy seek_walk → in_progress
    // boundary. With both statuses omitted, an unsatisfied observable does NOT trigger
    // a failure here.
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([]);
  });

  it('INVALID: {currentStatus: seek_walk, nextStatus: in_progress, quest with unsatisfied observable} => returns the completeness failure', () => {
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({
      quest,
      currentStatus: 'seek_walk',
      nextStatus: 'in_progress',
    });

    expect(failures).toStrictEqual([
      {
        name: 'Observables Are Satisfied',
        passed: false,
        details:
          "Unsatisfied observables: observable 'login-redirects-to-dashboard' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied",
      },
    ]);
  });

  it('INVALID: {currentStatus: seek_scope, nextStatus: in_progress, quest with unsatisfied observable} => returns the completeness failure (gate fires on any pathseeker-running status → in_progress)', () => {
    // PathSeeker rests the quest at seek_scope for its whole run and drives the terminal
    // seek_scope → in_progress transition itself. The completeness scope must fire on that
    // transition (retryable modify-quest rejection), not only on the legacy seek_walk edge.
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({
      quest,
      currentStatus: 'seek_scope',
      nextStatus: 'in_progress',
    });

    expect(failures).toStrictEqual([
      {
        name: 'Observables Are Satisfied',
        passed: false,
        details:
          "Unsatisfied observables: observable 'login-redirects-to-dashboard' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied",
      },
    ]);
  });

  it('VALID: {currentStatus: approved, nextStatus: in_progress, quest with unsatisfied observable} => returns empty array (completeness only fires from a pathseeker-running status)', () => {
    // `approved` is not a pathseeker-running status, so completeness does NOT fire on this
    // transition — it fires only from seek_scope/seek_synth/seek_walk. This keeps
    // blocked/paused → in_progress resume paths ungated.
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({
      quest,
      currentStatus: 'approved',
      nextStatus: 'in_progress',
    });

    expect(failures).toStrictEqual([]);
  });

  it('VALID: {currentStatus: seek_walk, nextStatus: seek_synth, quest with unsatisfied observable} => returns empty array (completeness only fires when nextStatus is in_progress)', () => {
    const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
    const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
    });

    const failures = questSaveInvariantsTransformer({
      quest,
      currentStatus: 'seek_walk',
      nextStatus: 'seek_synth',
    });

    expect(failures).toStrictEqual([]);
  });
});
