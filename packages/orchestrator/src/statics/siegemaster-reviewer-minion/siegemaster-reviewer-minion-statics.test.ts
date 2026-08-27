import { reviewerInformationStatics } from '../reviewer-information/reviewer-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterReviewerMinionStatics } from './siegemaster-reviewer-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterReviewerMinionStatics.prompt.template;

describe('siegemasterReviewerMinionStatics', () => {
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
  // within striking distance of the MCP verbatim ceiling.
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

  // THE ORDER STAYED WHILE THE COMMANDS LEFT. Verifying every walk BEFORE the build and the ward is
  // this prompt's numbered step; what those two commands are, and the fix loop after them, is every
  // reviewer's. Keeping the order here is what stops it floating loose in reference text.
  // THE FILE LIST IS A GIT READING, NOT A PLAN READING. `FILES` is what the planner EXPECTED a chunk
  // to touch, and a worker's `FILES` grows as it works — that growth reaches the document only where
  // the worker chose to record it. This round's fixes land in files no chunk necessarily named, so a
  // reviewer reading the plan instead takes the standing concerns against the wrong set.
  it('VALID: served template => sources the fix file list from git, not from the plan', () => {
    expect({
      namesTheGitCall: hasIn({ needle: 'git status --porcelain', text: TEMPLATE }),
      bansThePlanAndTheReports: hasIn({
        needle: "never off the plan's `FILES` rows or a\n   worker's report",
        text: TEMPLATE,
      }),
      // The git call has to sit in the step that VERIFIES, not somewhere after the build.
      gitCallPrecedesTheBuild:
        TEMPLATE.indexOf('git status --porcelain') <
        TEMPLATE.indexOf('**NOW BUILD, THEN WARD — and not one step earlier.**'),
    }).toStrictEqual({
      namesTheGitCall: true,
      bansThePlanAndTheReports: true,
      gitCallPrecedesTheBuild: true,
    });
  });

  it('VALID: served template => keeps the numbered order that puts the re-walk before building', () => {
    expect({
      verifyWalksIsFourth: hasIn({
        needle: '4. **VERIFY THE WALKS**,',
        text: TEMPLATE,
      }),
      buildStepIsSeventh: hasIn({
        needle: '7. **NOW BUILD, THEN WARD — and not one step earlier.**',
        text: TEMPLATE,
      }),
      pushIsLast: hasIn({
        needle: '**LAST thing you do, AFTER your commit**',
        text: TEMPLATE,
      }),
      briefVariantsScopeIt: hasIn({
        needle:
          '**On a `PHASE:` brief run the build only; on a `SECTION: Sweep` brief run neither.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      verifyWalksIsFourth: true,
      buildStepIsSeventh: true,
      pushIsLast: true,
      briefVariantsScopeIt: true,
    });
  });

  // WHAT STAYED IS WHAT ANOTHER REVIEWER WOULD READ AS FALSE. This is the only reviewer of the five
  // that signs a track of its own — the codeweaver reviewer signs nothing — so the sign-off vocabulary,
  // the re-walk (never a re-read) and the mutation audit could never live in the shared payload.
  it('VALID: served template => keeps every check that verifying a walk is alone in making', () => {
    expect({
      signsSiegemasterSignoff: hasIn({
        needle: '## Write the sign-offs — `siegemasterSignoff`, one per unit',
        text: TEMPLATE,
      }),
      confirmedVerdict: hasIn({
        needle: '| `confirmed` | a worker measured it off the running system, or you did.',
        text: TEMPLATE,
      }),
      unconfirmableVerdict: hasIn({
        needle: '| `unconfirmable` | no surface settles it after real effort.',
        text: TEMPLATE,
      }),
      questNotesNeverCloses: hasIn({
        needle: '**A `questNotes` entry NEVER closes a unit. Only a sign-off closes one.**',
        text: TEMPLATE,
      }),
      reDrive: hasIn({
        needle: '### Confirm every reported fix in the tree, then RE-DRIVE it',
        text: TEMPLATE,
      }),
      mutationAudit: hasIn({
        needle: '## Break the line and see whether the test notices',
        text: TEMPLATE,
      }),
      fetchIntercept: hasIn({ needle: '## The fetch-intercept rule', text: TEMPLATE }),
    }).toStrictEqual({
      signsSiegemasterSignoff: true,
      confirmedVerdict: true,
      unconfirmableVerdict: true,
      questNotesNeverCloses: true,
      reDrive: true,
      mutationAudit: true,
      fetchIntercept: true,
    });
  });
});
