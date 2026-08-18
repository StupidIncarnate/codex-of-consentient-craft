import { disciplineImplementationStatics } from './discipline-implementation-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineImplementationStatics;

// A tool named in an operator's discipline block is a GRANT — the operator template's table says so
// in as many words ("A discipline may NAME A TOOL THE ALLOWED LIST DOES NOT"). Every name here is on
// that template's FORBIDDEN half, so a mention would hand the session back the exact context leak
// the operator/minion split exists to close.
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

  // TWO FIELDS, and the contract is that there is no third. It was four. `SCOPE` and `EMPTY` both
  // went, for different reasons: `SCOPE` duplicated `Your operation item:` / `Your flows:` /
  // `Your packages:`, which `workItemToPromptTransformer` generates into `$ARGUMENTS` from live
  // quest data, so pack prose could only drift from it; `EMPTY` duplicated the operator script's own
  // "a plan with zero chunks dispatches zero workers". Everything else this block ever carried — the
  // authority order, the Seams markers, repair authority, the spec-movement rules — was material the
  // operator could only COPY into a brief, which made it a relay for instructions rather than a
  // reader of them. All of it lives in the three minion blocks now.
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

    // Both fields are "none" here, and saying so is the whole content: it stops the session going
    // looking for a server or a lever. The SCOPE this block used to carry is already in the
    // operator's `$ARGUMENTS` — `Your operation item:`, `Your flows:`, `Your packages:`, and the
    // codeweaver-only nodes/observables/contracts/seams render — generated from live quest data,
    // where prose here could only drift from it.
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

    // The cell framing did not vanish, it moved to the session that reads code and cuts the chunks.
    it('VALID: plannerMarkdown => carries the cell framing the operator block used to hold', () => {
      expect({
        cell: plannerMarkdown.includes('Your cell is one (package, flow) pair'),
        foundationIsNotEmpty: plannerMarkdown.includes(
          'the thing every other cell builds on, never an empty one',
        ),
        denominatorIsTheContextBlock: plannerMarkdown.includes(
          '## Your denominator is the `CONTEXT:` block in your brief',
        ),
        noChecklistTool: plannerMarkdown.includes('**No checklist tool answers it'),
        // The four headings `codeweaverScopeBlockTransformer` actually emits. Naming them is what
        // lets this session find its acceptance targets inside a context block its parent pasted
        // whole — the operator cannot label them, because it cannot read them.
        namesTheRenderedHeadings: [
          'Your nodes',
          'Must satisfy',
          'Contracts you own',
          'Seams',
        ].every((heading) => plannerMarkdown.includes(heading)),
      }).toStrictEqual({
        cell: true,
        foundationIsNotEmpty: true,
        denominatorIsTheContextBlock: true,
        noChecklistTool: true,
        namesTheRenderedHeadings: true,
      });
    });
  });

  // THE CONTRACT WITH THE WORKER TEMPLATE. Its method steps 3 and 4 point at these two headings BY
  // NAME rather than hard-coding one discipline's method into a template four other disciplines have
  // to argue with. A pack missing either heading serves a worker two steps that resolve to nothing.
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
        walkTheDiff: work.includes('**Walk your own diff for the branches you added**'),
        folderTypeDecidesCompanions: work.includes('**Which tests are yours, by FOLDER TYPE'),
        integrationInsteadOfUnit: work.includes(
          '**`flows/`\nand `startup/` require an `.integration.test.ts` INSTEAD of a unit test**',
        ),
        noPlaywright: work.includes('**The\none boundary: Playwright `.e2e.ts` is NOT yours**'),
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

    // On this discipline the proof is a BEHAVIOURAL red: the assertion ran, reached the shelled code,
    // and disagreed with it. A structural red — import error, missing export, type error — proves the
    // file was not there yet and nothing about the assertion.
    it('VALID: ### The proof => demands a behavioural red and the actual value it printed', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        behaviourallyNotStructurally: proof.includes(
          '**Watch it fail BEHAVIOURALLY, not STRUCTURALLY**',
        ),
        wholeOfTheEvidence: proof.includes('it is the\nwhole of your evidence'),
        structuralProvesNothing: proof.includes(
          'A red that is an import\nerror, a missing export or a type error proves nothing about your assertion',
        ),
        wrongValue: proof.includes('**The red you need is a WRONG VALUE**'),
        fixTheAssertionFirst: proof.includes('fix the assertion before you write a line of logic'),
        evidencePerUnit: proof.includes('one line per unit'),
        notItFailedFirst: proof.includes('"It failed first" is not evidence'),
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

    it('VALID: workerMarkdown => names the three commit-body markers this session writes', () => {
      expect({
        heading: workerMarkdown.includes(
          '### Three commit markers, and you are the session that writes them',
        ),
        adjusted: workerMarkdown.includes('`ADJUSTED:`'),
        added: workerMarkdown.includes('`ADDED:`'),
        repair: workerMarkdown.includes('`REPAIR:`'),
        subjectUnchanged: workerMarkdown.includes('The subject stays `chunk <n>: <title>`.'),
      }).toStrictEqual({
        heading: true,
        adjusted: true,
        added: true,
        repair: true,
        subjectUnchanged: true,
      });
    });
  });

  // What moved DOWN from the operator block. Each of these is something only the planner can act on:
  // it reads the code, the history and the scope block, and the operator reads none of them.
  describe('plannerMarkdown holds what the operator block used to relay', () => {
    it('VALID: plannerMarkdown => carries the four-source authority order', () => {
      expect({
        heading: plannerMarkdown.includes('## What is authoritative, when four sources disagree'),
        flowIsNorthStar: plannerMarkdown.includes('**The flow graph is the north star.**'),
        observablesNotGospel: plannerMarkdown.includes(
          '**The observables express that intent but are not gospel**',
        ),
        gitIsTheLog: plannerMarkdown.includes('**Git is the authority log.**'),
        exactIsNotComplete: plannerMarkdown.includes('**Exact is not complete**'),
      }).toStrictEqual({
        heading: true,
        flowIsNorthStar: true,
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
          "**Never plan a chunk that deletes or reverts another session's committed work.**",
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
        deleteRefused: plannerMarkdown.includes(
          '**Every delete is refused, and so is a new flow.**',
        ),
        cannotBeMet: plannerMarkdown.includes('**When an observable cannot be met as written.**'),
        genuineEffort: plannerMarkdown.includes('The bar is genuine effort, not first resistance'),
        nearestAchievable: plannerMarkdown.includes('deliver the NEAREST achievable'),
        adjustedMarker: plannerMarkdown.includes('that is what puts the `ADJUSTED:`'),
        flowImplies: plannerMarkdown.includes(
          '**When the flow implies an outcome nobody wrote down**',
        ),
        constraintOnYourself: plannerMarkdown.includes(
          'an observable you add is a constraint on YOURSELF',
        ),
        addedMarker: plannerMarkdown.includes('flag it in `NOTES` so the commit carries `ADDED:`'),
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
        neverE2e: plannerMarkdown.includes('Never `e2e` — no chunk on this'),
      }).toStrictEqual({
        unitDefault: true,
        integrationForFlowsAndStartup: true,
        neverE2e: true,
      });
    });

    // The pt chain is UNBOUNDED on this discipline, so nothing server-side ever stops a round that is
    // not converging. Only this session can see it, because only this session reads history.
    it('VALID: plannerMarkdown => turns a non-shrinking pt chain into a wall it alone can see', () => {
      expect({
        heading: plannerMarkdown.includes('## The one thing that makes this chain a wall'),
        unbounded: plannerMarkdown.includes("This discipline's pt chain is UNBOUNDED"),
        readTheReviewCommits: plannerMarkdown.includes(
          "read the previous rounds' `review <n>:` commit bodies",
        ),
        notShrunkIsAWall: plannerMarkdown.includes(
          '**If it has not SHRUNK, this is a wall, not slow progress**',
        ),
        onlySessionThatCanSeeIt: plannerMarkdown.includes(
          'You are the only session that reads\nhistory, so you are the only one that can see it.',
        ),
      }).toStrictEqual({
        heading: true,
        unbounded: true,
        readTheReviewCommits: true,
        notShrunkIsAWall: true,
        onlySessionThatCanSeeIt: true,
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
          '**read the assertion and ask what value would\nmake it fail.**',
        ),
        stub: reviewerMarkdown.includes('**A stub that swallowed the subject.**'),
        measurement: reviewerMarkdown.includes('**A measurement that measured nothing.**'),
        tautology: reviewerMarkdown.includes('**A tautological assertion.**'),
        proxy: reviewerMarkdown.includes('**A proxy that mocked application code.**'),
        shapeNotText: reviewerMarkdown.includes('look for the shape, not the text'),
      }).toStrictEqual({
        redStepInvisible: true,
        everyMinionSkippedIt: true,
        askWhatWouldFail: true,
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
        neverInventAField: reviewerMarkdown.includes('never invent a field to fill it'),
        dispositionsAreDifferent: reviewerMarkdown.includes(
          '**The per-unit dispositions the standing concerns ask for are a DIFFERENT record, and you write\nevery one.**',
        ),
        unboundedRetriesForever: reviewerMarkdown.includes(
          'that retries forever instead of surfacing',
        ),
      }).toStrictEqual({
        noTrack: true,
        theExactField: true,
        neverInventAField: true,
        dispositionsAreDifferent: true,
        unboundedRetriesForever: true,
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
          'this round could not reach is\n  `NEXT: rework` with that package named',
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
