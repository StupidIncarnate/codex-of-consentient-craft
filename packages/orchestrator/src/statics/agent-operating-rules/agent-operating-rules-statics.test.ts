import { agentOperatingRulesStatics } from './agent-operating-rules-statics';

const HEADING = '## Operating Rules — READ FIRST (ignoring these wedges the whole quest)';

const VARIANTS = [
  ['markdown', agentOperatingRulesStatics.markdown],
  ['operatorMarkdown', agentOperatingRulesStatics.operatorMarkdown],
  ['delegatingMinionMarkdown', agentOperatingRulesStatics.delegatingMinionMarkdown],
  ['leafMinionMarkdown', agentOperatingRulesStatics.leafMinionMarkdown],
] as const;

// One opening sentence per rule, keyed by which variant carries it. Comparing PRESENCE of these
// across the four variants is the direct test of "these differ on exactly one axis" — the claim the
// four-variant split rests on, and the thing that silently rots when a rule is edited in one copy.
const RULE_1_SIGNAL = '**1. ALWAYS call `signal-back` as the final action of your turn.**';
const RULE_1_NEVER_SIGNAL =
  '**1. NEVER call `signal-back` — your final message IS your terminal action.**';
const RULE_2_BACKGROUND =
  '**2. NEVER end your turn waiting for a background task, and NEVER poll for one.**';
const RULE_3_SCOPED_WARD =
  '**3. Run ward SCOPED, ALWAYS in the foreground, with `timeout: 600000`.';
const RULE_3_NO_WARD = '**3. You run NO ward, NO test and NO check of any kind.**';
const RULE_4_SYNCHRONOUS =
  '**4. The `Agent`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed';
const RULE_4_SPIKE =
  '**4. The `Agent`/Task tool is SYNCHRONOUS, and that is WHY a bounded spike is on the table';
const RULE_4_LEAF_BAN = '**4. You are a LEAF. Do NOT call the `Agent`/Task tool.**';
const RULE_5_BLOCKED =
  "**5. When the wall is the ENVIRONMENT, not the work, signal `operationStatus: 'blocked'`";
const RULE_5_REPORT =
  '**5. When the wall is the ENVIRONMENT, not the work, report it — do not work around it.**';

