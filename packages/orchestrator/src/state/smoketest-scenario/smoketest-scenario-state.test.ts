import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { smoketestScenarioState } from './smoketest-scenario-state';

describe('smoketestScenarioState', () => {
  it('VALID: {no registration} => getActive returns null', () => {
    const questId = QuestIdStub({ value: 'unregistered-quest' });

    const active = smoketestScenarioState.getActive({ questId });

    expect(active).toBe(null);
  });

  it('VALID: {register then getActive} => returns instance with supplied scripts and empty ordinals', () => {
    const questId = QuestIdStub({ value: 'register-active-quest' });

    smoketestScenarioState.register({
      questId,
      scripts: { codeweaver: ['signalFailed', 'signalComplete'] },
    });
    const active = smoketestScenarioState.getActive({ questId });
    smoketestScenarioState.unregister({ questId });

    expect(active).toStrictEqual({
      scripts: { codeweaver: ['signalFailed', 'signalComplete'] },
      callOrdinals: {},
    });
  });

  it('VALID: {dispense then dispense} => returns prompts in order and advances per-role ordinal', () => {
    const questId = QuestIdStub({ value: 'dispense-order-quest' });

    smoketestScenarioState.register({
      questId,
      scripts: { codeweaver: ['signalFailed', 'signalComplete'] },
    });
    const first = smoketestScenarioState.dispense({ questId, role: 'codeweaver' });
    const second = smoketestScenarioState.dispense({ questId, role: 'codeweaver' });
    const third = smoketestScenarioState.dispense({ questId, role: 'codeweaver' });
    smoketestScenarioState.unregister({ questId });

    expect({ first, second, third }).toStrictEqual({
      first: 'signalFailed',
      second: 'signalComplete',
      third: null,
    });
  });

  it('VALID: {dispense for unscripted role} => returns null and does not advance other roles', () => {
    const questId = QuestIdStub({ value: 'unscripted-role-quest' });

    smoketestScenarioState.register({
      questId,
      scripts: { codeweaver: ['signalComplete'] },
    });
    const pathseekerDispense = smoketestScenarioState.dispense({
      questId,
      role: 'pathseeker',
    });
    const codeweaverDispense = smoketestScenarioState.dispense({
      questId,
      role: 'codeweaver',
    });
    smoketestScenarioState.unregister({ questId });

    expect({ pathseekerDispense, codeweaverDispense }).toStrictEqual({
      pathseekerDispense: null,
      codeweaverDispense: 'signalComplete',
    });
  });

  it('VALID: {dispense without registration} => returns null', () => {
    const questId = QuestIdStub({ value: 'no-registration-quest' });

    const result = smoketestScenarioState.dispense({ questId, role: 'codeweaver' });

    expect(result).toBe(null);
  });

  it('VALID: {unregister then getActive} => returns null', () => {
    const questId = QuestIdStub({ value: 'unregister-quest' });

    smoketestScenarioState.register({
      questId,
      scripts: { codeweaver: ['signalComplete'] },
    });
    smoketestScenarioState.unregister({ questId });
    const active = smoketestScenarioState.getActive({ questId });

    expect(active).toBe(null);
  });

  it('VALID: {dispense advances only the dispensed role} => other role ordinal stays zero', () => {
    const questId = QuestIdStub({ value: 'per-role-ordinal-quest' });

    smoketestScenarioState.register({
      questId,
      scripts: {
        codeweaver: ['signalFailed', 'signalComplete'],
        pathseeker: ['signalComplete'],
      },
    });
    smoketestScenarioState.dispense({ questId, role: 'codeweaver' });
    const active = smoketestScenarioState.getActive({ questId });
    smoketestScenarioState.unregister({ questId });

    expect(active?.callOrdinals).toStrictEqual({ codeweaver: 1 });
  });

  it('VALID: {register multiple distinct questIds} => each has its own active instance and dispenses independently', () => {
    const firstQuestId = QuestIdStub({ value: 'multi-first-quest' });
    const secondQuestId = QuestIdStub({ value: 'multi-second-quest' });

    smoketestScenarioState.register({
      questId: firstQuestId,
      scripts: { codeweaver: ['signalComplete'] },
    });
    smoketestScenarioState.register({
      questId: secondQuestId,
      scripts: { codeweaver: ['signalFailed'] },
    });
    const firstDispense = smoketestScenarioState.dispense({
      questId: firstQuestId,
      role: 'codeweaver',
    });
    const secondDispense = smoketestScenarioState.dispense({
      questId: secondQuestId,
      role: 'codeweaver',
    });
    const firstActive = smoketestScenarioState.getActive({ questId: firstQuestId });
    const secondActive = smoketestScenarioState.getActive({ questId: secondQuestId });
    smoketestScenarioState.unregister({ questId: firstQuestId });
    smoketestScenarioState.unregister({ questId: secondQuestId });

    expect({ firstDispense, secondDispense, firstActive, secondActive }).toStrictEqual({
      firstDispense: 'signalComplete',
      secondDispense: 'signalFailed',
      firstActive: {
        scripts: { codeweaver: ['signalComplete'] },
        callOrdinals: { codeweaver: 1 },
      },
      secondActive: {
        scripts: { codeweaver: ['signalFailed'] },
        callOrdinals: { codeweaver: 1 },
      },
    });
  });

  it('INVALID: {register same questId twice} => throws duplicate-registration error', () => {
    const questId = QuestIdStub({ value: 'duplicate-register-quest' });

    smoketestScenarioState.register({
      questId,
      scripts: { codeweaver: ['signalComplete'] },
    });
    const thrown = (): void => {
      smoketestScenarioState.register({
        questId,
        scripts: { codeweaver: ['signalFailed'] },
      });
    };
    let caught: unknown = null;
    try {
      thrown();
    } catch (error: unknown) {
      caught = error;
    }
    smoketestScenarioState.unregister({ questId });

    expect(caught).toStrictEqual(
      new Error(`smoketestScenarioState.register: quest "${questId}" is already registered`),
    );
  });
});
