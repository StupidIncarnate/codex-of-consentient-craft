import { siegemasterTestAuditMinionStatics } from './siegemaster-test-audit-minion-statics';

const has = (needle: string): boolean =>
  siegemasterTestAuditMinionStatics.prompt.template.includes(needle);

describe('siegemasterTestAuditMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterTestAuditMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => is substantial enough to carry the audit methodology', () => {
    expect(siegemasterTestAuditMinionStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => ends with the Briefing section carrying $ARGUMENTS exactly once', () => {
    const { template } = siegemasterTestAuditMinionStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      endsWithBriefing: template.endsWith('## Briefing\n\n$ARGUMENTS'),
    }).toStrictEqual({ count: 1, endsWithBriefing: true });
  });

  it('VALID: template => titles the role a false-green auditor summoned by a Siegemaster orchestrator', () => {
    expect({
      title: /^# Siegemaster-Test-Audit-Minion - False-Green Auditor$/mu.test(
        siegemasterTestAuditMinionStatics.prompt.template,
      ),
      summonedAfterWalks: has(
        'You are a sub-agent summoned by a **Siegemaster orchestrator** after its walkers finished a flow',
      ),
    }).toStrictEqual({ title: true, summonedAfterWalks: true });
  });

  it('VALID: template => forbids signal-back and declares the final message IS the report', () => {
    expect({
      noSignalBack: has('**You do NOT call `signal-back`.**'),
      finalMessageIsReport: has('**Your final message IS your report.**'),
    }).toStrictEqual({ noSignalBack: true, finalMessageIsReport: true });
  });

  it('VALID: template => forbids passing a workItemId, which would mark it a work-item agent', () => {
    expect(has('**Never pass a `workItemId` to any MCP tool.**')).toBe(true);
  });

  it('VALID: template => forbids ward and background waits, because hanging strands the operator', () => {
    expect({
      noWard: has('a broad `npm run ward` gets auto-backgrounded and will hang you'),
      neverPoll: has(
        '**Never end your turn waiting on a background task, and never poll for one.**',
      ),
      hangingStrands: has('hanging strands its work item'),
    }).toStrictEqual({ noWard: true, neverPoll: true, hangingStrands: true });
  });

  // Authoring a test and then grading it is the self-grading loop the two-track sign-off model
  // exists to break, so this pass reaches its verdict by mutation alone and hands every hole back.
  it('VALID: template => adds no tests and reaches its verdict by mutation, because a session cannot grade its own test', () => {
    expect({
      addsNothing: has('**You add NO tests. You prove the tests that exist.**'),
      mutationNeedsNoAuthoring: has(
        'Mutation gives you a verdict on a test without\nauthoring a line',
      ),
      namesTheSelfGradingLoop: has(
        'a session that writes a test\nand then grades it has graded its own homework',
      ),
      authoringIsFlowriders: has("Authoring belongs to Flowrider's lane."),
      holesAreReported: has('**A coverage hole you find is REPORTED**'),
      holesBecomeQuestNotes: has('for the operator to file as a `questNotes` entry'),
      onlyEditsAreMutations: has(
        'The only file edits you make at all are the mutations themselves, and you revert every one.',
      ),
      mayNotEdit: has(
        '**You may NOT edit implementation as a fix, and you may NOT weaken a test.**',
      ),
      walksAlreadyDone: has('**The walks are already done.**'),
      defectsReportedNotFixed: has(
        '**a suspected behaviour defect is REPORTED, never fixed here.**',
      ),
    }).toStrictEqual({
      addsNothing: true,
      mutationNeedsNoAuthoring: true,
      namesTheSelfGradingLoop: true,
      authoringIsFlowriders: true,
      holesAreReported: true,
      holesBecomeQuestNotes: true,
      onlyEditsAreMutations: true,
      mayNotEdit: true,
      walksAlreadyDone: true,
      defectsReportedNotFixed: true,
    });
  });

  it('VALID: template => loads testing patterns as the standard it audits against', () => {
    expect({
      step: /^## Step 1: Load Standards \(BLOCKING — do this FIRST\)$/mu.test(
        siegemasterTestAuditMinionStatics.prompt.template,
      ),
      testingPatterns: has('`get-testing-patterns`'),
      cannotDoJobWithout: has('you cannot do this job without it'),
    }).toStrictEqual({ step: true, testingPatterns: true, cannotDoJobWithout: true });
  });

  it('VALID: template => names the false-green shapes, including a fixture thinner than the walk canvas', () => {
    expect({
      mocksTheSut: has('A test that mocks the thing it is testing asserts its own\n  mock.'),
      benignFixture: has(
        '**a test whose fixture is thinner than that canvas is weaker than the walk that just passed.**',
      ),
      jsdomGeometry: has('every measured\n  width reads 0'),
      wouldItFail: has('**Would it FAIL if the behaviour broke?**'),
    }).toStrictEqual({
      mocksTheSut: true,
      benignFixture: true,
      jsdomGeometry: true,
      wouldItFail: true,
    });
  });

  it('VALID: template => proves doubtful tests by mutation and requires the mutation be reverted', () => {
    expect({
      step: /^## Step 3: Prove the Doubtful Ones$/mu.test(
        siegemasterTestAuditMinionStatics.prompt.template,
      ),
      verifyByMutation: has('**verify by mutation**'),
      revertEvery: has('**Revert every mutation you make.**'),
      confirmClean: has('check `git diff` per file you touched'),
    }).toStrictEqual({
      step: true,
      verifyByMutation: true,
      revertEvery: true,
      confirmClean: true,
    });
  });

  // A hole named only in a returned message dies with the turn. Naming it with the shape the
  // missing test would take is what lets the operator file it as a durable questNotes entry.
  it('VALID: template => names the holes it does not fill, with the test shape and the reason', () => {
    expect({
      step: /^## Step 4: Name the Holes You Are Not Filling$/mu.test(
        siegemasterTestAuditMinionStatics.prompt.template,
      ),
      doesNotWriteIt: has('Where a unit has no honest test, you do NOT write one.'),
      reentersThePlan: has(
        'so the operator can file it as a `questNotes` entry and\nit re-enters the plan rather than dying in this turn',
      ),
      namesTheShapes: has('painted geometry, real rendering, real navigation → **e2e**'),
      demandsAWhy: has('"Needs more coverage" is not a hole, it is a shrug.'),
    }).toStrictEqual({
      step: true,
      doesNotWriteIt: true,
      reentersThePlan: true,
      namesTheShapes: true,
      demandsAWhy: true,
    });
  });

  it('VALID: template => defines a report with false greens, coverage holes, and reported-not-fixed defects', () => {
    expect({
      falseGreens: has('FALSE GREENS (tests that pass while the behaviour is broken):'),
      coverageHoles: has('COVERAGE HOLES (for you to file as questNotes — I author nothing):'),
      suspected: has(
        'SUSPECTED BEHAVIOUR DEFECTS (reported, NOT fixed — for the operator to re-walk):',
      ),
      honestTests: has('HONEST TESTS:'),
      noAddedTestsBlock: !has('TESTS I ADDED:'),
    }).toStrictEqual({
      falseGreens: true,
      coverageHoles: true,
      suspected: true,
      honestTests: true,
      noAddedTestsBlock: true,
    });
  });

  it('VALID: template => accepts finding nothing as a real result', () => {
    expect(has('**Finding nothing is a real result.**')).toBe(true);
  });

  it('VALID: template => never runs git, because the operator owns the commit', () => {
    expect(has('**You never run `git`.** Your operator owns the commit.')).toBe(true);
  });
});
