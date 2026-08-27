import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { reviewerInformationStatics } from '../reviewer-information/reviewer-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { groundstomperReviewerMinionStatics } from './groundstomper-reviewer-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = groundstomperReviewerMinionStatics.prompt.template;

describe('groundstomperReviewerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the standing concerns or the commit subjects — so a session that
  // skips the call has no method at all.
  it('VALID: served template => makes the get-reviewer-information call step 1 of the workflow', () => {
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));

    expect(
      hasIn({
        needle:
          '1. **Call `get-reviewer-information`, and read what it returns before you open anything.**',
        text: workflow.slice(0, workflow.indexOf('2. **')),
      }),
    ).toBe(true);
  });

  // The prompt does not re-list what the tool returns. Step 1 already says it, and a second copy is
  // the duplication this whole split exists to end — so it is pinned ABSENT rather than left to review.
  it('VALID: served template => never restates what the reviewer tool returns', () => {
    expect(hasIn({ needle: 'That is everything true of every reviewer', text: TEMPLATE })).toBe(
      false,
    );
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
    }).toStrictEqual({ count: 1, atTheEnd: true });
  });

  // WHAT MOVED MUST NOT COME BACK. This prompt used to carry all seven protocol blocks, the standing
  // concerns and the five operating rules under their heading — better than half of what it served
  // before it wrote a word, and the reason it measured over `mcpToolResultStatics.maxVerbatimChars`.
  it('VALID: served template => restates no block the reviewer information tool serves', () => {
    expect({
      document: hasIn({ needle: roundProtocolStatics.document, text: TEMPLATE }),
      briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: TEMPLATE }),
      planBlocks: hasIn({ needle: roundProtocolStatics.planBlocks, text: TEMPLATE }),
      chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: TEMPLATE }),
      indexes: hasIn({ needle: roundProtocolStatics.indexes, text: TEMPLATE }),
      commitSubjects: hasIn({ needle: roundProtocolStatics.commitSubjects, text: TEMPLATE }),
      nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: TEMPLATE }),
      concerns: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
      operatingRules: hasIn({
        needle: '**[TURN END] Never call `signal-back`. Your final message is how you finish.**',
        text: TEMPLATE,
      }),
      fourDefects: hasIn({ needle: '### The four defects this check caught', text: TEMPLATE }),
      wholeInformationPayload: hasIn({
        needle: reviewerInformationStatics.markdown,
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      document: false,
      briefKeys: false,
      planBlocks: false,
      chunkFields: false,
      indexes: false,
      commitSubjects: false,
      nextLine: false,
      concerns: false,
      operatingRules: false,
      fourDefects: false,
      wholeInformationPayload: false,
    });
  });

  // THE ORDER STAYED WHILE THE COMMANDS LEFT. Reading every file BEFORE the build and the ward is this
  // prompt's numbered step; what those two commands are is every reviewer's. Keeping the order here is
  // what stops it floating loose in reference text.
  // THE FILE LIST IS A GIT READING, NOT A PLAN READING. `FILES` is what the planner EXPECTED a chunk
  // to touch, and a worker's `FILES` grows as it works — that growth reaches the document only where
  // the worker chose to record it. A reviewer that reads the plan instead never opens a file no chunk
  // named, and this is the only pass that opens anything.
  it('VALID: served template => sources the file list from git and bans the plan as the list', () => {
    expect({
      namesTheGitCall: hasIn({ needle: 'git status --porcelain', text: TEMPLATE }),
      bansTheFilesRows: hasIn({
        needle: "**The plan's `FILES` rows are NOT that list**",
        text: TEMPLATE,
      }),
      // The git call has to sit in the step that READS, not somewhere after the build.
      gitCallPrecedesTheBuild:
        TEMPLATE.indexOf('git status --porcelain') <
        TEMPLATE.indexOf('**NOW BUILD, THEN WARD — and not one step earlier.**'),
    }).toStrictEqual({
      namesTheGitCall: true,
      bansTheFilesRows: true,
      gitCallPrecedesTheBuild: true,
    });
  });

  it('VALID: served template => keeps the numbered order that puts reading before building', () => {
    expect({
      buildStepIsSixth: hasIn({
        needle: '6. **NOW BUILD, THEN WARD — and not one step earlier.**',
        text: TEMPLATE,
      }),
      openEveryFileIsFourth: hasIn({
        needle:
          "4. **Take the round's file list off `git status --porcelain`, then OPEN EVERY FILE IT NAMES**",
        text: TEMPLATE,
      }),
      pushIsLast: hasIn({
        needle: '**LAST thing you do, AFTER your commit**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      buildStepIsSixth: true,
      openEveryFileIsFourth: true,
      pushIsLast: true,
    });
  });

  // `judgingMarkdown` IS THE ONE EXCEPTION TO THE MOVE. It is shared with exactly one sibling,
  // `flowrider-reviewer-minion`, never with the other three reviewers, so it stays interpolated here
  // rather than riding in the payload every reviewer takes.
  it('VALID: served template => keeps the Evidence Contract it shares with exactly one sibling', () => {
    expect(hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE })).toBe(
      true,
    );
  });

  // WHAT STAYED IS WHAT ANOTHER REVIEWER WOULD READ AS FALSE. Only this walk and its sibling touch a
  // browser, only this walk signs `flowriderSignoff` over the browser-reachable package kinds, and
  // only this walk is exposed to a hidden-tab measurement or a `page.route` interception of its own
  // backend.
  it("VALID: served template => keeps every check that is this browser walk's alone", () => {
    expect({
      e2eSubject: hasIn({
        needle: 'Playwright `.e2e.ts` specs and the harnesses they import, and nothing else',
        text: TEMPLATE,
      }),
      flowriderSignoffSlice: hasIn({
        needle: '**You write `flowriderSignoff`, over the browser-reachable package kinds.**',
        text: TEMPLATE,
      }),
      fourMoreFalseGreens: hasIn({
        needle: "## Four more false greens, this walk's own",
        text: TEMPLATE,
      }),
      hiddenTabCheck: hasIn({
        needle: '**A geometry or visibility finding taken from a hidden tab.**',
        text: TEMPLATE,
      }),
      pageRouteBan: hasIn({
        needle: "**`page.route` against this round's own backend.**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      e2eSubject: true,
      flowriderSignoffSlice: true,
      fourMoreFalseGreens: true,
      hiddenTabCheck: true,
      pageRouteBan: true,
    });
  });
});
