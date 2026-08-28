import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { reviewerInformationStatics } from './reviewer-information-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const MARKDOWN = reviewerInformationStatics.markdown;

// `<dungeonmaster-ward-discipline>` is the NAME of a session snippet the [WARD] rule overrides by
// name, not this repo's word for a kind of work. Strip the citation before the check below, or the
// `discipline` needle matches the one place the word legitimately appears.
const WARD_DISCIPLINE_SNIPPET = /<dungeonmaster-ward-discipline>/gu;

const SEARCHABLE = MARKDOWN.toLowerCase().replace(WARD_DISCIPLINE_SNIPPET, '');

// `implementation` is deliberately NOT on this list, though it names one of the five kinds of work.
// It is also an ordinary English word this payload has to use — the commit subjects say "touches no
// implementation file" — so a needle for it reports a defect on every honest sentence.
// `roundProtocolStatics`' own test omits it for the same reason.
const DISCIPLINE_WORDS = [
  'discipline',
  'bug-repro',
  'below-browser',
  'browser-e2e',
  'manual-qa',
] as const;

describe('reviewerInformationStatics', () => {
  it('VALID: exported value => is exactly one markdown payload and nothing else', () => {
    expect(reviewerInformationStatics).toStrictEqual({
      markdown: expect.stringMatching(/^# Reviewer information\n.+$/su),
    });
  });

  describe('what the MCP layer will do with it', () => {
    // This is the largest of the three payloads: it carries all seven protocol blocks AND the standing
    // concerns. Over `maxVerbatimChars` the MCP layer writes the result to a file and hands the agent
    // an error stub, so the one session that verifies anything on the round starts holding a path
    // instead of its method. BYTES, not characters: the size-cap test in
    // `mcp-server-flow.integration.test.ts` measures the same way.
    it('VALID: served payload => fits the MCP verbatim ceiling in bytes', () => {
      expect(Buffer.byteLength(MARKDOWN, 'utf8')).toBeLessThan(
        mcpToolResultStatics.maxVerbatimChars,
      );
    });

    it('VALID: served payload => carries no template placeholder', () => {
      expect({
        arguments: hasIn({ needle: '$ARGUMENTS', text: MARKDOWN }),
        discipline: hasIn({ needle: '$DISCIPLINE', text: MARKDOWN }),
        myDiscipline: hasIn({ needle: '$MY_DISCIPLINE', text: MARKDOWN }),
      }).toStrictEqual({ arguments: false, discipline: false, myDiscipline: false });
    });
  });

  // THE WHOLE REASON THE TOOL TAKES NO ARGUMENT. What differs between reviewers — which companion
  // files a folder type demands, whether a sign-off track exists, what a walk proves — lives in the
  // prompt only one of them reads.
  it.each(agentPromptClassificationStatics.operatorRoleNames)(
    'VALID: served payload => never names the role %s',
    (role) => {
      expect(hasIn({ needle: role, text: SEARCHABLE })).toBe(false);
    },
  );

  it.each(DISCIPLINE_WORDS)('VALID: served payload => never names the discipline %s', (word) => {
    expect(hasIn({ needle: word, text: SEARCHABLE })).toBe(false);
  });

  describe('the blocks it carries', () => {
    // A reviewer grades the plan against the tree, so it takes every protocol block. The standing
    // concerns are the largest single thing that moved here: all five reviewer prompts interpolated
    // that same 9,000-character block, which is most of why all five measured within 3,700 characters
    // of the ceiling.
    it('VALID: served payload => embeds all seven protocol blocks and the standing concerns', () => {
      expect({
        document: hasIn({ needle: roundProtocolStatics.document, text: MARKDOWN }),
        briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: MARKDOWN }),
        planBlocks: hasIn({ needle: roundProtocolStatics.planBlocks, text: MARKDOWN }),
        chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: MARKDOWN }),
        indexes: hasIn({ needle: roundProtocolStatics.indexes, text: MARKDOWN }),
        commitSubjects: hasIn({ needle: roundProtocolStatics.commitSubjects, text: MARKDOWN }),
        nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: MARKDOWN }),
        concerns: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: MARKDOWN }),
      }).toStrictEqual({
        document: true,
        briefKeys: true,
        planBlocks: true,
        chunkFields: true,
        indexes: true,
        commitSubjects: true,
        nextLine: true,
        concerns: true,
      });
    });
  });

  describe('the rules a reviewer cannot be served without', () => {
    // A minion holding a `workItemId` that belongs to its PARENT could complete its parent's scope and
    // advance the relay mid-round.
    it('VALID: served payload => forbids `signal-back` and names the parent`s work item', () => {
      expect({
        neverSignal: hasIn({
          needle: '**[TURN END] Never call `signal-back`. Your final message is how you finish.**',
          text: MARKDOWN,
        }),
        workItemIsTheParents: hasIn({
          needle: 'The `workItemId` in your briefing belongs to your PARENT',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ neverSignal: true, workItemIsTheParents: true });
    });

    // The reviewer is the only session on the round that runs either command, so its `--staged` run is
    // the round's ONLY typecheck — every worker proved its chunk with `lint` and tests alone. Reading
    // the files BEFORE running them is what stops the compiler's list becoming the review.
    // GIT IS THE ONLY HONEST SOURCE FOR THE ROUND'S FILE LIST. `FILES` is what the planner EXPECTED
    // a chunk to touch, written before any of it happened, and a worker's `FILES` grows as it works
    // — that growth reaches the document only where the worker chose to record it. A file no chunk
    // named and no report mentioned is in the round anyway, and a reviewer reading the plan never
    // opens it. The reviewer is the last session on the round, so what it does not open, nothing does.
    it("VALID: served payload => sources the round's file list from git, never from the plan", () => {
      expect({
        theExactCommand: hasIn({ needle: 'git status --porcelain', text: MARKDOWN }),
        theOutputIsTheList: hasIn({
          needle: '**That output IS your reading list.**',
          text: MARKDOWN,
        }),
        whyItIsAllThere: hasIn({
          needle: 'No worker commits anything, so the whole round is still sitting',
          text: MARKDOWN,
        }),
        bansThePlanAndTheReports: hasIn({
          needle: "**Never take that list off the plan's `FILES` rows or off a worker's report.**",
          text: MARKDOWN,
        }),
        namesWhyFilesIsWrong: hasIn({
          needle: "a worker's `FILES` GROWS",
          text: MARKDOWN,
        }),
        gradesBothAgainstGit: hasIn({
          needle:
            '**Read the plan and the reports as CLAIMS about that list, and grade both against it.**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        theExactCommand: true,
        theOutputIsTheList: true,
        whyItIsAllThere: true,
        bansThePlanAndTheReports: true,
        namesWhyFilesIsWrong: true,
        gradesBothAgainstGit: true,
      });
    });

    it('VALID: served payload => gives the reviewer the build and ward, after it reads', () => {
      expect({
        theExactPair: hasIn({
          needle: 'npm run build\nnpm run ward -- --staged',
          text: MARKDOWN,
        }),
        onlySessionThatRuns: hasIn({
          needle: '**You are the ONLY session on this quest that runs either**',
          text: MARKDOWN,
        }),
        firstAndOnlyTypecheck: hasIn({
          needle: 'this is the first and only TYPECHECK the round gets',
          text: MARKDOWN,
        }),
        readFirst: hasIn({
          needle: '**Running them AFTER you have read the files is the point**',
          text: MARKDOWN,
        }),
        twiceAtMost: hasIn({
          needle:
            '**Run that pair TWICE at most, and the SECOND run is to check the fixes you made**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        theExactPair: true,
        onlySessionThatRuns: true,
        firstAndOnlyTypecheck: true,
        readFirst: true,
        twiceAtMost: true,
      });
    });

    // THIS IS THE SESSION THAT SLEEP-POLLED. `--staged` is the longest command any minion runs, so
    // this is the one payload whose reader routinely meets the 600s timeout, and the [BACKGROUND]
    // rule alone was not enough: on quest a7520e60 two reviewers answered a backgrounded ward with
    // `sleep 90` and then `sleep 240`, tailing its output file by hand. The ban is restated on
    // [WARD] itself, where a reviewer reading about its own ward will meet it.
    it('VALID: served payload => bans sleep-polling the ward run on the [WARD] rule itself', () => {
      expect({
        theBan: hasIn({ needle: '**DO NOT SLEEP-POLL A WARD RUN.**', text: MARKDOWN }),
        namesAllThreeInventions: hasIn({
          needle:
            'Never `sleep` beside it, never `tail` its output file, and never re-run it to find out whether the first one finished.',
          text: MARKDOWN,
        }),
        theHarnessNotifies: hasIn({
          needle: 'is backgrounded by the harness, which notifies you when it exits',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        theBan: true,
        namesAllThreeInventions: true,
        theHarnessNotifies: true,
      });
    });

    // AN EMPTY WARD IS NOT A GREEN ONE, and this reader is the one that turns a ward result into a
    // `VERDICT`. `--staged` comes back empty for a round that genuinely changed nothing, and ward now
    // runs no checks at all there rather than sweeping the repo — so the line the reviewer quotes as
    // its evidence has to be one that actually measured something.
    it('VALID: served payload => refuses an empty ward run as evidence of a green round', () => {
      expect({
        theHeading: hasIn({
          needle: '**A ward that reports 0 files in scope has proven NOTHING.**',
          text: MARKDOWN,
        }),
        emptyNotGreen: hasIn({
          needle: 'That is an empty run, not a green one',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ theHeading: true, emptyNotGreen: true });
    });

    // THE THIRD WAY TO GET THE OUTCOME WRONG IS TO LEAVE THE LINE OFF, and this reader is the one it
    // costs most: its `continue` is the only line that ends the parent's session, so a verdict that
    // reads yes and then trails into prose is read as `rework` and buys a whole further round that
    // re-derives what this session already proved. The clean round is where it happens, because a
    // session with a green ward and every chunk accepted has the most to summarise and the least
    // reason to think the shape of its return still matters.
    it('VALID: served payload => makes `NEXT:` the last line and bans a closing paragraph', () => {
      expect({
        placementHasItsOwnHeading: hasIn({
          needle: '### Where it goes, and what may not go with it',
          text: MARKDOWN,
        }),
        valueChoiceHasItsOwn: hasIn({ needle: '### Which value it carries', text: MARKDOWN }),
        lastLineEveryPath: hasIn({
          needle:
            '**It is the LAST line of your return, on every path out of your turn — the clean round most of all.**',
          text: MARKDOWN,
        }),
        theBlockIsTheBound: hasIn({
          needle:
            'Your return is the block your own `## What you return` lays out and nothing besides it',
          text: MARKDOWN,
        }),
        namesWhatDoesNotGoBeside: hasIn({
          needle:
            'no opening preamble, no closing paragraph after the `NEXT:` line, no summary of the round, no parting remark',
          text: MARKDOWN,
        }),
        verdictYesThenProseIsRework: hasIn({
          needle:
            '**A `VERDICT` reading yes that then ends in prose reaches your parent as `rework`**',
          text: MARKDOWN,
        }),
        namesTheCost: hasIn({
          needle: 'spends a whole further round re-deriving what you already proved',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        placementHasItsOwnHeading: true,
        valueChoiceHasItsOwn: true,
        lastLineEveryPath: true,
        theBlockIsTheBound: true,
        namesWhatDoesNotGoBeside: true,
        verdictYesThenProseIsRework: true,
        namesTheCost: true,
      });
    });

    // Both ways of lying with the `NEXT:` line cost the quest something, and they cost it in opposite
    // directions — padding spends a whole round on nothing, hiding leaves the defect in the branch
    // because nothing runs after this session.
    it('VALID: served payload => names both ways to get the round`s outcome wrong', () => {
      expect({
        outcomeIsTheirs: hasIn({ needle: "**Yours is the round's outcome:**", text: MARKDOWN }),
        paddingCosts: hasIn({
          needle: '**Padding that line spends a whole round on nothing.**',
          text: MARKDOWN,
        }),
        hidingCosts: hasIn({
          needle: '**Hiding a real remainder leaves the defect in the branch.**',
          text: MARKDOWN,
        }),
        noInventedFinding: hasIn({
          needle: '**Do not invent a finding to justify the round.**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        outcomeIsTheirs: true,
        paddingCosts: true,
        hidingCosts: true,
        noInventedFinding: true,
      });
    });

    // Nothing on the round records whether a worker witnessed its red, and on the audited quest every
    // worker skipped it. The check that IS visible is reading each assertion and naming the value that
    // would make it fail.
    it('VALID: served payload => tells the reviewer to assume the red step was skipped', () => {
      expect({
        assumeSkipped: hasIn({
          needle: '### Nothing records whether the red step happened — assume it was skipped',
          text: MARKDOWN,
        }),
        nameTheValue: hasIn({ needle: '**Name that value in your evidence.**', text: MARKDOWN }),
        fourDefects: hasIn({ needle: '### The four defects this check caught', text: MARKDOWN }),
      }).toStrictEqual({ assumeSkipped: true, nameTheValue: true, fourDefects: true });
    });
  });

  describe('a red that is not real', () => {
    // A REVIEWER THAT RE-RUNS A RED SUITE AND SEES GREEN CANNOT TELL A FIX FROM A RE-ROLL, and neither
    // can anything downstream: the round's evidence is the ward output, and a second-attempt green
    // looks exactly like a first-attempt one. So the diagnosis is a STEP with a mechanical answer —
    // the file alone, `git diff` still empty — and its outcome is `rework`, not a repair. The cause
    // sits in a DIFFERENT file from the one that went red, which is why the round cannot afford it.
    it('VALID: served payload => routes a red that passes in isolation to `rework`', () => {
      expect({
        diagnoseBeforeFixing: hasIn({
          needle: '**Before you fix ANY red, find out whether it is real.**',
          text: MARKDOWN,
        }),
        theIsolationRun: hasIn({
          needle: 'npm run ward -- -- <the file that went red>',
          text: MARKDOWN,
        }),
        namesTheCondition: hasIn({
          needle: '**If it passes alone while your `git diff` is still empty, that is a FLAKE**',
          text: MARKDOWN,
        }),
        theCauseIsElsewhere: hasIn({
          needle: 'the file that went red is not the broken one',
          text: MARKDOWN,
        }),
        isolatedPassIsNotTheResult: hasIn({
          needle: '**The isolated pass is NOT your result.**',
          text: MARKDOWN,
        }),
        routedToRework: hasIn({
          needle: '**A flake is `NEXT: rework`, and it is not yours to repair.**',
          text: MARKDOWN,
        }),
        // THE ISOLATION RESULT IS THE FINDING, not the failure output. A `rework` line carrying only
        // the red sends the next session to re-run the suite, see green, and pay for it again.
        theThirdPartIsTheFinding: hasIn({
          needle:
            '**that the same file passes alone with nothing changed**. That\nthird part IS the finding.',
          text: MARKDOWN,
        }),
        // The second ward run must not read as a licence to re-roll a red.
        secondRunChecksFixes: hasIn({
          needle:
            '**Run that pair TWICE at most, and the SECOND run is to check the fixes you made** — never to see whether a red clears on its own.',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        diagnoseBeforeFixing: true,
        theIsolationRun: true,
        namesTheCondition: true,
        theCauseIsElsewhere: true,
        isolatedPassIsNotTheResult: true,
        routedToRework: true,
        theThirdPartIsTheFinding: true,
        secondRunChecksFixes: true,
      });
    });
  });
});
