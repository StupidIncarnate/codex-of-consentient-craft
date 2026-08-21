import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { disciplineImplementationStatics } from './discipline-implementation-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineImplementationStatics;

// The reviewer template's return block DECLARES the exact form a discipline with no sign-off track
// reports its `SIGNOFFS` field in. This pack and `disciplineBugReproStatics` both carry that string
// verbatim, so it is extracted from the declaration rather than spelled a third time here.
const SIGNOFFS_NO_TRACK_DECLARATION =
  /^SIGNOFFS: <count and track, or "(?<noTrack>[^"]+)">$/mu.exec(
    reviewerMinionStatics.prompt.template,
  );

const SIGNOFFS_NO_TRACK_FIELD = `SIGNOFFS: ${SIGNOFFS_NO_TRACK_DECLARATION?.groups?.noTrack ?? ''}`;

// THE `CONTEXT:` BLOCK'S HEADINGS. This file owns one half of that pair and no more. `statics/` may
// import only `statics/`, so this test cannot reach `codeweaverScopeBlockTransformer` to compare the
// pack against what the transformer really emits. That comparison lives in
// `packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.test.ts`,
// which MAY import this pack and derives BOTH sides live.
//
// A copy of the transformer's five heading strings used to sit here and get matched positionally.
// It was deleted rather than kept: a hand-written copy goes stale the moment the transformer moves,
// and passes while it is stale, which is the failure the live pin exists to close.
//
// What this file still holds is the half nothing else does. The enumeration below is PARSED off
// `plannerMarkdown`, never listed, so a heading added, dropped or renamed IN THE PACK fails here.
const CONTEXT_SECTION = plannerMarkdown.slice(
  plannerMarkdown.indexOf('## Your denominator is the `CONTEXT:` block in your brief'),
  plannerMarkdown.indexOf('## Cut the cell into CHUNKS'),
);

