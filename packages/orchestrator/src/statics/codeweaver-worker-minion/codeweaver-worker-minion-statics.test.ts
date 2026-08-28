import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';
import { workerInformationStatics } from '../worker-information/worker-information-statics';

import { codeweaverWorkerMinionStatics } from './codeweaver-worker-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = codeweaverWorkerMinionStatics.prompt.template;

describe('codeweaverWorkerMinionStatics', () => {
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

  // WHAT STAYED IS WHAT ANOTHER WORKER WOULD READ AS FALSE. A manual-QA worker writes no file and a
  // bug-repro worker's red comes from unchanged source, so none of these belongs in the shared payload.
  it('VALID: served template => keeps every rule that building product code is alone in needing', () => {
    expect({
      // NO STEP NUMBER IN THE NEEDLE. What must be true is that the work is done red-first; which
      // number that step carries moves whenever anything is inserted above it, and pinning `3.` here
      // went red the moment the tool call became step 1.
      redFirst: hasIn({
        needle:
          '**Give the test something to fail against — but ONLY where the export is NET NEW.**',
        text: TEMPLATE,
      }),
      wrongValueRed: hasIn({ needle: '**The red you need is a WRONG VALUE:**', text: TEMPLATE }),
      integrationCompanion: hasIn({
        needle:
          '**`flows/` and `startup/` require an `.integration.test.ts` INSTEAD of a unit test.**',
        text: TEMPLATE,
      }),
      lineBreakingException: hasIn({
        needle:
          '**Breaking a line to watch it go red is a different thing from a fix, and it has its own bounds.**',
        text: TEMPLATE,
      }),
      reportShape: hasIn({ needle: '### report — chunk <n>', text: TEMPLATE }),
    }).toStrictEqual({
      redFirst: true,
      wrongValueRed: true,
      integrationCompanion: true,
      lineBreakingException: true,
      reportShape: true,
    });
  });

  // THE COLLISION RULE ITSELF IS THE TOOL'S, and this prompt spends the two hooks that text leaves
  // open: who counts as a live writer here, and which files the open set means in practice. Pinned
  // from both sides — the shared sentences must NOT come back, and the two local answers must stay,
  // because a prompt that restates the rule and a prompt that answers neither hook fail differently.
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
          'A prop the parent component never passes, a contract field an earlier chunk left off, a call site your own change just broke',
        text: TEMPLATE,
      }),
      restatesTheTable: hasIn({ needle: '| The path | Why nothing collides |', text: TEMPLATE }),
      restatesTheBoundary: hasIn({
        needle: '**`FILES` is a COLLISION boundary, not a permission list.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      defersToTheTool: true,
      nothingWidensIt: true,
      namesTheThreeFiles: true,
      restatesTheTable: false,
      restatesTheBoundary: false,
    });
  });

  // A NUMBERED STEP IS A CLAIM ABOUT ORDER, and this workflow broke that claim twice over. Step 4 used
  // to write the shell, run it AND fill it in until green, while step 5 said "run the test against step
  // 4's empty shell" — a shell the reader had already filled in by then. The giveaway was a forward
  // reference inside step 4 reading "step 5 happens HERE", which is the served text admitting its own
  // numbering is wrong. Three halves are pinned, because each fails differently: a gap or a duplicate
  // in the sequence, a back-reference pointing past the last step, and any step claiming another one
  // happens inside it.
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
      referencesPastTheLastStep: references.filter((n) => n > stepNumbers.length),
      claimsAStepHappensElsewhere: /[Ss]tep \d+ happens/u.test(TEMPLATE),
      // AN INDENTED NUMBERED ITEM IS A SUB-STEP, which is what this workflow is flat to avoid: one
      // number per action, so no ordering claim can hide one level down where nothing cites it.
      subNumberedItems: Array.from(workflow.matchAll(/^ +\d+\. \*\*/gmu), (match) =>
        match[0].trim(),
      ),
    }).toStrictEqual({
      sequential: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      referencesPastTheLastStep: [],
      claimsAStepHappensElsewhere: false,
      subNumberedItems: [],
    });
  });

  // AN EMPTY SHELL IS FOR A NET NEW EXPORT ONLY. Making one out of an export that already exists means
  // deleting working logic to put it back later, in a file the chunk never meant to rewrite — so where
  // the export exists, step 5 writes nothing and the red comes free, because the code still does what
  // it did yesterday. `workerInformationStatics` carries all three cases; this prompt spends them
  // across steps 4, 5 and 6, and each of those leads is pinned, because collapsing any two of them
  // back together is the defect this replaced.
  it('VALID: served template => makes the empty shell conditional on a NET NEW export', () => {
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));
    const stepFive = workflow.slice(workflow.indexOf('5. **'), workflow.indexOf('6. **'));

    expect({
      fourIsTheTest: hasIn({
        needle: '4. **Write the failing test, driven by what `UNITS` names.**',
        text: TEMPLATE,
      }),
      shellIsNetNewOnly: hasIn({
        needle:
          '**Give the test something to fail against — but ONLY where the export is NET NEW.**',
        text: stepFive,
      }),
      existingExportWritesNothing: hasIn({
        needle: '**Where the export already EXISTS, write nothing here and go to step 6.**',
        text: stepFive,
      }),
      namesWhatAShellWouldCost: hasIn({
        needle: 'means deleting logic to put it back later',
        text: stepFive,
      }),
      sixIsTheProof: hasIn({
        needle: 'get the red. THAT RED IS THE ONLY PROOF YOUR TEST BITES',
        text: TEMPLATE,
      }),
      sevenIsTheLogic: hasIn({ needle: '7. **Now write the logic, until green**', text: TEMPLATE }),
    }).toStrictEqual({
      fourIsTheTest: true,
      shellIsNetNewOnly: true,
      existingExportWritesNothing: true,
      namesWhatAShellWouldCost: true,
      sixIsTheProof: true,
      sevenIsTheLogic: true,
    });
  });

  // `get-folder-detail` TAKES A FOLDER TYPE, and a worker's folder types come from `FILES`, which sits
  // inside the chunk. Its brief carries a `PLAN:` path and a `CHUNK:` NUMBER and never the chunk body
  // (`roundProtocolStatics.briefKeys` — "A chunk is never pasted into one"), so step 2 cannot name a
  // folder type and step 3 is the first moment that can. Step 2 asked for the call anyway, which is a
  // circular instruction: the reader either guesses a folder type or silently skips the call, and
  // nothing downstream reports either. The planner prompts already solved this and say so in as many
  // words; the workers did not. Pinned as an ORDER — the deferral in step 2 and the call in step 3 —
  // because either half alone reads as complete.
  it('VALID: served template => defers the get-folder-detail call until FILES is known', () => {
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));
    const stepTwo = workflow.slice(workflow.indexOf('2. **'), workflow.indexOf('3. **'));
    const stepThree = workflow.slice(workflow.indexOf('3. **'), workflow.indexOf('4. **'));

    expect({
      stepTwoDefersTheCall: hasIn({
        needle: '**Do not CALL `get-folder-detail` yet.**',
        text: stepTwo,
      }),
      stepTwoSaysWhyItCannot: hasIn({
        needle: 'your brief carries a path and a chunk NUMBER, never the chunk itself',
        text: stepTwo,
      }),
      stepThreeMakesTheCall: hasIn({
        needle:
          'NOW call `get-folder-detail`, for every folder type your `FILES` land in — this is the first moment you can name one',
        text: stepThree,
      }),
    }).toStrictEqual({
      stepTwoDefersTheCall: true,
      stepTwoSaysWhyItCannot: true,
      stepThreeMakesTheCall: true,
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

  // A WORKER NAMES NO CHECK TYPES AT ALL. Its ward command is the file list and nothing else: ward
  // works out which checks apply to the paths it is given. Three of the five prompts made the worker
  // read a table and derive an `--only` set, and a fourth handed it a fixed one — every version was a
  // decision with a wrong answer, taken by the session least able to check it, and its cost is a check
  // that silently never ran on the file just written. Pinned from both sides: the command shape must
  // be there, and no `--only`, no check-type list and no derivation table may come back.
  // THE COMMAND HAS TO SIT WHERE THE NEED IS. The red step tells a worker to run something and the
  // ward step names what to run with, and a real worker met the first with the second still four
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
