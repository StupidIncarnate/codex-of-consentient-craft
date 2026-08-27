import { reviewerInformationStatics } from '../reviewer-information/reviewer-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { codeweaverReviewerMinionStatics } from './codeweaver-reviewer-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = codeweaverReviewerMinionStatics.prompt.template;

describe('codeweaverReviewerMinionStatics', () => {
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

  // WHAT MOVED MUST NOT COME BACK. This prompt used to carry all seven protocol blocks AND the standing
  // concerns — better than half of what it served before it wrote a word, and the reason it measured
  // within 3,700 characters of the MCP verbatim ceiling.
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
  // prompt's own step; what those two commands are, and the fix loop after them, is every reviewer's.
  //
  // ASSERT THE ORDER, NEVER THE STEP NUMBER. A number is not the thing that matters and it moves
  // whenever anything is inserted above it — this test pinned `5.` and `3.` and went red the moment the
  // tool call became step 1. What must hold is that the reviewer opens every file BEFORE it builds.
  it('VALID: served template => puts opening every file ahead of building', () => {
    expect(TEMPLATE.indexOf('then OPEN EVERY FILE IT NAMES**')).toBeLessThan(
      TEMPLATE.indexOf('**NOW BUILD, THEN WARD — and not one step earlier.**'),
    );
  });

  // THE FILE LIST IS A GIT READING, NOT A PLAN READING. `FILES` is what the planner EXPECTED a chunk
  // to touch, and a worker's `FILES` grows as it works — that growth reaches the document only where
  // the worker chose to record it. A reviewer that reads the plan instead never opens a file no chunk
  // named, and step 4 is the only pass that opens anything.
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

  it('VALID: served template => keeps the push last and scopes the pair by brief', () => {
    expect({
      pushIsLast: hasIn({
        needle: '**LAST thing you do, AFTER your commit**',
        text: TEMPLATE,
      }),
      briefVariantsScopeIt: hasIn({
        needle:
          '**On a `PHASE:` brief run the build only; on a `SECTION: Sweep` brief run neither.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pushIsLast: true, briefVariantsScopeIt: true });
  });

  // WHAT STAYED IS WHAT ANOTHER REVIEWER WOULD READ AS FALSE. Product code is the one discipline with NO
  // sign-off track, so a shared payload could never carry that sentence — and a reviewer that invented a
  // field to fill would write a ledger nothing reads.
  it('VALID: served template => keeps every check that reviewing product code is alone in making', () => {
    expect({
      signsNothing: hasIn({
        needle: '**There is no sign-off track over product code.**',
        text: TEMPLATE,
      }),
      signoffsLine: hasIn({
        needle: 'SIGNOFFS: none — product code has no sign-off track',
        text: TEMPLATE,
      }),
      noPlaywright: hasIn({ needle: '**No Playwright.**', text: TEMPLATE }),
      companionsByFolderType: hasIn({
        needle: '**Companions follow the FOLDER TYPE.**',
        text: TEMPLATE,
      }),
      specMovementIsTheirs: hasIn({
        needle: '**Make the `modify-quest` call yourself**',
        text: TEMPLATE,
      }),
      addedByCodeweaver: hasIn({ needle: "`addedBy: 'codeweaver'`", text: TEMPLATE }),
    }).toStrictEqual({
      signsNothing: true,
      signoffsLine: true,
      noPlaywright: true,
      companionsByFolderType: true,
      specMovementIsTheirs: true,
      addedByCodeweaver: true,
    });
  });
});