const ENUMERATED_CONTEXT_HEADINGS = Array.from(
  CONTEXT_SECTION.matchAll(/^\d\. `(?<heading>[^`]+)`/gmu),
).map((match) => match.groups?.heading ?? '');

// The block states its own count twice, in words. Both have to follow the list rather than the
// other way round.
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

const ENUMERATED_COUNT_WORD = String(COUNT_WORDS[ENUMERATED_CONTEXT_HEADINGS.length]);

// Naming a tool in an operator's discipline block is what permits that tool. The operator template
// says so in as many words: "Your discipline permits a tool by naming it here." Every name below
// sits on that template's FORBIDDEN half. A pack that mentions one hands the operator back the exact
// context leak the operator/minion split exists to close.
const FORBIDDEN_IN_AN_OPERATOR_BLOCK = [
  'get-architecture',
  'get-syntax-rules',
  'get-testing-patterns',
  'discover',
  'get-project-map',
  'get-project-inventory',
  'get-folder-detail',
  'get-blight-checklist',
  'npm run ward',
  'git log',
  'git diff',
  'git commit',
];

describe('disciplineImplementationStatics', () => {
  it('VALID: exported value => carries exactly the four blocks, all non-empty strings', () => {
    expect(disciplineImplementationStatics).toStrictEqual({
      operatorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  // TWO FIELDS. The contract is that there is no third. It was four. `SCOPE` and `EMPTY` both went,
  // each for its own reason:
  //
  // - `SCOPE` duplicated `Your operation item:` / `Your flows:` / `Your packages:`. Those three
  //   render from live quest data through `workItemToPromptTransformer` into `$ARGUMENTS`, so pack
  //   prose could only drift from them.
  // - `EMPTY` duplicated the operator script's own "a plan with zero chunks dispatches zero
  //   workers".
  //
  // Everything else this block ever carried — the authority order, the Seams markers, repair
  // authority, the spec-movement rules — was material the operator could only COPY into a brief.
  // The operator could pass those instructions on. It could not act on them. All of it lives in the
  // three minion blocks now.
  describe('operatorMarkdown is two fields and nothing else', () => {
    it('VALID: operatorMarkdown => carries exactly RESOURCE and RESET, in that order', () => {
      expect(
        Array.from(operatorMarkdown.matchAll(/\*\*([A-Z]+):\*\*/gu)).map((match) => match[1]),
      ).toStrictEqual(['RESOURCE', 'RESET']);
    });

    it('VALID: operatorMarkdown => names no tool the operator template forbids', () => {
      expect(
        FORBIDDEN_IN_AN_OPERATOR_BLOCK.filter((tool) => operatorMarkdown.includes(tool)),
      ).toStrictEqual([]);
    });

    it('VALID: operatorMarkdown => stays inside the budget that keeps this session small', () => {
      expect(operatorMarkdown.length).toBeLessThan(1_200);
    });

    // Both fields are "none" here. Saying so is the whole content: it stops the operator going
    // looking for a server or a lever. The SCOPE this block used to carry is already in the
    // operator's `$ARGUMENTS`: `Your operation item:`, `Your flows:`, `Your packages:`, and the
    // codeweaver-only nodes/observables/contracts/seams render. Those come from live quest data.
    // Prose here could only drift from them.
    it('VALID: operatorMarkdown => is both fields as none, and restates no scope of its own', () => {
      expect({
        resourceNone: operatorMarkdown.includes(
          '**RESOURCE:** none. This discipline runs no server and starts none.',
        ),
        resetNone: operatorMarkdown.includes('**RESET:** none.'),
        noScopeProse: operatorMarkdown.includes('CELL'),
        noDenominatorProse: operatorMarkdown.includes('denominator'),
        noEmptyRule: operatorMarkdown.includes('zero chunks'),
      }).toStrictEqual({
        resourceNone: true,
        resetNone: true,
        noScopeProse: false,
        noDenominatorProse: false,
        noEmptyRule: false,
      });
    });

    // The cell framing did not vanish. It moved to the planner, which reads the code and cuts the
    // chunks.
    it('VALID: plannerMarkdown => carries the cell framing the operator block used to hold', () => {
      expect({
        cell: plannerMarkdown.includes('Your cell is one (package, flow) pair'),
        foundationIsNotEmpty: plannerMarkdown.includes('A foundation cell is never an empty one.'),
        denominatorIsTheContextBlock: plannerMarkdown.includes(
          '## Your denominator is the `CONTEXT:` block in your brief',
        ),
        noChecklistTool: plannerMarkdown.includes('**No checklist tool answers it'),
        // `codeweaverScopeBlockTransformer` emits FIVE headings, not four. The planner needs those
        // names to find its acceptance targets inside a context block its parent pasted whole. The
        // operator cannot label them, because it cannot read them.
        countsThemAsFive: plannerMarkdown.includes(
          'that context carries five headings nothing else',
        ),
        namesTheRenderedHeadings: [
          'Your nodes',
          'Must satisfy',
          'Contracts you own',
          'Design decisions constraining your nodes',
          'Seams',
        ].every((heading) => plannerMarkdown.includes(heading)),
        // The design decisions are already pasted in. A planner that calls `get-quest` for them
        // spends a tool round trip on text it is holding.
        designDecisionsNeedNoToolCall: plannerMarkdown.includes(
          '**Do not call `get-quest` for it. It is already in your brief.**',
        ),
      }).toStrictEqual({
        cell: true,
        foundationIsNotEmpty: true,
        denominatorIsTheContextBlock: true,
        noChecklistTool: true,
        countsThemAsFive: true,
        namesTheRenderedHeadings: true,
        designDecisionsNeedNoToolCall: true,
      });
    });

    // CROSS-FILE PAIR — `codeweaverScopeBlockTransformer` ←→ this pack's `plannerMarkdown`. The
    // planner keys its WHOLE denominator on the `CONTEXT:` block its parent pasted in, and names
    // the headings that block carries so it can find its acceptance targets inside it. That block
    // is spliced by the transformer; the operator cannot label those headings, because it cannot
    // read them. The enumeration here is PARSED off the live pack, never listed, so this test fails
    // on any change made IN THE PACK. Whether those names still match what the transformer emits is
    // pinned in that transformer's own test, which derives both sides live.
    //
    // What breaks if they diverge: the planner hunts for a heading nothing renders, finds no
    // acceptance targets under it, and plans the cell against the ledger's label instead — which is
    // the one source the pack's own authority order puts last.
    it('VALID: plannerMarkdown => enumerates five CONTEXT headings and states that count in its own prose', () => {
      expect({
        enumeratedCount: ENUMERATED_CONTEXT_HEADINGS.length,
        theProseCountMatchesTheList: plannerMarkdown.includes(
          `carries ${ENUMERATED_COUNT_WORD} headings`,
        ),
        theSecondProseCountMatchesToo: plannerMarkdown.includes(
          `Those ${ENUMERATED_COUNT_WORD} render from the spec`,
        ),
      }).toStrictEqual({
        enumeratedCount: 5,
        theProseCountMatchesTheList: true,
        theSecondProseCountMatchesToo: true,
      });
    });
  });

  // THE CONTRACT WITH THE WORKER TEMPLATE. Its method steps 3 and 4 point at these two headings BY
  // NAME. They do not hard-code one discipline's method into a template the other four disciplines
  // share. A pack missing either heading serves a worker two steps that resolve to nothing.
  describe('workerMarkdown carries the two headings the worker template points at', () => {
    it('VALID: workerMarkdown => carries ### The work and ### The proof, work first', () => {
      expect({
        work: /^### The work$/mu.test(workerMarkdown),
        proof: /^### The proof$/mu.test(workerMarkdown),
        workFirst: workerMarkdown.indexOf('### The work') < workerMarkdown.indexOf('### The proof'),
      }).toStrictEqual({ work: true, proof: true, workFirst: true });
    });

    it('VALID: ### The work => is the red-first build loop, in the order the worker runs it', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        steps: Array.from(work.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        failingTestFirst: work.includes(
          '**Write the failing test FIRST, driven by the observables.**',
        ),
        shell: work.includes('**Shell the implementation** with the right signature and no logic'),
        implementUntilGreen: work.includes('**Implement until green**'),
        walkTheDiff: work.includes('**Walk your own diff for the branches you added.**'),
        folderTypeDecidesCompanions: work.includes('**Which tests are yours, by FOLDER TYPE'),
        integrationInsteadOfUnit: work.includes(
          '**`flows/` and `startup/` require an `.integration.test.ts` INSTEAD of a unit test.**',
        ),
        noPlaywright: work.includes('**The one boundary: Playwright `.e2e.ts` is NOT yours.**'),
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **', '4. **'],
        failingTestFirst: true,
        shell: true,
        implementUntilGreen: true,
        walkTheDiff: true,
        folderTypeDecidesCompanions: true,
        integrationInsteadOfUnit: true,
        noPlaywright: true,
      });
    });

    // On this discipline the proof is a BEHAVIOURAL red: the assertion ran, reached the shelled
    // code, and disagreed with it. A structural red proves only that the file was not there yet. An
    // import error, a missing export and a type error are all structural.
    it('VALID: ### The proof => demands a behavioural red and the actual value it printed', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        behaviourallyNotStructurally: proof.includes(
          '**Watch it fail BEHAVIOURALLY, not STRUCTURALLY.**',
        ),
        wholeOfTheEvidence: proof.includes('is the whole of your evidence'),
        structuralProvesNothing: proof.includes(
          'A structural red proves nothing about your assertion.',
        ),
        wrongValue: proof.includes('**The red you need is a WRONG VALUE.**'),
        fixTheAssertionFirst: proof.includes('Fix the assertion before you write a line of logic'),
        evidencePerUnit: proof.includes('write one line per unit'),
        notItFailedFirst: proof.includes('"It failed first" is not evidence.'),
        aRealExample: proof.includes("`expected 'draft', received undefined` is"),
      }).toStrictEqual({
        behaviourallyNotStructurally: true,
        wholeOfTheEvidence: true,
        structuralProvesNothing: true,
        wrongValue: true,
        fixTheAssertionFirst: true,
        evidencePerUnit: true,
        notItFailedFirst: true,
        aRealExample: true,
      });
    });

    // The three markers live in a table now. The left column is the situation. The right column is
    // the marker that situation writes. These pins keep a marker from drifting onto the wrong
    // situation, which no typecheck would catch.
    it('VALID: workerMarkdown => names the three commit-body markers this session writes', () => {
      expect({
        heading: workerMarkdown.includes(
          '### Three commit markers, and you are the session that writes them',
        ),
        adjusted: workerMarkdown.includes(
          '| Restated an observable to what was achievable | `ADJUSTED:` |',
        ),
        added: workerMarkdown.includes('| Added an observable the flow implied | `ADDED:` |'),
        repair: workerMarkdown.includes(
          "| Repaired a shortfall in another cell's already-built half | `REPAIR:` |",
        ),
        firstLineOfTheBody: workerMarkdown.includes('**the first line of your commit BODY**'),
        subjectUnchanged: workerMarkdown.includes('The subject stays `chunk <n>: <title>`.'),
      }).toStrictEqual({
        heading: true,
        adjusted: true,
        added: true,
        repair: true,
        firstLineOfTheBody: true,
        subjectUnchanged: true,
      });
    });
  });

  // What moved DOWN from the operator block. Only the planner can act on any of it. The planner
  // reads the code, the history and the scope block. The operator reads none of them.
  describe('plannerMarkdown holds what the operator block used to relay', () => {
    it('VALID: plannerMarkdown => carries the four-source authority order', () => {
      expect({
        heading: plannerMarkdown.includes('## What is authoritative, when four sources disagree'),
        flowGraphWins: plannerMarkdown.includes('**The flow graph wins.**'),
        observablesNotGospel: plannerMarkdown.includes(
          '**The observables express that intent but are not gospel.**',
        ),
        gitIsTheLog: plannerMarkdown.includes('**Git is the authority log.**'),
        exactIsNotComplete: plannerMarkdown.includes('Exact is not complete. The partition covers'),
      }).toStrictEqual({
        heading: true,
        flowGraphWins: true,
        observablesNotGospel: true,
        gitIsTheLog: true,
        exactIsNotComplete: true,
      });
    });

    it('VALID: plannerMarkdown => carries all three Seams markers and the repair authority', () => {
      expect({
        alreadyBuilt: plannerMarkdown.includes('**ALREADY BUILT**'),
        againstCommittedCode: plannerMarkdown.includes('against real COMMITTED CODE'),
        notBuiltYet: plannerMarkdown.includes('**NOT BUILT YET** — not yours.'),
        noSessionOwnsIt: plannerMarkdown.includes('**NO SESSION OWNS IT**'),
        repairIsExpected: plannerMarkdown.includes('**Repair is expected work, not scope creep.**'),
        relevanceNotPackage: plannerMarkdown.includes(
          'The limit is relevance, not package boundary.',
        ),
        neverRevert: plannerMarkdown.includes(
          '**Never plan a chunk that deletes or reverts what another session already committed.**',
        ),
      }).toStrictEqual({
        alreadyBuilt: true,
        againstCommittedCode: true,
        notBuiltYet: true,
        noSessionOwnsIt: true,
        repairIsExpected: true,
        relevanceNotPackage: true,
        neverRevert: true,
      });
    });

    it('VALID: plannerMarkdown => carries both spec-movement directions and their commit markers', () => {
      expect({
        additiveOnly: plannerMarkdown.includes('ADDITIVE-ONLY'),
        deleteRefused: plannerMarkdown.includes('**Every delete is refused. So is a new flow.**'),
        cannotBeMet: plannerMarkdown.includes('**When an observable cannot be met as written.**'),
        genuineEffort: plannerMarkdown.includes('The bar is genuine effort, not first resistance'),
        nearestAchievable: plannerMarkdown.includes('Deliver the NEAREST achievable'),
        adjustedMarker: plannerMarkdown.includes(
          "is what puts the `ADJUSTED:` line in the worker's commit body",
        ),
        flowImplies: plannerMarkdown.includes(
          '**When the flow implies an outcome nobody wrote down.**',
        ),
        constraintOnYourself: plannerMarkdown.includes(
          'An observable you add is a constraint on YOURSELF',
        ),
        addedMarker: plannerMarkdown.includes('Flag it in `NOTES` so the commit carries `ADDED:`'),
      }).toStrictEqual({
        additiveOnly: true,
        deleteRefused: true,
        cannotBeMet: true,
        genuineEffort: true,
        nearestAchievable: true,
        adjustedMarker: true,
        flowImplies: true,
        constraintOnYourself: true,
        addedMarker: true,
      });
    });

    it('VALID: plannerMarkdown => writes the ward command per chunk, by folder type', () => {
      expect({
        unitDefault: plannerMarkdown.includes('`--only lint,typecheck,unit` for contracts'),
        integrationForFlowsAndStartup: plannerMarkdown.includes(
          '`--only lint,typecheck,unit,integration` when the chunk includes a `flows/` or `startup/` file',
        ),
        integrationInsteadOfUnit: plannerMarkdown.includes(
          'take an `.integration.test.ts` INSTEAD of a unit test',
        ),
        neverE2e: plannerMarkdown.includes(
          'Never `e2e`. No chunk on this discipline authors Playwright.',
        ),
      }).toStrictEqual({
        unitDefault: true,
        integrationForFlowsAndStartup: true,
        integrationInsteadOfUnit: true,
        neverE2e: true,
      });
    });

    it('VALID: plannerMarkdown => lists all five things a chunk NOTES must carry', () => {
      expect({
        flowFirst: plannerMarkdown.includes('**The flow, and where the chunk sits in it.**'),
        observablesVerbatim: plannerMarkdown.includes(
          '**The observables it must satisfy, quoted VERBATIM.**',
        ),
        contracts: plannerMarkdown.includes('**The contracts it takes and returns.**'),
        designDecisions: plannerMarkdown.includes('**The design decisions that constrain it**'),
        alreadyBuiltExports: plannerMarkdown.includes(
          '**The already-built exports it wires into.**',
        ),
        // The epigram this replaced ("a worker that understands the flow writes assertions that
        // mean something") stated no rule. The ban does. A `NOTES` cut to a path and a signature is
        // the failure. The sentence after the ban is what that costs.
        neverJustAPath: plannerMarkdown.includes(
          '**Never cut `NOTES` down to a file path and a signature.**',
        ),
      }).toStrictEqual({
        flowFirst: true,
        observablesVerbatim: true,
        contracts: true,
        designDecisions: true,
        alreadyBuiltExports: true,
        neverJustAPath: true,
      });
    });

    // The pt chain is UNBOUNDED on this discipline. Nothing server-side ever stops a round that is
    // not converging. Only the planner can see it, because only the planner reads history. Four
    // prompts define a wall as environment-only, so this section has to read as a DECLARED
    // exception rather than as a contradiction.
    it('VALID: plannerMarkdown => turns a non-shrinking pt chain into a wall it alone can see', () => {
      expect({
        heading: plannerMarkdown.includes(
          "## A pt chain that stopped shrinking is this discipline's one declared `wall`",
        ),
        restatesTheEnvironmentOnlyDefinition: plannerMarkdown.includes(
          'Your template defines `wall` as an environment wall and nothing else',
        ),
        declaresItAsTheOneException: plannerMarkdown.includes(
          '**This pack declares exactly ONE exception. This section is\nit.**',
        ),
        nothingElseQualifies: plannerMarkdown.includes(
          'Nothing else you could have written a\nchunk for is.',
        ),
        unbounded: plannerMarkdown.includes("This discipline's pt chain is\nUNBOUNDED"),
        readTheReviewCommits: plannerMarkdown.includes(
          "Read the previous rounds' `review <n>:` commit bodies",
        ),
        notShrunkIsAWall: plannerMarkdown.includes(
          '**If it has not SHRUNK, this is a wall, not slow progress.**',
        ),
        quotesBothTextsAsEvidence: plannerMarkdown.includes(
          '**Put both texts in `SUMMARY`, quoted, before you return.**',
        ),
        onlySessionThatCanSeeIt: plannerMarkdown.includes(
          'Only you can see this. You are the only session\nthat reads history.',
        ),
        aShrinkingRemainderIsNotAWall: plannerMarkdown.includes(
          '**A `REWORK:` line that shrank at all is not this case.**',
        ),
      }).toStrictEqual({
        heading: true,
        restatesTheEnvironmentOnlyDefinition: true,
        declaresItAsTheOneException: true,
        nothingElseQualifies: true,
        unbounded: true,
        readTheReviewCommits: true,
        notShrunkIsAWall: true,
        quotesBothTextsAsEvidence: true,
        onlySessionThatCanSeeIt: true,
        aShrinkingRemainderIsNotAWall: true,
      });
    });

    it('VALID: plannerMarkdown => keeps a spike on this discipline rather than removing it', () => {
      expect({
        kept: plannerMarkdown.includes('## Spikes are KEPT on this discipline'),
        firstPassNotProbe: plannerMarkdown.includes('a first pass, not a throwaway probe'),
        spikeTmp: plannerMarkdown.includes('under `spike-tmp/`'),
      }).toStrictEqual({ kept: true, firstPassNotProbe: true, spikeTmp: true });
    });
  });

  describe('reviewerMarkdown', () => {
    it('VALID: reviewerMarkdown => names all four false-green shapes with their measured origin', () => {
      expect({
        redStepInvisible: reviewerMarkdown.includes(
          '## The red step is structurally invisible — assume it was skipped',
        ),
        everyMinionSkippedIt: reviewerMarkdown.includes('EVERY minion skipped it'),
        askWhatWouldFail: reviewerMarkdown.includes(
          "Read each new test's assertion. Ask what value would make it fail.",
        ),
        nameThatValue: reviewerMarkdown.includes('**Name that value in your evidence.**'),
        stub: reviewerMarkdown.includes('**A stub that swallowed the subject.**'),
        measurement: reviewerMarkdown.includes('**A measurement that measured nothing.**'),
        tautology: reviewerMarkdown.includes('**A tautological assertion.**'),
        proxy: reviewerMarkdown.includes('**A proxy that mocked application code.**'),
        shapeNotText: reviewerMarkdown.includes('Look for the shape, not the text'),
      }).toStrictEqual({
        redStepInvisible: true,
        everyMinionSkippedIt: true,
        askWhatWouldFail: true,
        nameThatValue: true,
        stub: true,
        measurement: true,
        tautology: true,
        proxy: true,
        shapeNotText: true,
      });
    });

    it('VALID: reviewerMarkdown => reports no sign-off track and still writes every disposition', () => {
      expect({
        noTrack: reviewerMarkdown.includes('**This discipline writes no SIGN-OFF.**'),
        theExactField: reviewerMarkdown.includes(
          'Report `SIGNOFFS: none — this discipline has no track`',
        ),
        neverInventAField: reviewerMarkdown.includes('Never invent a field to fill it.'),
        dispositionsAreDifferent: reviewerMarkdown.includes(
          '**The per-unit dispositions the standing concerns ask for are a DIFFERENT record. You write every\none.**',
        ),
        unboundedRetriesForever: reviewerMarkdown.includes('retries forever instead of surfacing'),
      }).toStrictEqual({
        noTrack: true,
        theExactField: true,
        neverInventAField: true,
        dispositionsAreDifferent: true,
        unboundedRetriesForever: true,
      });
    });

    // CROSS-FILE PAIR — `reviewerMinionStatics`' return block ←→ this pack's sign-off section. The
    // template's `SIGNOFFS:` line DECLARES the fixed string a discipline with no track reports; the
    // needle is extracted from that declaration rather than written down a second time, and this
    // pack must carry it verbatim and spell it no other way. `disciplineBugReproStatics` carries
    // the identical string and its own test derives it the same way.
    //
    // What breaks if they diverge: the field is the operator's only evidence that a track was
    // considered rather than forgotten. An invented spelling reads as a real count, and a dropped
    // field reads as a reviewer that skipped the question.
    it("VALID: reviewerMarkdown => reports SIGNOFFS in the reviewer template's own declared no-track form", () => {
      expect({
        templateStillDeclaresTheNoTrackForm: SIGNOFFS_NO_TRACK_DECLARATION !== null,
        packCarriesItVerbatim: reviewerMarkdown.includes(SIGNOFFS_NO_TRACK_FIELD),
        packSpellsItNoOtherWay: Array.from(reviewerMarkdown.matchAll(/SIGNOFFS:[^`\n]*/gu)).map(
          (match) => match[0],
        ),
      }).toStrictEqual({
        templateStillDeclaresTheNoTrackForm: true,
        packCarriesItVerbatim: true,
        packSpellsItNoOtherWay: [SIGNOFFS_NO_TRACK_FIELD],
      });
    });

    it('VALID: reviewerMarkdown => routes undeclared spec movement and undeclared repair into rework', () => {
      expect({
        specMovementDeclared: reviewerMarkdown.includes(
          '**Spec movement is declared, or it did not happen.**',
        ),
        specMovementIsRework: reviewerMarkdown.includes(
          'If either is missing, that is `NEXT: rework`',
        ),
        repairDeclared: reviewerMarkdown.includes('**Cross-package repair is declared.**'),
        seamIsRework: reviewerMarkdown.includes(
          'this round could not reach it, that\n  is `NEXT: rework` with that package named',
        ),
        noPlaywright: reviewerMarkdown.includes('**No Playwright.**'),
      }).toStrictEqual({
        specMovementDeclared: true,
        specMovementIsRework: true,
        repairDeclared: true,
        seamIsRework: true,
        noPlaywright: true,
      });
    });
  });

  describe('budgets', () => {
    it('VALID: the three minion blocks => each stay inside their budget', () => {
      expect({
        planner: plannerMarkdown.length < 9_000,
        worker: workerMarkdown.length < 9_000,
        reviewer: reviewerMarkdown.length < 9_000,
      }).toStrictEqual({ planner: true, worker: true, reviewer: true });
    });
  });
});
