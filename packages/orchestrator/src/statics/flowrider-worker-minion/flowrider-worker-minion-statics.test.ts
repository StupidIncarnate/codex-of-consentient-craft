import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { workerInformationStatics } from '../worker-information/worker-information-statics';

import { flowriderWorkerMinionStatics } from './flowrider-worker-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderWorkerMinionStatics.prompt.template;

describe('flowriderWorkerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the chunk fields or the return block — so a session that skips the
  // call has no method at all.
  it('VALID: served template => makes the get-worker-information call step 1 of the workflow', () => {
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));

    expect(
      hasIn({
        needle:
          '1. **Call `get-worker-information`, and read what it returns before you open anything.**',
        text: workflow.slice(0, workflow.indexOf('2. **')),
      }),
    ).toBe(true);
  });

  // The prompt does not re-list what the tool returns. Step 1 already says it, and a second copy is
  // the duplication this whole split exists to end — so it is pinned ABSENT rather than left to review.
  it('VALID: served template => never restates what the worker tool returns', () => {
    expect(hasIn({ needle: 'That is everything true of every worker', text: TEMPLATE })).toBe(
      false,
    );
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
    }).toStrictEqual({ count: 1, atTheEnd: true });
  });

  // WHAT MOVED MUST NOT COME BACK. A worker takes four protocol blocks and they all arrive through the
  // tool now; the operating rules and the git-ban measurement move with them.
  it('VALID: served template => restates no block the worker information tool serves', () => {
    expect({
      document: hasIn({ needle: roundProtocolStatics.document, text: TEMPLATE }),
      briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: TEMPLATE }),
      chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: TEMPLATE }),
      nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: TEMPLATE }),
      operatingRules: hasIn({
        needle: '**[TURN END] Never call `signal-back`. Your final message is how you finish.**',
        text: TEMPLATE,
      }),
      gitBan: hasIn({
        needle: 'three landed and nine died with `Unable to create index.lock`',
        text: TEMPLATE,
      }),
      wholeInformationPayload: hasIn({ needle: workerInformationStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({
      document: false,
      briefKeys: false,
      chunkFields: false,
      nextLine: false,
      operatingRules: false,
      gitBan: false,
      wholeInformationPayload: false,
    });
  });

  // A ROLE IS NAMED BY ITS INSTRUMENT, NEVER BY SUBTRACTING A SIBLING'S — and for this worker the
  // instrument alone is still not enough, because the sibling implementation round writes Jest tests
  // too. Five things make the assignment derivable, and each fails on its own: the section, that the
  // files mostly exist already, that Codeweaver proved one seam while this round covers the whole
  // path, the placement rule that decides which suffix is even legal where, and the mocking rule —
  // pinned because "these tests mock nothing" is false of every `.test.ts` in this repo.
  it('VALID: served template => names what it writes, and how that differs from the round before it', () => {
    const beforeTheWorkflow = TEMPLATE.slice(0, TEMPLATE.indexOf('\n## Workflow'));

    expect({
      itsOwnHeading: hasIn({ needle: '## What you are writing', text: beforeTheWorkflow }),
      namesTheArtifact: hasIn({
        needle:
          '**Cases added to an `.integration.test.ts`, plus any harness your chunk needs under `test/`. That is the whole list.**',
        text: beforeTheWorkflow,
      }),
      extendsRatherThanDuplicates: hasIn({
        needle: '**You EXTEND those files. You never stand a second suite beside one.**',
        text: beforeTheWorkflow,
      }),
      everythingOursRunsReal: hasIn({
        needle: '**Everything this repo owns runs REAL in your test.**',
        text: beforeTheWorkflow,
      }),
      mocksOnlyOutsideServices: hasIn({
        needle:
          '**Never the file system. Never a local endpoint of ours. Never a database call. Never one of our brokers, adapters, responders or transformers.**',
        text: beforeTheWorkflow,
      }),
      harnessNotProxy: hasIn({
        needle: '**Infrastructure reaches your test through a HARNESS, never a proxy.**',
        text: beforeTheWorkflow,
      }),
      definesItselfBySubtraction: hasIn({ needle: 'below the browser', text: TEMPLATE }),
    }).toStrictEqual({
      itsOwnHeading: true,
      namesTheArtifact: true,
      extendsRatherThanDuplicates: true,
      everythingOursRunsReal: true,
      mocksOnlyOutsideServices: true,
      harnessNotProxy: true,
      definesItselfBySubtraction: false,
    });
  });

  // WHAT STAYED IS WHAT ANOTHER WORKER WOULD READ AS FALSE. A bug-repro worker's red comes from
  // unchanged source and a manual-QA worker writes no file at all, so none of these belongs in the
  // shared payload.
  it('VALID: served template => keeps every rule that authoring these suites is alone in needing', () => {
    expect({
      modalityPerObservable: hasIn({
        needle:
          '**Choose where to assert, PER OBSERVABLE, by the modality rules under "Modality — chosen per OBSERVABLE, never per flow".**',
        text: TEMPLATE,
      }),
      noPlaywrightNoServer: hasIn({
        needle: '**You write NO Playwright. You start no server.**',
        text: TEMPLATE,
      }),
      harnessGotchas: hasIn({
        needle: '**Name a new HARNESS in `GOTCHAS` as well**',
        text: TEMPLATE,
      }),
      lineBreakingException: hasIn({
        needle:
          '**Breaking a line to watch it go red is a different thing from a fix, and it has its own bounds**',
        text: TEMPLATE,
      }),
      reportShape: hasIn({ needle: '### report — chunk <n>', text: TEMPLATE }),
      authoringHalfCarried: hasIn({
        needle: flowEvidenceContractStatics.authoringMarkdown,
        text: TEMPLATE,
      }),
      judgingHalfNotCarried: hasIn({
        needle: flowEvidenceContractStatics.judgingMarkdown,
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      modalityPerObservable: true,
      noPlaywrightNoServer: true,
      harnessGotchas: true,
      lineBreakingException: true,
      reportShape: true,
      authoringHalfCarried: true,
      judgingHalfNotCarried: false,
    });
  });

  // THE COLLISION RULE ITSELF IS THE TOOL'S, and this prompt spends the two hooks that text leaves
  // open: who counts as a live writer here, and which files the open set means in practice. The
  // four-way split this replaced keyed on the wrong thing — it made a `NOTES` authorisation the gate
  // on an existing file, when the wave already decides it, so an unauthorised fixture that could not
  // tell two values apart was a `rework` rather than a one-line widening. Pinned from both sides: the
  // shared sentences must NOT come back, and the two local answers must stay.
  it('VALID: served template => answers the collision hooks without restating the rule', () => {
    expect({
      defersToTheTool: hasIn({
        needle: '**Which paths are yours is in `get-worker-information`**',
        text: TEMPLATE,
      }),
      nothingWidensIt: hasIn({
        needle: '**Nothing widens the closed set on this round**',
        text: TEMPLATE,
      }),
      namesTheThreeFiles: hasIn({
        needle:
          'A fixture that cannot tell two values apart, a helper an earlier chunk left half-wired, a call site your own change just broke',
        text: TEMPLATE,
      }),
      harnessIsTheClosedCase: hasIn({
        needle: '**A harness your `NOTES` says a chunk in your wave OWNS is the closed case.**',
        text: TEMPLATE,
      }),
      restatesTheTable: hasIn({ needle: '| The path | Why nothing collides |', text: TEMPLATE }),
      notesAuthorisationIsGone: hasIn({
        needle: '**An EXISTING file your `NOTES` AUTHORISES is yours to change**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      defersToTheTool: true,
      nothingWidensIt: true,
      namesTheThreeFiles: true,
      harnessIsTheClosedCase: true,
      restatesTheTable: false,
      notesAuthorisationIsGone: false,
    });
  });

  // The shared payload lists FOUR `rework` triggers and says a prompt adds more. These are the ones it
  // adds. A reader that met only the four would swallow exactly these, so their presence here is what
  // makes that split honest.
  it('VALID: served template => adds this round`s own `rework` triggers to the shared four', () => {
    expect({
      itsOwnSection: hasIn({
        needle: "## What sends this round's worker to `rework`",
        text: TEMPLATE,
      }),
      namesTheSharedFour: hasIn({
        needle: '`get-worker-information` lists four triggers every worker shares.',
        text: TEMPLATE,
      }),
      provedNotJustGreen: hasIn({
        needle: "**`continue` means the chunk's `INTENT` is TRUE and you PROVED it.**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({ itsOwnSection: true, namesTheSharedFour: true, provedNotJustGreen: true });
  });

  // A NUMBERED STEP IS A CLAIM ABOUT ORDER, and nesting is where such a claim goes to hide: the sibling
  // implementation workflow carried `4.3` reading "step 5 happens HERE" while `4.4` undid what step 5
  // needed, so a reader following the numbers destroyed the evidence before it was asked for. This
  // workflow is FLAT — one number per action — and four things are pinned, because each fails
  // differently: a gap or duplicate in the sequence, an indented numbered item, a back-reference past
  // the last step, and any step claiming another happens inside it.
  it('VALID: served template => numbers its steps flat, in order, claiming none happens inside another', () => {
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));
    const stepNumbers = Array.from(workflow.matchAll(/^(\d+)\. \*\*/gmu), (match) =>
      Number(match[1]),
    );
    const references = Array.from(TEMPLATE.matchAll(/[Ss]tep (\d+)/gu), (match) =>
      Number(match[1]),
    );

    expect({
      sequential: stepNumbers,
      subNumberedItems: Array.from(workflow.matchAll(/^ +\d+\. /gmu), (match) => match[0].trim()),
      referencesPastTheLastStep: references.filter((n) => n > stepNumbers.length),
      claimsAStepHappensElsewhere: /[Ss]tep \d+ happens/u.test(TEMPLATE),
    }).toStrictEqual({
      sequential: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      subNumberedItems: [],
      referencesPastTheLastStep: [],
      claimsAStepHappensElsewhere: false,
    });
  });

  // THREE THINGS A REVIEWER CANNOT RECOVER FROM THE DIFF, so the worker has to hand them over. A unit
  // Codeweaver already proved leaves NO diff, and without `AUDIT:` the reviewer reads it as uncovered
  // and the round pays a rework for work already done. An invalid mock passes lint, typecheck and the
  // suite itself, so nothing but a named service catches it. And a unit assigned but not delivered is
  // a rework the reviewer must see. Pinned as: the audit step comes BEFORE the writing steps, its
  // three answers exist, and all three report fields exist.
  it('VALID: served template => audits the existing file against the checklist before writing anything', () => {
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));

    expect({
      auditIsStepFour: hasIn({
        needle:
          '4. **Fetch your success criteria, then AUDIT what is already in the file — before you write a line.**',
        text: workflow,
      }),
      fetchesTheChecklist: hasIn({
        needle:
          "**Call `get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })`**",
        text: workflow,
      }),
      // The middle answer is the one that earns the step: a case claiming a unit while unable to fail
      // is a false green already in the tree, and this is the first session positioned to see it.
      threeWayAnswer: hasIn({
        needle: '| a case that claims the unit but could not fail',
        text: workflow,
      }),
      bansTheDuplicate: hasIn({
        needle: '**A duplicate case is worse than no case**',
        text: workflow,
      }),
      auditPrecedesTheWriting: workflow.indexOf('AUDIT what is already in the file') < workflow.indexOf('**Write one test per path to EVERY end node'),
      reportCarriesAudit: hasIn({ needle: 'AUDIT:', text: TEMPLATE }),
      reportCarriesMocks: hasIn({
        needle: '<what the files you touched mock> — <the OUTSIDE service it replaces>',
        text: TEMPLATE,
      }),
      reportCarriesUncovered: hasIn({
        needle: '**`UNCOVERED:` is a FINDING, never a place to park work you could have done.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      auditIsStepFour: true,
      fetchesTheChecklist: true,
      threeWayAnswer: true,
      bansTheDuplicate: true,
      auditPrecedesTheWriting: true,
      reportCarriesAudit: true,
      reportCarriesMocks: true,
      reportCarriesUncovered: true,
    });
  });

  // A WORKER NAMES NO CHECK TYPES AT ALL. Its ward command is the file list and nothing else: ward
  // works out which checks apply to the paths it is given. Three of the five prompts made the worker
  // read a table and derive an `--only` set, and a fourth handed it a fixed one — every version was a
  // decision with a wrong answer, taken by the session least able to check it, and its cost is a check
  // that silently never ran on the file just written. Pinned from both sides: the command shape must
  // be there, and no `--only`, no check-type list and no derivation table may come back.
  it('VALID: served template => wards its FILES and names no check type', () => {
    expect({
      passesOnlyPaths: hasIn({
        needle:
          '**Run ward over your `FILES`, and pass NOTHING but those paths.** No `--only`, no check types',
        text: TEMPLATE,
      }),
      wardsWithoutOnly: TEMPLATE.includes('npm run ward -- -- ./'),
      commandNamesAnOnlyFlag: /npm run ward[^\n]*--only/u.test(TEMPLATE),
      derivationTable: /\|\s*`--only`\s*\|/u.test(TEMPLATE),
      tellsItToBuildTheCommand: hasIn({ needle: 'BUILD your ward command', text: TEMPLATE }),
    }).toStrictEqual({
      passesOnlyPaths: true,
      wardsWithoutOnly: true,
      commandNamesAnOnlyFlag: false,
      derivationTable: false,
      tellsItToBuildTheCommand: false,
    });
  });

  // THE `INTENT` BULLET MOVED TO `get-worker-information`, and it must not come back. It sat in all
  // five prompts, byte-identical but for one word here or there, and its second half restated
  // `roundProtocolStatics.chunkFields`' own yes/no test as well. What is left under this heading is
  // only what this round reads differently — which is why the heading no longer promises "your
  // chunk's fields" and then lists three of the five.
  it('VALID: served template => leaves the shared `INTENT` reading to the tool', () => {
    expect({
      retitled: hasIn({
        needle: '## The chunk fields this round reads differently',
        text: TEMPLATE,
      }),
      saysTheToolHoldsTheRest: hasIn({
        needle: '`get-worker-information` says what all five fields ARE.',
        text: TEMPLATE,
      }),
      restatesTheTwiceRule: hasIn({
        needle:
          'again before you write your report, because the `RESULT:` block answers it line by line',
        text: TEMPLATE,
      }),
      overclaimingHeading: hasIn({
        needle: "## Your chunk's fields, read as its worker",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      retitled: true,
      saysTheToolHoldsTheRest: true,
      restatesTheTwiceRule: false,
      overclaimingHeading: false,
    });
  });
});
