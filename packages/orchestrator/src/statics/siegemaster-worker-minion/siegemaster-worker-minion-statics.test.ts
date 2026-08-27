import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { workerInformationStatics } from '../worker-information/worker-information-statics';

import { siegemasterWorkerMinionStatics } from './siegemaster-worker-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterWorkerMinionStatics.prompt.template;

describe('siegemasterWorkerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the round document's table or the return block — so a session that
  // skips the call has no method at all.
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
  // tool now; the three it never took stay withheld there rather than being restated here.
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

  // WHAT STAYED IS WHAT ANOTHER WORKER WOULD READ AS FALSE. It drives a live system by hand, alone,
  // and writes no file — none of that is true of a codeweaver or pesteater worker, so none of it
  // belongs in the shared payload.
  it('VALID: served template => keeps every rule that this discipline is alone in needing', () => {
    expect({
      seesToVerify: hasIn({ needle: '**You verify a unit by SEEING it**', text: TEMPLATE }),
      devServerBan: hasIn({
        needle: "**The dev server's lifecycle, and any server that owns your reset lever.**",
        text: TEMPLATE,
      }),
      stayingInsideYourChunk: hasIn({ needle: '## Staying inside your chunk', text: TEMPLATE }),
      legitimateClick: hasIn({ needle: 'click the real elements', text: TEMPLATE }),
      brokenWouldShow: hasIn({
        needle: '**`BROKEN WOULD SHOW` is the whole proof.**',
        text: TEMPLATE,
      }),
      spikeTmpDriver: hasIn({
        needle:
          '**A driver you write to reach a browser goes under `spike-tmp/`, as a `.js` or `.py` FILE.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      seesToVerify: true,
      devServerBan: true,
      stayingInsideYourChunk: true,
      legitimateClick: true,
      brokenWouldShow: true,
      spikeTmpDriver: true,
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
      continueDefinition: hasIn({
        needle:
          '**`continue` means you walked the whole slice and every `RESULT:` line answers `yes`, each backed by a value you read off the running system.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ itsOwnSection: true, namesTheSharedFour: true, continueDefinition: true });
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
      sequential: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      subNumberedItems: [],
      referencesPastTheLastStep: [],
      claimsAStepHappensElsewhere: false,
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