describe('agentOperatingRulesStatics', () => {
  it('VALID: exported value => carries exactly the four variants, all non-empty strings', () => {
    expect(agentOperatingRulesStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
      operatorMarkdown: expect.stringMatching(/^.+$/su),
      delegatingMinionMarkdown: expect.stringMatching(/^.+$/su),
      leafMinionMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  describe.each(VARIANTS)('%s', (_name, markdown) => {
    it('VALID: variant => opens on the shared heading', () => {
      expect(markdown.startsWith(HEADING)).toBe(true);
    });

    // A rule that goes missing does not fail anything at runtime — the agent simply never reads it.
    // Contiguous 1-5 is the cheapest structural check that every variant still carries all five.
    it('VALID: variant => numbers its rules 1 through 5, contiguously', () => {
      expect(
        Array.from(markdown.matchAll(/^\*\*(\d)\./gmu)).map((match) => match[0]),
      ).toStrictEqual(['**1.', '**2.', '**3.', '**4.', '**5.']);
    });
  });

  // AXIS 1 — the terminal action. A work-item role ENDS in `signal-back`; a minion never calls it,
  // because the `workItemId` in its briefing is its PARENT's and signalling on it would complete the
  // parent's operation item mid-round.
  describe('axis 1: the terminal action separates work-item variants from minion variants', () => {
    it('VALID: {rule 1} => the two work-item variants mandate signal-back and the two minion variants forbid it', () => {
      expect({
        roleMandates: agentOperatingRulesStatics.markdown.includes(RULE_1_SIGNAL),
        operatorMandates: agentOperatingRulesStatics.operatorMarkdown.includes(RULE_1_SIGNAL),
        delegatingForbids:
          agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_1_NEVER_SIGNAL),
        leafForbids: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_1_NEVER_SIGNAL),
        roleDoesNotForbid: agentOperatingRulesStatics.markdown.includes(RULE_1_NEVER_SIGNAL),
        delegatingDoesNotMandate:
          agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_1_SIGNAL),
      }).toStrictEqual({
        roleMandates: true,
        operatorMandates: true,
        delegatingForbids: true,
        leafForbids: true,
        roleDoesNotForbid: false,
        delegatingDoesNotMandate: false,
      });
    });

    it('VALID: {minion rule 1} => names the parent-item hazard and the NEXT: line the parent reads', () => {
      expect({
        namesTheHazard: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          "signalling on it would complete the parent's operation item and advance the relay while the parent is still working",
        ),
        namesTheNextLine: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          'the LAST line of that block is always `NEXT:`',
        ),
        parentActsOnOneWord: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          'it reads the `NEXT:` line, acts on that one word, and never opens a file to check the rest',
        ),
      }).toStrictEqual({ namesTheHazard: true, namesTheNextLine: true, parentActsOnOneWord: true });
    });
  });

  // AXIS 2 — whether the reader may delegate. A LEAF minion that spawns a sub-agent produces a
  // grandchild whose conclusions no gate reads. The two minion variants therefore differ at rule 4
  // and NOWHERE else: a second difference would be a place the two can drift apart.
  describe('axis 2: delegation separates the two minion variants, at rule 4 only', () => {
    it('VALID: {rule 4} => the spike rule and the leaf ban each appear in exactly one minion variant', () => {
      expect({
        delegatingHasSpike:
          agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_4_SPIKE),
        delegatingHasLeafBan:
          agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_4_LEAF_BAN),
        leafHasLeafBan: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_4_LEAF_BAN),
        leafHasSpike: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_4_SPIKE),
      }).toStrictEqual({
        delegatingHasSpike: true,
        delegatingHasLeafBan: false,
        leafHasLeafBan: true,
        leafHasSpike: false,
      });
    });

    it('VALID: {rules 1, 2, 3 and 5} => both minion variants carry the identical shared rules', () => {
      expect({
        rule1: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_1_NEVER_SIGNAL),
        rule2: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_2_BACKGROUND),
        rule3: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_3_SCOPED_WARD),
        rule5: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(RULE_5_REPORT),
        leafRule1: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_1_NEVER_SIGNAL),
        leafRule2: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_2_BACKGROUND),
        leafRule3: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_3_SCOPED_WARD),
        leafRule5: agentOperatingRulesStatics.leafMinionMarkdown.includes(RULE_5_REPORT),
      }).toStrictEqual({
        rule1: true,
        rule2: true,
        rule3: true,
        rule5: true,
        leafRule1: true,
        leafRule2: true,
        leafRule3: true,
        leafRule5: true,
      });
    });

    it('VALID: {delegating rule 4} => permits a bounded spike and refuses whole-assignment delegation', () => {
      expect({
        spikeOnly: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(
          'a SPIKE, and only a spike',
        ),
        notTheWholeAssignment: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(
          'You may NOT delegate your whole assignment to a helper',
        ),
        judgmentIsTheDeliverable: agentOperatingRulesStatics.delegatingMinionMarkdown.includes(
          "A helper's conclusions are not a deliverable; your judgment on them is.",
        ),
      }).toStrictEqual({
        spikeOnly: true,
        notTheWholeAssignment: true,
        judgmentIsTheDeliverable: true,
      });
    });

    it('VALID: {leaf rule 4} => bans the Agent tool outright and names why a grandchild is ungraded', () => {
      expect({
        nobodyGradesIt: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          "it reads YOUR files, not your helper's conclusions",
        ),
        escalateInstead: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          'say so in your return and let your parent decide',
        ),
      }).toStrictEqual({ nobodyGradesIt: true, escalateInstead: true });
    });
  });

  // AXIS 3 — whether the reader runs ward at all. An OPERATOR runs none: its reviewer runs the
  // round's single `--staged` pass. Handing it the scoping rule hands back a command its own prompt
  // FORBIDS, and a session that runs a ward it cannot read the output of competes with its reviewer
  // for the same tree. Same shape as axis 2: differ at rule 3, nowhere else.
  describe('axis 3: ward ownership separates the two work-item variants, at rule 3 only', () => {
    it('VALID: {rule 3} => the scoping rule and the no-ward rule never appear in the same variant', () => {
      expect({
        roleHasScoping: agentOperatingRulesStatics.markdown.includes(RULE_3_SCOPED_WARD),
        roleHasNoWard: agentOperatingRulesStatics.markdown.includes(RULE_3_NO_WARD),
        operatorHasNoWard: agentOperatingRulesStatics.operatorMarkdown.includes(RULE_3_NO_WARD),
        operatorHasScoping:
          agentOperatingRulesStatics.operatorMarkdown.includes(RULE_3_SCOPED_WARD),
      }).toStrictEqual({
        roleHasScoping: true,
        roleHasNoWard: false,
        operatorHasNoWard: true,
        operatorHasScoping: false,
      });
    });

    it('VALID: {rules 1, 2, 4 and 5} => both work-item variants carry the identical shared rules', () => {
      expect({
        rule1: agentOperatingRulesStatics.markdown.includes(RULE_1_SIGNAL),
        rule2: agentOperatingRulesStatics.markdown.includes(RULE_2_BACKGROUND),
        rule4: agentOperatingRulesStatics.markdown.includes(RULE_4_SYNCHRONOUS),
        rule5: agentOperatingRulesStatics.markdown.includes(RULE_5_BLOCKED),
        operatorRule1: agentOperatingRulesStatics.operatorMarkdown.includes(RULE_1_SIGNAL),
        operatorRule2: agentOperatingRulesStatics.operatorMarkdown.includes(RULE_2_BACKGROUND),
        operatorRule4: agentOperatingRulesStatics.operatorMarkdown.includes(RULE_4_SYNCHRONOUS),
        operatorRule5: agentOperatingRulesStatics.operatorMarkdown.includes(RULE_5_BLOCKED),
      }).toStrictEqual({
        rule1: true,
        rule2: true,
        rule4: true,
        rule5: true,
        operatorRule1: true,
        operatorRule2: true,
        operatorRule4: true,
        operatorRule5: true,
      });
    });

    it('VALID: {operator rule 3} => runs no ward at all and names the reviewer as the one that does', () => {
      expect({
        reviewerRunsIt: agentOperatingRulesStatics.operatorMarkdown.includes(
          "Your REVIEWER runs the round's ward, once, as `npm run ward -- --staged`",
        ),
        overridesBothSnippets: agentOperatingRulesStatics.operatorMarkdown.includes(
          'OVERRIDES both the `<dungeonmaster-ward>` and the `<dungeonmaster-ward-discipline>` snippets',
        ),
        namesTheCost: agentOperatingRulesStatics.operatorMarkdown.includes(
          'competing with your reviewer for the same tree',
        ),
      }).toStrictEqual({ reviewerRunsIt: true, overridesBothSnippets: true, namesTheCost: true });
    });
  });

  // The scoping rule has to cover BOTH legitimate forms, because a worker runs the named-file form
  // and a reviewer runs `--staged`. Naming only one made the other read as a violation of the rule
  // that was supposed to authorise it.
  const SCOPE_RULE_VARIANTS = [
    ['markdown', agentOperatingRulesStatics.markdown],
    ['delegatingMinionMarkdown', agentOperatingRulesStatics.delegatingMinionMarkdown],
    ['leafMinionMarkdown', agentOperatingRulesStatics.leafMinionMarkdown],
  ] as const;

  describe.each(SCOPE_RULE_VARIANTS)(
    'the ward-scope rule in %s names both scoped forms',
    (_name, markdown) => {
      it('VALID: {rule 3} => names the file-scoped form, the --staged form, and refuses a choice between them', () => {
        expect({
          namedFileForm: markdown.includes(
            '`npm run ward -- --only <checks> -- <file1> <file2>` — a NAMED file set',
          ),
          stagedForm: markdown.includes(
            '`npm run ward -- --staged` — every SOURCE FILE ORIGIN DOES NOT HAVE YET',
          ),
          exactlyTwo: markdown.includes('There are exactly TWO scoped forms'),
          noChoosing: markdown.includes(
            'your own prompt tells you which one is yours — do not choose between them',
          ),
          stagedTakesNoOtherFlag: markdown.includes(
            'ward REJECTS it combined with `--only`, `--onlyTests` or a file list',
          ),
          bansBareDirectory: markdown.includes('NEVER a bare directory (`-- packages/<pkg>`)'),
        }).toStrictEqual({
          namedFileForm: true,
          stagedForm: true,
          exactlyTwo: true,
          noChoosing: true,
          stagedTakesNoOtherFlag: true,
          bansBareDirectory: true,
        });
      });
    },
  );

  // Rule 5 is the environment-wall rule, and the minion form has to route into the `NEXT:` vocabulary
  // the four templates share. A minion that reports a wall in any other shape reaches a parent that
  // matches on one word and finds nothing.
  describe('rule 5 routes an environment wall into the vocabulary the parent actually matches on', () => {
    it('VALID: {minion rule 5} => names NEXT: wall, and says rework is the answer for unfinished work', () => {
      expect({
        namesWall: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          '`NEXT: wall — <what a human must change>`',
        ),
        onlyForThat: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          'it is the ONLY thing it is for',
        ),
        haltsTheQuest: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          "your parent turns that line into an `operationStatus: 'blocked'` that halts the whole quest",
        ),
        reworkForTheRest: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          'work that merely remains unfinished is `NEXT: rework` instead',
        ),
        noFakeGreen: agentOperatingRulesStatics.leafMinionMarkdown.includes(
          'do NOT report a green ward you did not actually get',
        ),
      }).toStrictEqual({
        namesWall: true,
        onlyForThat: true,
        haltsTheQuest: true,
        reworkForTheRest: true,
        noFakeGreen: true,
      });
    });

    it('VALID: {work-item rule 5} => separates blocked from partial and demands a blockedReason', () => {
      expect({
        partialSpawnsTheSameFailure: agentOperatingRulesStatics.markdown.includes(
          'it costs a pt-chain attempt and spawns exactly the successor that will fail the same way',
        ),
        blockedReasonShape: agentOperatingRulesStatics.markdown.includes(
          'Include a `blockedReason` that names the wall AND what the user must change',
        ),
        freshSessionTest: agentOperatingRulesStatics.markdown.includes(
          '"No session of my role could pass" is a claim about a FRESH session.',
        ),
      }).toStrictEqual({
        partialSpawnsTheSameFailure: true,
        blockedReasonShape: true,
        freshSessionTest: true,
      });
    });
  });

  // Both work-item variants close on the tree-clean requirement, because `signal-back` refuses EVERY
  // outcome while the tree is dirty — `blocked` included. They close on it DIFFERENTLY: a spiritmender
  // commits its own work, and an operator provably cannot see what is sitting there.
  describe('the tree-clean close differs by who did the work', () => {
    it('VALID: {markdown} => tells a file-changing role to land its own work in git first', () => {
      expect({
        landsItsOwn: agentOperatingRulesStatics.markdown.includes(
          'Land whatever you finished in git first, exactly as you would for `partial`',
        ),
        refusesWhileDirty: agentOperatingRulesStatics.markdown.includes(
          '`signal-back` refuses every outcome while the tree is dirty',
        ),
      }).toStrictEqual({ landsItsOwn: true, refusesWhileDirty: true });
    });

    it('VALID: {operatorMarkdown} => says the minions committed, and that clearing the tree is not done by committing', () => {
      expect({
        minionsCommitted: agentOperatingRulesStatics.operatorMarkdown.includes(
          'Your minions commit their own work, so the tree should already be clean when you signal',
        ),
        blockedIncluded: agentOperatingRulesStatics.operatorMarkdown.includes(
          'refuses every outcome, `blocked` included, while it is not',
        ),
        notByCommitting: agentOperatingRulesStatics.operatorMarkdown.includes(
          'Clearing it is a step in your script, not something you do by committing: you cannot see what is sitting there.',
        ),
      }).toStrictEqual({ minionsCommitted: true, blockedIncluded: true, notByCommitting: true });
    });
  });
});
