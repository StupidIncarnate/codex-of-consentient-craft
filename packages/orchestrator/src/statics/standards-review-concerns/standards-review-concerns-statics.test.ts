import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { standardsReviewConcernsStatics } from './standards-review-concerns-statics';

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Re-flowing a paragraph in the statics file then reds nothing that is
// still true, which is why no needle below carries an escaped newline. Anything measuring the real
// bytes reads `standardsReviewConcernsStatics.markdown` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_MARKDOWN = standardsReviewConcernsStatics.markdown.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_MARKDOWN.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('standardsReviewConcernsStatics', () => {
  it('VALID: exported value => is exactly one markdown block and nothing else', () => {
    expect(standardsReviewConcernsStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  // Three reviewer prompts (codeweaver-reviewer, flowrider-reviewer, siegemaster-reviewer) each
  // interpolate this whole block, so it is measured three times over — once by each prompt's own
  // colocated test. This test measures the block itself, on its own.
  it('VALID: markdown => stays under the MCP tool-result verbatim-delivery ceiling on its own', () => {
    const bytes = Buffer.byteLength(standardsReviewConcernsStatics.markdown, 'utf8');

    expect(bytes).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: markdown => frames the five concerns as one reading pass that skips what lint already enforces', () => {
    expect({
      oneReading: has(
        'Take all five against a file in ONE reading. Open the file once, ask every question below, then move to the next file. Do not make five passes over the same tree.',
      ),
      skipLint: has(
        '**Skip anything lint already enforces.** Naming, imports, exports, destructuring, return types, no-any, proxy colocation, stub usage, no-console, silent catches, unused code, test name prefixes, `describe` shape. Lint has those. What is left is judgement.',
      ),
      fixSmallOwnFindings: has(
        '**Fix what you find, where the fix is small and clearly yours.** Hand up anything structural, anything crossing into work you do not own, and anything needing a decision.',
      ),
    }).toStrictEqual({
      oneReading: true,
      skipLint: true,
      fixSmallOwnFindings: true,
    });
  });

  // The ledger, the checklist tool call and the gate are gone. What replaced them is five concerns
  // as headings. If one gets dropped, this is the assertion that catches it.
  it('VALID: markdown => carries these seven ### headings in this exact order', () => {
    const headings = Array.from(
      standardsReviewConcernsStatics.markdown.matchAll(/^### .+$/gmu),
      (match) => match[0],
    );

    expect(headings).toStrictEqual([
      '### craft',
      '### perf',
      '### dedup',
      '### integrity',
      '### test-cases',
      '### Two questions you skip on some files',
      '### Dead code is not one of your concerns',
    ]);
  });

  describe('craft', () => {
    it('VALID: craft => pins the name/signature/body check, the thrown-error check, and the PURPOSE-header check with its four failure shapes', () => {
      expect({
        nameSignatureBody: has(
          '**Does the name agree with the signature, and the signature with the body?** Read all three in that order.',
        ),
        findLatestExample: has('A `findLatest` that returns the first match is a finding.'),
        thrownErrorEnough: has(
          '**Does a thrown error say enough to act on?** An error naming no path, no id and no cause leaves the next reader nothing.',
        ),
        purposeHeaderTrueAndDiscoverServesIt: has(
          "**Is the PURPOSE header true?** Lint checks it exists. Nothing checks it is correct, because no test and no typecheck reads a comment — and `discover` with `verbose: true` then serves that header to every later agent as the file's description.",
        ),
        fourShapesToFlag: has(
          "Four shapes to flag: a return-shape claim the code contradicts; a validation claim the contract does not make; a claim derived from the file's NAME rather than its body; a PURPOSE that only restates the signature.",
        ),
        readZodChainAndCorrectHeader: has(
          'Read the zod chain itself rather than trusting a `.refine()` message. Correct the header to what the code does now. Correct the code instead only when the code is independently wrong.',
        ),
      }).toStrictEqual({
        nameSignatureBody: true,
        findLatestExample: true,
        thrownErrorEnough: true,
        purposeHeaderTrueAndDiscoverServesIt: true,
        fourShapesToFlag: true,
        readZodChainAndCorrectHeader: true,
      });
    });
  });

  describe('perf', () => {
    it('VALID: perf => carries all four numbered finding shapes and the three-row hot-path table', () => {
      expect({
        fourShapesAreFindings: has('Four shapes are findings:'),
        quadraticLoops: has(
          '1. **Quadratic loops** — `.filter(... .find(...))`, or a repeated `indexOf`/`includes` inside a loop.',
        ),
        nPlusOne: has(
          '2. **N+1** — a per-item `await` on a database, HTTP or filesystem call that could batch.',
        ),
        syncIoOnHotPath: has('3. **Sync I/O on a hot path** — `readFileSync`, `execSync`.'),
        unboundedWork: has(
          '4. **Unbounded work** — a loop or recursion with no cap, over data a caller or the disk supplies.',
        ),
        simplificationCounts: has(
          'Simplification counts here too: an abstraction nothing needs, a conditional chain that flattens to one expression, a hand-rolled scan a `Map` or `Set` does in one pass.',
        ),
        judgeThePath: has('**Judge the path it sits on.**'),
        likelyOnRequestPath: has('| a request, websocket or orchestration path | likely |'),
        usuallyNotStartup: has('| startup, a migration, a one-off | usually not |'),
        usuallyNotSmallConstant: has('| an array bounded to a small constant | usually not |'),
      }).toStrictEqual({
        fourShapesAreFindings: true,
        quadraticLoops: true,
        nPlusOne: true,
        syncIoOnHotPath: true,
        unboundedWork: true,
        simplificationCounts: true,
        judgeThePath: true,
        likelyOnRequestPath: true,
        usuallyNotStartup: true,
        usuallyNotSmallConstant: true,
      });
    });
  });

  describe('dedup', () => {
    it('VALID: dedup => makes the search repo-wide and pins that the duplicate detector compares string and regex literals only', () => {
      expect({
        namesTheFailureShape: has(
          'New code reimplementing what the repo already has, or two new files doing one job under two names.',
        ),
        searchWholeRepo: has('**Search the whole repo, never just the files in front of you.**'),
        namesWhyScopedSearchMisses: has(
          'Search only your own scope and two sessions ship the same function twice, because the earlier copy is already on disk where only a repo-wide `discover` grep sees it.',
        ),
        detectorLiteralsOnlyNoAst: has(
          'The duplicate detector at `packages/tooling/src/brokers/duplicate-detection/` compares string and regex literals ONLY. It reads no AST, so a clean run from it says nothing about duplicate logic.',
        ),
        showYourWork: has(
          'Structural duplication is yours to judge: name both implementations and say what you compared — parameters, return shape, control flow. Never report that two things looked similar.',
        ),
      }).toStrictEqual({
        namesTheFailureShape: true,
        searchWholeRepo: true,
        namesWhyScopedSearchMisses: true,
        detectorLiteralsOnlyNoAst: true,
        showYourWork: true,
      });
    });
  });

  describe('integrity', () => {
    it('VALID: integrity => skips the signature sweep because tsc and ward already catch it, and scopes the concern to semantic drift', () => {
      expect({
        skipTheSweepBecauseToolsCatchIt: has(
          '**Skip the signature sweep.** `tsc` and ward already catch every consumer that stops compiling. What you own is the change that compiles and still means something different:',
        ),
        semanticChangeBehindSameSignature: has(
          '**A semantic change behind an unchanged signature.** Same parameters, same return type, different meaning — units, ordering, whether a bound is inclusive, what an empty array now signifies. `discover` grep the export name, then read each call site against the NEW meaning.',
        ),
        stubOrFixtureKeepingSuiteGreen: has(
          '**A stub or fixture updated to keep a suite green** rather than to encode the new behaviour. Read `@dungeonmaster/shared` contracts hardest: a branded type breaks consumers silently at parse time, and a `.default(...)` papering over a break may itself be the defect.',
        ),
      }).toStrictEqual({
        skipTheSweepBecauseToolsCatchIt: true,
        semanticChangeBehindSameSignature: true,
        stubOrFixtureKeepingSuiteGreen: true,
      });
    });
  });

  describe('test-cases', () => {
    it('VALID: test-cases => makes a branch with no case a finding, and makes rendered/was-called assertions count as no case', () => {
      expect({
        everyAddedBranchWalksControlFlow: has(
          '**Did every branch this work ADDED get a test?** Walk the new and changed control flow — each `if`/`else`, each `switch` arm, each ternary, each optional chain, each `try`/`catch`, each early return — and ask whether a case exercises it.',
        ),
        branchWithNoCaseIsAFinding: has(
          'A branch with no case is a finding, whatever some higher-level test covers.',
        ),
        judgeTheAssertionNotJustPresence: has('Judge the assertion, not just its presence.'),
        renderedOrWasCalledCountsAsNoCase: has(
          'A test asserting `rendered` or `was called` proves nothing and counts as no case at all.',
        ),
        writeTheMissingCase: has('Write the missing case yourself where you can.'),
      }).toStrictEqual({
        everyAddedBranchWalksControlFlow: true,
        branchWithNoCaseIsAFinding: true,
        judgeTheAssertionNotJustPresence: true,
        renderedOrWasCalledCountsAsNoCase: true,
        writeTheMissingCase: true,
      });
    });
  });

  describe('the two concerns withheld from declaration-shaped files', () => {
    it('VALID: markdown => names the exact suffix list and confirms the other three concerns still apply in full', () => {
      expect({
        namesTheWithheldPairAndSuffixes: has(
          '**Do not ask `perf` or `integrity` of a declaration-shaped file** — a `*-contract.ts`, `*.stub.ts`, `*.proxy.ts`, a test, an e2e, a harness, or a barrel `index.ts`.',
        ),
        measuredAcross88FilesZeroFindings: has(
          'Measured across 88 such files, those two produced zero findings, and that zero is a property of the question: `perf` against a zod schema asks whether a declaration has a quadratic loop.',
        ),
        otherThreeStillApplyInFull: has('The other three still apply in full.'),
        testCasesStillFindsAnUncoveredProxyOrStubBranch: has(
          '`test-cases` in particular still finds a branch added to a proxy or a stub that ships with no case.',
        ),
      }).toStrictEqual({
        namesTheWithheldPairAndSuffixes: true,
        measuredAcross88FilesZeroFindings: true,
        otherThreeStillApplyInFull: true,
        testCasesStillFindsAnUncoveredProxyOrStubBranch: true,
      });
    });
  });

  describe('dead code', () => {
    it('VALID: markdown => puts dead code outside every one of the five concerns', () => {
      expect({
        doNotHuntOrphans: has('Do not hunt orphans.'),
        propertyOfTheWholeImportGraph: has(
          'Whether an export has a consumer depends on the whole import graph after later work lands, and you cannot answer that from inside your own scope.',
        ),
        deletingAnExportWhileFixingIsFine: has(
          'Deleting an export while you fix something else is fine.',
        ),
      }).toStrictEqual({
        doNotHuntOrphans: true,
        propertyOfTheWholeImportGraph: true,
        deletingAnExportWhileFixingIsFine: true,
      });
    });
  });

  // Pinned ABSENT: the deleted ledger protocol's entire vocabulary. An earlier version made each
  // (file, concern) pair a unit with a recorded disposition and a server-side completion gate that
  // refused `done` while any unit carried no entry. All of it — the checklist tool call, the scope
  // table, the five-way disposition enum, the gate itself — was deleted. These needles stop it
  // creeping back in one piece at a time.
  describe('what the deleted ledger protocol must never creep back in as', () => {
    it('VALID: markdown => never mentions the deleted ledger vocabulary', () => {
      expect({
        blightLedger: has('blightLedger'),
        getBlightChecklist: has('get-blight-checklist'),
        workingTree: has('working-tree'),
        disposition: has('disposition'),
        reviewed: has('reviewed'),
        routed: has('routed'),
        recorded: has('recorded'),
        modifyQuest: has('modify-quest'),
        completionGate: has('completion gate'),
        observedBy: has('observedBy'),
        rippleSites: has('rippleSites'),
      }).toStrictEqual({
        blightLedger: false,
        getBlightChecklist: false,
        workingTree: false,
        disposition: false,
        reviewed: false,
        routed: false,
        recorded: false,
        modifyQuest: false,
        completionGate: false,
        observedBy: false,
        rippleSites: false,
      });
    });
  });
});
