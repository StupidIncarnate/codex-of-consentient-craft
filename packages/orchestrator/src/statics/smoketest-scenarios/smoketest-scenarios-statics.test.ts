import { smoketestScenariosStatics } from './smoketest-scenarios-statics';

describe('smoketestScenariosStatics', () => {
  it('VALID: {orchHappyPath} => scripts every relay role and asserts a complete quest status', () => {
    expect({
      caseId: smoketestScenariosStatics.orchHappyPath.caseId,
      name: smoketestScenariosStatics.orchHappyPath.name,
      scriptRoles: Object.keys(smoketestScenariosStatics.orchHappyPath.scripts).sort(),
      scripts: smoketestScenariosStatics.orchHappyPath.scripts,
      assertions: smoketestScenariosStatics.orchHappyPath.assertions,
    }).toStrictEqual({
      caseId: 'orch-happy-path',
      name: 'Orchestration: feature relay converges to complete',
      scriptRoles: ['codeweaver', 'flowrider', 'siegemaster'],
      scripts: {
        codeweaver: ['signalDone'],
        flowrider: ['signalDone'],
        siegemaster: ['signalDone'],
      },
      assertions: [{ kind: 'quest-status', expected: 'complete' }],
    });
  });

  it('VALID: {orchCodeweaverPartial} => codeweaver scripts partial-then-done and asserts two codeweaver work items', () => {
    expect({
      caseId: smoketestScenariosStatics.orchCodeweaverPartial.caseId,
      name: smoketestScenariosStatics.orchCodeweaverPartial.name,
      scripts: smoketestScenariosStatics.orchCodeweaverPartial.scripts,
      assertions: smoketestScenariosStatics.orchCodeweaverPartial.assertions,
    }).toStrictEqual({
      caseId: 'orch-codeweaver-partial',
      name: 'Orchestration: codeweaver partial spawns a pt continuation',
      scripts: {
        codeweaver: ['signalPartial', 'signalDone'],
        flowrider: ['signalDone'],
        siegemaster: ['signalDone'],
      },
      assertions: [
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-role-count', role: 'codeweaver', minCount: 2 },
      ],
    });
  });

  it('VALID: {orchReachesFlowrider} => asserts complete plus at least one flowrider work item', () => {
    expect({
      caseId: smoketestScenariosStatics.orchReachesFlowrider.caseId,
      name: smoketestScenariosStatics.orchReachesFlowrider.name,
      assertions: smoketestScenariosStatics.orchReachesFlowrider.assertions,
    }).toStrictEqual({
      caseId: 'orch-reaches-flowrider',
      name: 'Orchestration: relay reaches the flowrider verify role',
      assertions: [
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-role-count', role: 'flowrider', minCount: 1 },
      ],
    });
  });

  it('VALID: {all scenarios} => exported set of case IDs matches expected three', () => {
    const caseIds = Object.values(smoketestScenariosStatics)
      .map((s) => s.caseId)
      .sort();

    expect(caseIds).toStrictEqual([
      'orch-codeweaver-partial',
      'orch-happy-path',
      'orch-reaches-flowrider',
    ]);
  });

  it('VALID: {all scenarios} => every scenario references the same minimal blueprint', () => {
    const blueprints = Object.values(smoketestScenariosStatics).map((s) => s.blueprint);
    const allSame = blueprints.every((b) => b.title === 'Smoketest Orchestration Quest');

    expect({ allSame, count: blueprints.length }).toStrictEqual({
      allSame: true,
      count: 3,
    });
  });
});
