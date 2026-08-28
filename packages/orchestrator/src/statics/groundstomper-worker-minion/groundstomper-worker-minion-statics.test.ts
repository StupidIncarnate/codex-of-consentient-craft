import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { workerInformationStatics } from '../worker-information/worker-information-statics';

import { groundstomperWorkerMinionStatics } from './groundstomper-worker-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = groundstomperWorkerMinionStatics.prompt.template;

describe('groundstomperWorkerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the chunk fields or the return block — so a session that skips the
  // call has no method at all.
  it('VALID: served template => makes the get-worker-information call step 1 of the workflow', () => {
    // `## Workflow` is quoted inline earlier in the prompt ("...through `## Workflow`**"), so the
    // anchor includes the surrounding newlines to land on the real heading rather than that mention.
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow\n') + 1);

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

  // WHAT STAYED IS WHAT ANOTHER WORKER WOULD READ AS FALSE. A codeweaver worker's red is red-first
  // against an empty shell, and a manual-QA worker drives a live system rather than a spec file — so
  // none of these Playwright-and-mutation specifics belongs in the shared payload.
  it('VALID: served template => keeps every rule that a browser-walk worker is alone in needing', () => {
    expect({
      mutationIsNormal: hasIn({
        needle: '**Where a case can fail first, watch it fail before you make it pass.**',
        text: TEMPLATE,
      }),
      threeBounds: hasIn({
        needle: '**One line, in one file, for as long as one spec run takes.**',
        text: TEMPLATE,
      }),
      bringToFront: hasIn({
        needle: '`page.bringToFront()` on the page you are about to measure',
        text: TEMPLATE,
      }),
      reportShape: hasIn({ needle: '### report — chunk <n>', text: TEMPLATE }),
    }).toStrictEqual({
      mutationIsNormal: true,
      threeBounds: true,
      bringToFront: true,
      reportShape: true,
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
      playwrightConfigTrigger: hasIn({
        needle:
          'A harness a sibling piece of work owns would have to change, or the Playwright config would.',
        text: TEMPLATE,
      }),
      provedNotJustGreen: hasIn({
        needle: "**`continue` means the chunk's `INTENT` is TRUE and you PROVED it.**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      itsOwnSection: true,
      namesTheSharedFour: true,
      playwrightConfigTrigger: true,
      provedNotJustGreen: true,
    });
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
      sequential: [1, 2, 3, 4, 5, 6, 7, 8, 9],
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
  // THE COMMAND HAS TO SIT WHERE THE NEED IS. The red step tells a worker to run something and the
  // ward step names what to run with, and a real worker met the first with the second still several
  // steps away: it reached for `run-ward` — a tool whose `mode: 'changed'` reads like "the files I
  // changed" — wrote a failing ward result onto its parent's work item, and the orchestrator closed a
  // healthy item as `ward_failed` 65 seconds later. The worker named the mistake itself 76 seconds
  // after that, so the gap was proximity, not comprehension. Both halves are pinned: the command is
  // AT the red step, and it still comes before the ward step that spends it over the whole `FILES`.
  it('VALID: served template => names the scoped command at the red step, not only at the ward step', () => {
    expect({
      namesTheCommandAtTheRedStep: hasIn({
        needle: 'the one way you run anything: scoped ward over the paths you just wrote.',
        text: TEMPLATE,
      }),
      closesTheMcpRouteThere: hasIn({
        needle: '**Never the `run-ward` MCP tool for this.**',
        text: TEMPLATE,
      }),
      saysWhereItsRedWouldLand: hasIn({
        needle: "lands on your parent's work item as that item's verdict",
        text: TEMPLATE,
      }),
      commandComesBeforeTheWardStep:
        TEMPLATE.indexOf('the one way you run anything') <
        TEMPLATE.indexOf('**Run ward over your `FILES`'),
    }).toStrictEqual({
      namesTheCommandAtTheRedStep: true,
      closesTheMcpRouteThere: true,
      saysWhereItsRedWouldLand: true,
      commandComesBeforeTheWardStep: true,
    });
  });

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
