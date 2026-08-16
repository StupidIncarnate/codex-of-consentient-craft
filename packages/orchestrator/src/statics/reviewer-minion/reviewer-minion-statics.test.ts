import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';
import { reviewerMinionStatics } from './reviewer-minion-statics';

const has = (needle: string): boolean => reviewerMinionStatics.prompt.template.includes(needle);

describe('reviewerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(reviewerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries $DISCIPLINE once and $ARGUMENTS once, with $ARGUMENTS last', () => {
    const { template } = reviewerMinionStatics.prompt;

    expect({
      disciplineCount: template.split('$DISCIPLINE').length - 1,
      argumentsCount: template.split('$ARGUMENTS').length - 1,
      disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
      argumentsOnItsOwnLine: /^\$ARGUMENTS$/mu.test(template),
      disciplineComesFirst: template.indexOf('$DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      briefingHeading: /^## Briefing$/mu.test(template),
    }).toStrictEqual({
      disciplineCount: 1,
      argumentsCount: 1,
      disciplineOnItsOwnLine: true,
      argumentsOnItsOwnLine: true,
      disciplineComesFirst: true,
      argumentsIsTheTail: true,
      briefingHeading: true,
    });
  });

  // The reviewer is a LEAF: it does the reading itself and never spawns a helper, so it embeds the
  // leaf variant rather than the delegating one planner-minion carries.
  it('VALID: template => embeds the leaf-minion operating rules, not the delegating or work-item variant', () => {
    expect({
      leafMinionVariant: has(agentOperatingRulesStatics.leafMinionMarkdown),
      delegatingMinionVariant: has(agentOperatingRulesStatics.delegatingMinionMarkdown),
      workItemVariant: has(agentOperatingRulesStatics.markdown),
    }).toStrictEqual({
      leafMinionVariant: true,
      delegatingMinionVariant: false,
      workItemVariant: false,
    });
  });

  // The five standing concerns are discipline-independent, so they ride the shared template rather
  // than being copied into each discipline pack. Embedded VERBATIM and adjacent to `$DISCIPLINE`, so
  // the session reads one job — a paraphrase here would be a second, staler wording of the same
  // rules, which is exactly what the standalone statics exists to prevent.
  it('VALID: template => embeds the standing review concerns verbatim, right below $DISCIPLINE', () => {
    const { template } = reviewerMinionStatics.prompt;

    expect({
      embedded: has(standardsReviewConcernsStatics.markdown),
      followsTheDiscipline:
        template.indexOf('$DISCIPLINE') < template.indexOf(standardsReviewConcernsStatics.markdown),
      precedesTheMethod:
        template.indexOf(standardsReviewConcernsStatics.markdown) < template.indexOf('## Method'),
      // A discipline pack that duplicated a concern would show up as a second copy of the block.
      copies: template.split(standardsReviewConcernsStatics.markdown).length - 1,
    }).toStrictEqual({
      embedded: true,
      followsTheDiscipline: true,
      precedesTheMethod: true,
      copies: 1,
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(reviewerMinionStatics.prompt.template.length).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  // The orchestrator above it never sees source and nothing runs behind it. A session that does not
  // know it is the last line grades softly.
  it('VALID: template => opens by declaring itself the only session that verifies anything', () => {
    expect({
      onlyVerifier: has('**You are the ONLY session that verifies anything on this round.**'),
      parentNeverSeesSource: has('never opens a source file'),
      namesWhyTheParentIsBlind: has('by design, so that its context survives the whole loop'),
      nobodyBehindIt: has('no\nfresh session is coming behind you to re-check this'),
      whatYouMissShips: has('Whatever you miss\nships too.'),
    }).toStrictEqual({
      onlyVerifier: true,
      parentNeverSeesSource: true,
      namesWhyTheParentIsBlind: true,
      nobodyBehindIt: true,
      whatYouMissShips: true,
    });
  });

  // Carried over from codeweaver Gate 6 in spirit and measured catching real defects in four
  // separate sessions of one quest. Every one of those returned a green ward and a confident summary.
  it('VALID: template => opens every file the round produced rather than trusting the summary', () => {
    expect({
      mandate: has('**OPEN EVERY FILE THE ROUND PRODUCED.**'),
      verbatimCarryOver: has(
        'Do NOT trust the artifact summary alone — open the files\n   the worker actually wrote.',
      ),
      fourSessions: has('caught a real defect in four separate sessions'),
      stubDefect: has(
        'invalid-case tests routed through a stub so the outer parse\n   never executed',
      ),
      cadenceDefect: has('a cadence test that counted frames and measured no spacing'),
      tautologicalDefect: has("a tautological\n   `getAttribute('data-testid')` assertion"),
      proxyDefect: has('a proxy that mocked application code to reach a\n   branch'),
      allWereGreen: has('Every one returned a green ward and a confident summary.'),
      perFileQuestions: has("does it do what the piece's `intent` says must be TRUE?"),
    }).toStrictEqual({
      mandate: true,
      verbatimCarryOver: true,
      fourSessions: true,
      stubDefect: true,
      cadenceDefect: true,
      tautologicalDefect: true,
      proxyDefect: true,
      allWereGreen: true,
      perFileQuestions: true,
    });
  });

  it('VALID: template => verifies against the persisted plan, not against a worker return', () => {
    expect({
      readsThePlanBack: has(
        "**Read the PLAN back from the quest.** `get-quest-planning-notes({ questId: 'QUEST_ID' })`",
      ),
      piecesAreTheTarget: has(
        "The\n   plan's `pieces[]` — each `intent`, `files` and `unitIds` — is what you verify against.",
      ),
      returnIsAClaim: has(
        "A\n   worker's return is a CLAIM about that plan, never a substitute for it.",
      ),
      checklistIsASetDifference: has(
        'Unit\n   coverage is a set difference against `unitIds`, not a recollection.',
      ),
    }).toStrictEqual({
      readsThePlanBack: true,
      piecesAreTheTarget: true,
      returnIsAClaim: true,
      checklistIsASetDifference: true,
    });
  });

  it('VALID: template => fixes red-first with a ripple check and never weakens a test', () => {
    expect({
      redFirst: has('**FIX what you can, RED-FIRST.**'),
      witnessTheRed: has(
        'Watch it fail against unchanged source, change the code, watch\n   it pass',
      ),
      ripple: has('**ripple-check every other place that value renders or that logic runs**'),
      namesWhyRippleIsTheirs: has('a\n   worker sees one piece; you see the round'),
      neverWeaken: has('Never weaken, skip or delete a test to reach green'),
      certifiesTheBreak: has('a test bent to fit broken behaviour certifies the break'),
      falseGreenOrder: has(
        'A false green is FIRST corrected until\n   it fails against the broken behaviour, THEN the behaviour is fixed.',
      ),
    }).toStrictEqual({
      redFirst: true,
      witnessTheRed: true,
      ripple: true,
      namesWhyRippleIsTheirs: true,
      neverWeaken: true,
      certifiesTheBreak: true,
      falseGreenOrder: true,
    });
  });

  it('VALID: template => reports an architectural fix instead of taking it', () => {
    expect({
      reportNotTake: has('**REPORT what you must not take.**'),
      namesTheThreeShapes: has(
        'a new module, a changed contract, a\n   refactor spanning packages',
      ),
      goesToUnfixable: has('goes in `UNFIXABLE` with a named owner, not into your diff'),
      productDecisionsToo: has('So does\n   anything needing a product decision.'),
      oneLineFixIsNotUnfixable: has(
        'A defect you could have closed in a line is not\n   `UNFIXABLE`; it is a fix you skipped.',
      ),
    }).toStrictEqual({
      reportNotTake: true,
      namesTheThreeShapes: true,
      goesToUnfixable: true,
      productDecisionsToo: true,
      oneLineFixIsNotUnfixable: true,
    });
  });

  it('VALID: template => writes the discipline sign-offs batched and stamps no at field', () => {
    expect({
      writesSignoffs: has("**Write your discipline's sign-offs or dispositions.**"),
      packNamesTheField: has(
        'The pack says which field, which verdict\n   vocabulary, and which call.',
      ),
      batched: has('Batch them: one write per round, not one per unit.'),
      noAtField: has('**Do NOT write an\n   `at` field**'),
      serverStamps: has('the server stamps the time'),
      namesTheReason: has('an LLM has no reliable clock'),
    }).toStrictEqual({
      writesSignoffs: true,
      packNamesTheField: true,
      batched: true,
      noAtField: true,
      serverStamps: true,
      namesTheReason: true,
    });
  });

  it('VALID: template => is a leaf — no git, no Agent, no build, no whole-repo ward', () => {
    expect({
      section: /^## What is not yours$/mu.test(reviewerMinionStatics.prompt.template),
      noBuild: has('**`npm run build`** — your parent already built'),
      namesTheDistCorruption: has('Concurrent\n  `tsc` runs corrupt the shared `dist/`'),
      noGit: has('**`git`, at all**'),
      parentOwnsTheCommit: has("Your parent owns the\n  round's one commit."),
      noAgent: has('**The `Agent` tool** — you are a LEAF. You do the reading yourself'),
      noFullWard: has('**The whole-repo `npm run ward`.**'),
      scopedWardExpected: has('**Run SCOPED ward on what YOU changed**'),
      noWardOnUntouchedTree: has('do not ward a tree\n   you did not touch'),
    }).toStrictEqual({
      section: true,
      noBuild: true,
      namesTheDistCorruption: true,
      noGit: true,
      parentOwnsTheCommit: true,
      noAgent: true,
      noFullWard: true,
      scopedWardExpected: true,
      noWardOnUntouchedTree: true,
    });
  });

  // The parent routes on this block without being able to read the code that produced it, so every
  // field has to be answerable on its own. These names are the loop's wire contract.
  it('VALID: template => returns the structured verdict block the orchestrator loop keys on', () => {
    expect({
      verdict: has('VERDICT: accept | rework'),
      pieces: has(
        'PIECES:\n  - <pieceId>: accept|reject — <evidence: what you opened and what you found>',
      ),
      fixesMade: has(
        'FIXES MADE:\n  - <file:line> — <what was wrong, the red you witnessed, the ripple you checked>',
      ),
      remainder: has(
        "REMAINDER:\n  - <what is NOT done, in plan-piece terms, for the next round's planner>",
      ),
      unfixable: has(
        'UNFIXABLE:\n  - <architectural or product-decision items, with a named owner>',
      ),
      signoffsWritten: has('SIGNOFFS WRITTEN: <count and track>'),
      ward: has('WARD: green | red — <what and why>'),
      parentActsWithoutJudgement: has(
        '## What you return — STRUCTURED, because your parent acts on it without judgement',
      ),
      everyLineCarriesEvidence: has('Every line carries evidence.'),
      adjectivesRejected: has(
        '`PIECES` entries that say "verified" or "looks correct" are the report\ngrading itself',
      ),
      fixNeedsAWitnessedRed: has(
        'A `FIXES MADE` line with no\nwitnessed red is a change, not a fix.',
      ),
    }).toStrictEqual({
      verdict: true,
      pieces: true,
      fixesMade: true,
      remainder: true,
      unfixable: true,
      signoffsWritten: true,
      ward: true,
      parentActsWithoutJudgement: true,
      everyLineCarriesEvidence: true,
      adjectivesRejected: true,
      fixNeedsAWitnessedRed: true,
    });
  });

  // REMAINDER is the field the loop terminates on, so it is the one field that can be wrong in two
  // directions. Both costs are named, because a bare "be honest" is the instruction that gets dropped.
  it('VALID: template => names the cost of padding AND of hiding the remainder', () => {
    expect({
      emptyEndsTheLoop: has('**An EMPTY `REMAINDER` is what ends the loop.**'),
      cannotRoundEitherWay: has('the one field you cannot round off in\neither direction'),
      paddingBurnsARound: has('**Padding it burns a round the quest cannot afford.**'),
      namesTheRoundBudget: has(
        'full planner, a worker chain and another reviewer, against a budget of three rounds',
      ),
      hidingShipsTheHole: has('**Hiding a real remainder ships the hole.**'),
      nothingRunsAfterYou: has('Nothing runs after you.'),
      ledgerReportsItComplete: has(
        'is reported complete by the ledger forever, and no later role goes back for it',
      ),
      cleanRoundIsAGoodAnswer: has(
        'a clean round backed\nby a real reading is worth more than a manufactured finding',
      ),
    }).toStrictEqual({
      emptyEndsTheLoop: true,
      cannotRoundEitherWay: true,
      paddingBurnsARound: true,
      namesTheRoundBudget: true,
      hidingShipsTheHole: true,
      nothingRunsAfterYou: true,
      ledgerReportsItComplete: true,
      cleanRoundIsAGoodAnswer: true,
    });
  });
});
