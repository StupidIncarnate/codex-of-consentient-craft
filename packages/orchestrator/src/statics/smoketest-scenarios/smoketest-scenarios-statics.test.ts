import { smoketestScenariosStatics } from './smoketest-scenarios-statics';

// The scout script is sized per COMMITTING SESSION, not per ledger seed — scouts are appended by
// the signal-back handler after each codeweaver / flowrider / siegemaster session, so the count
// moves with the blueprint's derived fan-out and the list is over-provisioned on purpose. Derived
// from the static itself so the two never disagree; the assertions below pin the CONTENT (every
// entry is `signalDone`) and that this role is scripted at all.
const SCOUT_SCRIPT = smoketestScenariosStatics.orchHappyPath.scripts.blightscout;

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
      scriptRoles: ['blightscout', 'codeweaver', 'flowrider', 'siegemaster'],
      scripts: {
        codeweaver: ['signalDone'],
        flowrider: ['signalDone'],
        siegemaster: ['signalDone'],
        blightscout: SCOUT_SCRIPT,
      },
      assertions: [{ kind: 'quest-status', expected: 'complete' }],
    });
  });

  // Every committing session earns exactly one scout, and the relay only advances when each one
  // signals `done` — a scripted `signalPartial` there would chain a review onto a review. Pinning
  // the content (rather than just the length) is what stops that.
  it('VALID: {blightscout script} => every entry is signalDone, over more entries than the relay can need', () => {
    expect(SCOUT_SCRIPT.filter((prompt) => prompt !== 'signalDone')).toStrictEqual([]);
    expect(SCOUT_SCRIPT.length).toBeGreaterThan(3);
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
        blightscout: SCOUT_SCRIPT,
      },
      assertions: [
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-role-count', role: 'codeweaver', minCount: 2 },
      ],
    });
  });

  it('VALID: {orchReachesBlightscout} => asserts complete plus at least one blightscout work item', () => {
    expect({
      caseId: smoketestScenariosStatics.orchReachesBlightscout.caseId,
      name: smoketestScenariosStatics.orchReachesBlightscout.name,
      assertions: smoketestScenariosStatics.orchReachesBlightscout.assertions,
    }).toStrictEqual({
      caseId: 'orch-reaches-blightscout',
      name: 'Orchestration: relay reaches the blightscout audit role',
      assertions: [
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-role-count', role: 'blightscout', minCount: 1 },
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

  it('VALID: {all scenarios} => exported set of case IDs matches expected four', () => {
    const caseIds = Object.values(smoketestScenariosStatics)
      .map((s) => s.caseId)
      .sort();

    expect(caseIds).toStrictEqual([
      'orch-codeweaver-partial',
      'orch-happy-path',
      'orch-reaches-blightscout',
      'orch-reaches-flowrider',
    ]);
  });

  it('VALID: {all scenarios} => every scenario references the same minimal blueprint', () => {
    const blueprints = Object.values(smoketestScenariosStatics).map((s) => s.blueprint);
    const allSame = blueprints.every((b) => b.title === 'Smoketest Orchestration Quest');

    expect({ allSame, count: blueprints.length }).toStrictEqual({
      allSame: true,
      count: 4,
    });
  });
});
