import { smoketestScenariosStatics } from './smoketest-scenarios-statics';

describe('smoketestScenariosStatics', () => {
  it('VALID: {orchHappyPath} => exposes every role script and a single quest-status assertion', () => {
    expect({
      caseId: smoketestScenariosStatics.orchHappyPath.caseId,
      name: smoketestScenariosStatics.orchHappyPath.name,
      scriptRoles: Object.keys(smoketestScenariosStatics.orchHappyPath.scripts).sort(),
      assertions: smoketestScenariosStatics.orchHappyPath.assertions,
    }).toStrictEqual({
      caseId: 'orch-happy-path',
      name: 'Orchestration: happy path',
      scriptRoles: [
        'blightwarden',
        'codeweaver',
        'lawbringer',
        'pathseeker',
        'siegemaster',
        'spiritmender',
      ],
      assertions: [{ kind: 'quest-status', expected: 'complete' }],
    });
  });

  it('VALID: {orchCodeweaverFail} => codeweaver scripts signalFailed then signalComplete; pathseeker script covers replan', () => {
    expect({
      caseId: smoketestScenariosStatics.orchCodeweaverFail.caseId,
      codeweaverScript: smoketestScenariosStatics.orchCodeweaverFail.scripts.codeweaver,
      pathseekerScript: smoketestScenariosStatics.orchCodeweaverFail.scripts.pathseeker,
      assertions: smoketestScenariosStatics.orchCodeweaverFail.assertions,
    }).toStrictEqual({
      caseId: 'orch-codeweaver-fail',
      codeweaverScript: ['signalFailed', 'signalComplete'],
      pathseekerScript: ['signalComplete', 'signalComplete'],
      assertions: [
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-role-count', role: 'pathseeker', minCount: 2 },
      ],
    });
  });

  it('VALID: {orchLawbringerFail} => lawbringer scripts signalFailed; spiritmender scripts signalComplete', () => {
    expect({
      caseId: smoketestScenariosStatics.orchLawbringerFail.caseId,
      lawbringerScript: smoketestScenariosStatics.orchLawbringerFail.scripts.lawbringer,
      spiritmenderScript: smoketestScenariosStatics.orchLawbringerFail.scripts.spiritmender,
      assertions: smoketestScenariosStatics.orchLawbringerFail.assertions,
    }).toStrictEqual({
      caseId: 'orch-lawbringer-fail',
      lawbringerScript: ['signalFailed'],
      spiritmenderScript: ['signalComplete'],
      assertions: [
        { kind: 'quest-status', expected: 'complete' },
        { kind: 'work-item-role-count', role: 'spiritmender', minCount: 1 },
      ],
    });
  });

  it('VALID: {orchDepthExhaustion} => ships 6 signalFailed entries for codeweaver (maxFollowupDepth=5 + initial dispatch)', () => {
    expect({
      caseId: smoketestScenariosStatics.orchDepthExhaustion.caseId,
      codeweaverScript: smoketestScenariosStatics.orchDepthExhaustion.scripts.codeweaver,
      assertions: smoketestScenariosStatics.orchDepthExhaustion.assertions,
    }).toStrictEqual({
      caseId: 'orch-depth-exhaustion',
      codeweaverScript: [
        'signalFailed',
        'signalFailed',
        'signalFailed',
        'signalFailed',
        'signalFailed',
        'signalFailed',
      ],
      assertions: [
        { kind: 'quest-status', expected: 'blocked' },
        { kind: 'work-item-role-count', role: 'codeweaver', minCount: 6 },
      ],
    });
  });

  it('VALID: {orchBlightwardenReplan} => blightwarden scripts signalFailedReplan; pathseeker script covers replan', () => {
    expect({
      caseId: smoketestScenariosStatics.orchBlightwardenReplan.caseId,
      blightwardenScript: smoketestScenariosStatics.orchBlightwardenReplan.scripts.blightwarden,
      pathseekerScript: smoketestScenariosStatics.orchBlightwardenReplan.scripts.pathseeker,
      assertions: smoketestScenariosStatics.orchBlightwardenReplan.assertions,
    }).toStrictEqual({
      caseId: 'orch-blightwarden-replan',
      blightwardenScript: ['signalFailedReplan'],
      pathseekerScript: ['signalComplete', 'signalComplete'],
      assertions: [{ kind: 'work-item-role-count', role: 'pathseeker', minCount: 2 }],
    });
  });

  it('VALID: {all scenarios} => exported set of case IDs matches expected five', () => {
    const caseIds = Object.values(smoketestScenariosStatics)
      .map((s) => s.caseId)
      .sort();

    expect(caseIds).toStrictEqual([
      'orch-blightwarden-replan',
      'orch-codeweaver-fail',
      'orch-depth-exhaustion',
      'orch-happy-path',
      'orch-lawbringer-fail',
    ]);
  });

  it('VALID: {all scenarios} => every scenario references the same minimal blueprint', () => {
    const blueprints = Object.values(smoketestScenariosStatics).map((s) => s.blueprint);
    const allSame = blueprints.every((b) => b.title === 'Smoketest Orchestration Quest');

    expect({ allSame, count: blueprints.length }).toStrictEqual({
      allSame: true,
      count: 5,
    });
  });
});
