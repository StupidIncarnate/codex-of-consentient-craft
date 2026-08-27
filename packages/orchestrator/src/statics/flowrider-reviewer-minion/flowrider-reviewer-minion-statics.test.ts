import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { reviewerInformationStatics } from '../reviewer-information/reviewer-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { flowriderReviewerMinionStatics } from './flowrider-reviewer-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderReviewerMinionStatics.prompt.template;

describe('flowriderReviewerMinionStatics', () => {
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

  // WHAT MOVED MUST NOT COME BACK. This prompt used to carry all seven protocol blocks AND the
  // standing concerns AND the four-defects catalogue — better than half of what it served before it
  // wrote a word.
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
  // prompt's numbered step; what those two commands are, and the fix loop after them, is every
  // reviewer's. Keeping the order here is what stops it floating loose in reference text.
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
      briefVariantsScopeIt: hasIn({
        needle:
          '**On a `PHASE:` brief run the build only; on a `SECTION: Sweep` brief run neither.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      buildStepIsSixth: true,
      openEveryFileIsFourth: true,
      pushIsLast: true,
      briefVariantsScopeIt: true,
    });
  });

  // A ROLE IS NAMED BY ITS INSTRUMENT, NEVER BY SUBTRACTING A SIBLING'S — and this reviewer needs two
  // things past the instrument, because the sibling implementation round writes Jest tests too. It
  // grades whether the round EXTENDED those files or stood a second suite beside them, and it grades
  // placement and mocking, which are lint rules and a standards rule rather than preferences. Four
  // things make that derivable, and each fails on its own.
  it('VALID: served template => names what the round produced before the workflow', () => {
    const beforeTheWorkflow = TEMPLATE.slice(0, TEMPLATE.indexOf('\n## Workflow'));

    expect({
      itsOwnHeading: hasIn({
        needle: '## What this round produced, and what you do to it',
        text: beforeTheWorkflow,
      }),
      namesTheArtifact: hasIn({
        needle:
          '**Cases added to `.integration.test.ts` files, plus any new harness under `test/`. That is the whole legal output.**',
        text: beforeTheWorkflow,
      }),
      namesTheThreeLegalityRules: hasIn({
        needle:
          '**Three rules decide whether a file this round wrote is legal at all, and step 4 holds each file against them:**',
        text: beforeTheWorkflow,
      }),
      mocksOnlyOutsideServices: hasIn({
        needle: '**The only legal mock is a service OUTSIDE this repo**',
        text: beforeTheWorkflow,
      }),
      namesTheFourJobs: hasIn({
        needle: '**Your job over all that is four things, in this order:**',
        text: beforeTheWorkflow,
      }),
      definesItselfBySubtraction: hasIn({ needle: 'below the browser', text: TEMPLATE }),
    }).toStrictEqual({
      itsOwnHeading: true,
      namesTheArtifact: true,
      namesTheThreeLegalityRules: true,
      mocksOnlyOutsideServices: true,
      namesTheFourJobs: true,
      definesItselfBySubtraction: false,
    });
  });

  // WHAT STAYED IS WHAT ANOTHER REVIEWER WOULD READ AS FALSE. The sign-off trap, the three checklist
  // marks and the judging half of the evidence contract belong to this track alone; a sibling reviewer
  // over product code has no sign-off track to trap it at all.
  it('VALID: served template => keeps every check that reviewing these suites is alone in making', () => {
    expect({
      signsFlowriderSignoff: hasIn({
        needle: '## You sign this round: `flowriderSignoff`, over this PACKAGE SLICE',
        text: TEMPLATE,
      }),
      threeMarksRule: hasIn({ needle: '**Sign no `[x]` and no `[-]`.**', text: TEMPLATE }),
      noPlaywrightEvidence: hasIn({
        needle: '**A Playwright `.e2e.ts` is never evidence here**',
        text: TEMPLATE,
      }),
      twoPasses: hasIn({
        needle: "## Two passes over the round log's claims — say which claims got which",
        text: TEMPLATE,
      }),
      judgingHalfCarried: hasIn({
        needle: flowEvidenceContractStatics.judgingMarkdown,
        text: TEMPLATE,
      }),
      authoringHalfNotCarried: hasIn({
        needle: flowEvidenceContractStatics.authoringMarkdown,
        text: TEMPLATE,
      }),
      harnessPhaseGate: hasIn({
        needle: "**Give `DEPENDS`' most-depended-on entries your longest pass**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      signsFlowriderSignoff: true,
      threeMarksRule: true,
      noPlaywrightEvidence: true,
      twoPasses: true,
      judgingHalfCarried: true,
      authoringHalfNotCarried: false,
      harnessPhaseGate: true,
    });
  });

  // NOTHING IN THE PAYLOAD STATES THESE. `reviewerInformationStatics` carries no `## What you never
  // do` section at all, so the git, whole-repo-ward and browser bans are this file's alone to state.
  it('VALID: served template => keeps the git, whole-repo-ward and Playwright bans nothing else states', () => {
    expect({
      destructiveGitBan: hasIn({ needle: '**Destructive `git`**', text: TEMPLATE }),
      wholeRepoWardBan: hasIn({
        needle: '**The whole-repo `npm run ward`, bare.**',
        text: TEMPLATE,
      }),
      browserPlaywrightBan: hasIn({ needle: '**A browser, and Playwright.**', text: TEMPLATE }),
    }).toStrictEqual({
      destructiveGitBan: true,
      wholeRepoWardBan: true,
      browserPlaywrightBan: true,
    });
  });
});
