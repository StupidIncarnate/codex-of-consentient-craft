import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { declaredValueStatics } from '../declared-value/declared-value-statics';
import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';
import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { siegeHappyWalkerStatics } from './siege-happy-walker-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides, so a needle
// written on one line finds its sentence however the markdown happens to wrap. Anything measuring
// real bytes reads the template directly instead.
const WHITESPACE_RUN = /\s+/gu;

const TEMPLATE = siegeHappyWalkerStatics.prompt.template;

// THE TOKEN IS WRITTEN DOWN ONCE, in the statics file, and read back here — the same shape every
// sibling prompt test takes. A literal repeated in the test cannot catch a template that stops
// declaring the slot its caller substitutes.
const ARGUMENTS = siegeHappyWalkerStatics.prompt.placeholders.arguments;

const hasIn = ({ needle }: { needle: string }): boolean =>
  TEMPLATE.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

describe('siegeHappyWalkerStatics', () => {
  // MEASURED WITH ALL FOUR SHARED BLOCKS ALREADY INTERPOLATED — a template literal expands its
  // interpolations at module load, so `TEMPLATE` IS the string the MCP layer weighs. Over the ceiling
  // that layer spills the result to a file and hands the session a path instead of its instructions,
  // and nothing reports a failure.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(siegeHappyWalkerStatics.prompt.template, 'utf8')).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, last, under its own heading', () => {
    expect({
      placeholder: ARGUMENTS,
      count: TEMPLATE.split(ARGUMENTS).length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith(ARGUMENTS),
      underItsOwnHeading: hasIn({ needle: `## Operation Context\n\n${ARGUMENTS}` }),
    }).toStrictEqual({
      placeholder: '$ARGUMENTS',
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
    });
  });

  // THE FOUR HEADED SHARED BLOCKS LAND LAST, each opening with its own `##` heading, between the
  // script and the operation context — sections this file never writes itself.
  it('VALID: served template => names its nine top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Your tools',
      '## The script',
      '## What counts as a declared style value',
      '## Marking your units',
      '## `verifyByHuman`',
      '## The sad paths, and where each lands',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its thirteen script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your work item',
      '### 2. Read the walking manual, once',
      '### 3. Your instance is already running',
      '### 4. Check your recipes',
      '### 5. Learn what each unit expects — before you drive',
      '### 6. Reset, then drive the whole path',
      '### 7. Record as you drive',
      '### 8. Look at everything you pass',
      '### 9. Judge what you find as a USER would',
      '### 10. Settle an unflagged declared-value unit',
      '### 11. Mark your units, and the plan',
      '### 12. Record the walk',
      '### 13. Declare the outcome, then signal',
    ]);
  });

  // FIVE SHARED BLOCKS, EACH EXACTLY ONCE. Restating any of them is text served twice against the
  // same budget; missing one is a rule this whole family agreed on that this prompt silently drops.
  it('VALID: served template => takes all five shared blocks whole, each exactly once', () => {
    expect({
      declaredValue: TEMPLATE.split(declaredValueStatics.markdown).length - 1,
      sadPath: TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1,
      spilled: TEMPLATE.split(spilledToolResultStatics.markdown).length - 1,
      marking: TEMPLATE.split(unitMarkingStatics.markdown).length - 1,
      automatability: TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1,
    }).toStrictEqual({ declaredValue: 1, sadPath: 1, spilled: 1, marking: 1, automatability: 1 });
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE WALKER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN workflow where
  // the flag applies — right beside the `cant-meet` mark it exists to replace.
  it('VALID: served template => tells the walker to flag verifyByHuman instead of cant-meet when nothing could ever settle a unit', () => {
    expect(
      hasIn({
        needle:
          "**Where a unit resists everything you can try, and nothing at any layer could ever settle it either — not a later session, not a later walk, nothing but a person's own judgment once the quest is done — flag it instead of writing `cant-meet`.** Set `verifyByHuman: true` on its observable through the same `modify-quest` call above, rather than a `toSettle` nothing could ever carry out.",
      }),
    ).toBe(true);
  });

  // THE SPILL RULE SITS BESIDE THE ONE FETCH IN THIS PROMPT THAT CAN ACTUALLY SPILL. `get-quest-work`
  // self-truncates — it drops whole sections and raises `truncated[]` rather than growing past the
  // ceiling — so it never reaches the generic MCP spill-to-file path. The `flows` section it may cut
  // is recovered through a plain `get-quest` call, which carries no such truncation of its own and is
  // the fetch this rule actually protects.
  it('VALID: served template => places the spill rule beside the get-quest fallback, not get-quest-work', () => {
    expect({
      fallbackCall: hasIn({
        needle: "get-quest({ questId: 'QUEST_ID', flowId: '<piece scope flowId>' })",
      }),
      spillSitsAfterFallback:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest({ questId: 'QUEST_ID', flowId: '<piece scope flowId>' })"),
      spillSitsAfterGetQuestWork:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID' })"),
      truncatedNamesFlows: hasIn({
        needle: 'Where `truncated` names `flows`, that render was cut to fit',
      }),
    }).toStrictEqual({
      fallbackCall: true,
      spillSitsAfterFallback: true,
      spillSitsAfterGetQuestWork: true,
      truncatedNamesFlows: true,
    });
  });

  // THE RULE THIS WHOLE PROMPT EXISTS TO ENFORCE. Stated in the opening block, repeated in the
  // "what you never do" list, repeated again inside the tool table, and enforced again at the one
  // step where a source-derived value is genuinely needed.
  it('VALID: served template => forbids opening a source file, everywhere the rule has to hold', () => {
    expect({
      openingBlock: hasIn({
        needle:
          "**You open no source file, for any reason.** Not `discover`, not `Read` on anything under a package's `src/`, its tests, or any spec",
      }),
      whatYouNeverDo: hasIn({
        needle:
          '**You open no source file, and you read no test file, ever.** A selector or an expected value found in either is exactly as banned as one you invented',
      }),
      toolsNotYours: hasIn({
        needle: "Read on anything under a package's src/, its tests, or any spec",
      }),
      step5Ban: hasIn({
        needle:
          "**Never `discover`. Never `Read` a file under a package's `src/`, its tests, or anything else source holds.** That is `siegemaster-reader`'s whole job, not yours.",
      }),
      discoverNotYoursRow: hasIn({
        needle: 'discover the whole rule this prompt exists to enforce',
      }),
    }).toStrictEqual({
      openingBlock: true,
      whatYouNeverDo: true,
      toolsNotYours: true,
      step5Ban: true,
      discoverNotYoursRow: true,
    });
  });

  // A VALUE ONLY SOURCE HOLDS IS REQUESTED, NEVER READ. The unit still wins when the requested value
  // disagrees with it — taking the code's own behaviour as the expectation would confirm the defect
  // this role was sent to find.
  it('VALID: served template => requests a source-only value from siegemaster-reader instead of reading one', () => {
    expect({
      requestCall: hasIn({
        needle: "payload: { kind: 'request', step: 'read', reason:",
      }),
      unitWins: hasIn({
        needle:
          "**Where what `siegemaster-reader` returns disagrees with a unit's own words, the UNIT wins, and the disagreement is itself a finding.**",
      }),
    }).toStrictEqual({ requestCall: true, unitWins: true });
  });

  // THE WHOLE PROOF. A measurement that could not have come out differently proves nothing, even
  // where what was seen was right — so every unit's record carries the value a defect would have
  // produced instead.
  it('VALID: served template => requires BROKEN WOULD SHOW per unit, and says what makes it real', () => {
    expect({
      recordShape: hasIn({
        needle:
          'STARTED FROM: <the state you reset to, and the commands that got you there>\n  DID:          <your commands in order — the path driven, the payload sent, the branch forced>\n  SAW:          <the measured value — a value, never an adjective>\n  BROKEN WOULD SHOW: <the specific different value a defect would have produced>',
      }),
      wholeProof: hasIn({
        needle: '**`BROKEN WOULD SHOW` is the whole proof.**',
      }),
      concreteExample: hasIn({
        needle:
          'Would show `alpha-2026-06` first, because the newest entry sorts last under the defect',
      }),
      searchYourDraft: hasIn({
        needle:
          'Search your own draft for "confirmed", "held", "verified", "as expected" and "correctly"',
      }),
    }).toStrictEqual({
      recordShape: true,
      wholeProof: true,
      concreteExample: true,
      searchYourDraft: true,
    });
  });

  // A CLEAN WALK IS RECORDED TOO. The instance id and the run id are what make the citation
  // mechanical rather than a sentence a later reader has to parse, and nothing else in this design
  // carries proof that a path was actually driven.
  it('VALID: served template => records every walk with its instance id and run id, clean or not', () => {
    expect({
      cleanWalkIncluded: hasIn({
        needle: '**Every path you drive gets a `walked` note, a CLEAN walk included.**',
      }),
      noteCall: hasIn({
        needle:
          "questNotes: [ { id: '<short, unique>', kind: 'walked', role: 'siege-happy-walker', workItemId: 'WORK_ITEM_ID', flowId: '<your flow id>', instanceId: '<your Instance ID>', runId:",
      }),
      proofOfDriving: hasIn({
        needle:
          "That id is the proof the path was driven rather than claimed, and it is the only handle anything downstream has on this walk's evidence",
      }),
    }).toStrictEqual({ cleanWalkIncluded: true, noteCall: true, proofOfDriving: true });
  });

  // THE REASON [SIGN ONCE] EXISTED IS GONE, AND SO IS THE TEXT. A re-walk now writes its own
  // observation set on its own work item, so nothing overwrites an earlier walk's evidence — the ban
  // this token used to carry has nothing left to protect.
  it('EMPTY: served template => carries no [SIGN ONCE] rule', () => {
    expect({ signOnce: TEMPLATE.includes('[SIGN ONCE]') }).toStrictEqual({ signOnce: false });
  });

  // A WALKER DISPATCHES NOTHING. No pass 2, no sub-agent, no RED TESTS list to protect a deliberate
  // red — the fixer that turns a fresh `unmet` mark green is a different session entirely.
  it('EMPTY: served template => dispatches no sub-agent and writes no file', () => {
    expect({
      agentCall: TEMPLATE.includes('Agent('),
      subagentType: TEMPLATE.includes('subagent_type'),
      pass2: TEMPLATE.includes('Pass 2'),
      redTests: TEMPLATE.includes('RED TESTS'),
      dispatchesNothingRule: hasIn({
        needle: '**You dispatch nothing.** No `Agent`, no sub-agent, no pass 2.',
      }),
    }).toStrictEqual({
      agentCall: true,
      subagentType: false,
      pass2: false,
      redTests: false,
      dispatchesNothingRule: true,
    });
  });

  // THE ROUTER OWNS start AND kill, ALWAYS — stated on its own, independent of whether the walking
  // docs scope ever gets trimmed of the two verbs.
  it('VALID: served template => bans start and kill on its own instance, by name', () => {
    expect({
      manualNeverTeachesThem: hasIn({
        needle:
          "**Two verbs your manual will never teach you, on purpose: `start` and `kill`. Both are the router's.**",
      }),
      toolsBanStartKill: hasIn({
        needle: "Bash: dungeonmaster siegelense start / kill the router's verbs, not yours",
      }),
      neverRestart: hasIn({
        needle:
          '**You do not start it. You do not name it. You never restart it, for any reason.**',
      }),
    }).toStrictEqual({
      manualNeverTeachesThem: true,
      toolsBanStartKill: true,
      neverRestart: true,
    });
  });

  // A DEAD INSTANCE IS A MEASURED THING, NEVER A GUESS. Checking status before writing anything down
  // is what stops a dead driver from being reported as a rendering bug in the app itself.
  it('VALID: served template => checks instance status before recording, and never self-heals a dead one', () => {
    expect({
      checkStatusFirst: hasIn({
        needle:
          '**If your instance stops under you, check its `status` before you write anything down.**',
      }),
      queueNotWall: hasIn({
        needle: 'A slow start is a QUEUE, never a wall',
      }),
      deadIsUnmet: hasIn({
        needle:
          'A dead instance is `unmet`, with the `status` output as your evidence — never self-healed, and never a `wall` on its own.',
      }),
      driverVsApiServer: hasIn({
        needle: 'A DRIVER dying is never a finding about the app; an API-server dying may be',
      }),
    }).toStrictEqual({
      checkStatusFirst: true,
      queueNotWall: true,
      deadIsUnmet: true,
      driverVsApiServer: true,
    });
  });

  it('VALID: served template => judges what it finds against a table that records rather than fixes', () => {
    expect({
      breakingRow: hasIn({ needle: '| a breaking issue | record it, always |' }),
      readsWrongRow: hasIn({
        needle:
          '| something that works but reads wrong — an ugly transition, a misaligned control, a truncated label, a spinner that never resolves, a state with no feedback | **record it. This is a defect, whether or not a unit names it.** |',
      }),
      noObservableClaim: hasIn({
        needle: '**"No observable claims it" is not a reason to leave something broken.**',
      }),
      noFixVerb: TEMPLATE.includes('fix it'),
    }).toStrictEqual({
      breakingRow: true,
      readsWrongRow: true,
      noObservableClaim: true,
      noFixVerb: false,
    });
  });

  // A DEFECT WITH NO CLAIMING UNIT BECOMES ONE FIRST, through modify-quest — never a second mark on
  // an existing unit, which is how one defect quietly hides a second.
  it('VALID: served template => turns an unclaimed defect into a new observable before marking it', () => {
    expect({
      addObservable: hasIn({
        needle:
          "modify-quest({ questId: 'QUEST_ID', flows: [ { id: '<flow id>', nodes: [ { id: '<node id>', observables: [",
      }),
      twoDefectsTwoUnits: hasIn({
        needle: '**Two defects on one unit is two units, never two marks on one.**',
      }),
      observationsCall: hasIn({
        needle:
          "payload: { kind: 'observations', observations: [\n  { unitId: '<unit id>', mark: 'met', evidence:",
      }),
      amendmentCall: hasIn({
        needle: "payload: { kind: 'amendment', reason: '<what you drove, and what proved wrong>'",
      }),
    }).toStrictEqual({
      addObservable: true,
      twoDefectsTwoUnits: true,
      observationsCall: true,
      amendmentCall: true,
    });
  });

  // THE BUG THIS GUARDS: this role drives a happy path against an instance, and its reading ladder
  // has to be the walking manual. A copy-paste from the adversarial walker's own docs line serves
  // the ATTACKING manual instead — same tool call shape, wrong scope — silently, since both scopes
  // parse and run. Asserting only the presence of `--for walking` lets a future edit add
  // `--for attacking` alongside it; asserting the sibling scope's absence is what catches that.
  it('VALID: served template => reads the siegelense docs scoped to walking, never attacking', () => {
    expect({
      fetchesWalkingDocs: TEMPLATE.includes('dungeonmaster siegelense docs --for walking'),
      neverFetchesAttackingDocs: TEMPLATE.includes('--for attacking'),
    }).toStrictEqual({
      fetchesWalkingDocs: true,
      neverFetchesAttackingDocs: false,
    });
  });

  it('VALID: served template => closes with a declared outcome then a single signal-back', () => {
    expect({
      outcomeCall: hasIn({
        needle:
          "payload: { kind: 'outcome', word: 'done', reason: '<what you drove, and what you found>' }",
      }),
      signal: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete' })",
      }),
      closesNothing: hasIn({
        needle:
          '**You close nothing.** The router kills your instance once your work item records — a session that dies mid-walk strands no server.',
      }),
    }).toStrictEqual({ outcomeCall: true, signal: true, closesNothing: true });
  });
});
