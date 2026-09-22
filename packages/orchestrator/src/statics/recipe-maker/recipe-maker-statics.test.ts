import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { recipeMakerStatics } from './recipe-maker-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = recipeMakerStatics.prompt.template;

describe('recipeMakerStatics', () => {
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: recipeMakerStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  it('VALID: served template => names its ten top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## What is yours, and what is not',
      '## The script',
      '## The four facts a setup is built out of',
      '## What a setup holds, and the three properties it keeps',
      '## One request per missing ingredient',
      '## Seeding the same thing twice, and reading what compare returns',
      '## The sad paths, and where each lands',
      '## How you finish',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its eleven script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Read the request',
      '### 2. Read the flow whole',
      '### 3. Enumerate what already exists',
      '### 4. Work out the seed state each walk needs',
      '### 5. Author the gaps',
      '### 6. Run the sequence, end to end',
      '### 7. Testing the SEQUENCE is what testing each recipe alone does not give you',
      '### 8. Record the run that proved each one',
      '### 9. Seed the same thing twice and compare',
      '### 10. Say what you could not find',
      '### 11. Declare your outcome and signal',
    ]);
  });

  // THE STEP THAT CANNOT BE SKIPPED — a recipe proven alone still fails composed, so the sequence
  // is what has to run. Testing each recipe on its own is the shape that looks like proof and is
  // not, which is why the prompt states the difference rather than implying it.
  it('VALID: served template => requires the whole setup sequence to run end to end, not one recipe at a time', () => {
    expect({
      theSequence: hasIn({
        needle: '### 7. Testing the SEQUENCE is what testing each recipe alone does not give you',
        text: TEMPLATE,
      }),
      endToEnd: hasIn({ needle: '### 6. Run the sequence, end to end', text: TEMPLATE }),
      composedFailure: hasIn({
        needle:
          'Three recipes that each pass\nin isolation still fail composed: one leaves state the next does not expect, or an id the first\nreturns is not the id the second wants.',
        text: TEMPLATE,
      }),
      existingIsNotTrusted: hasIn({
        needle:
          '**Run every recipe the set uses — the ones you wrote and the ones you found alike.**',
        text: TEMPLATE,
      }),
      landsWhereItClaims: hasIn({ needle: 'Confirm it LANDS where it claims.', text: TEMPLATE }),
    }).toStrictEqual({
      theSequence: true,
      endToEnd: true,
      composedFailure: true,
      existingIsNotTrusted: true,
      landsWhereItClaims: true,
    });
  });

  // A SEED WITH NO PROVING RUN IS A PATH NO WALK MAY BE SENT DOWN — `flow.recipes[]` carries the
  // instance and run that proved each entry, and `provenRunId: null` on the way IN is the same gap
  // as a recipe that does not exist.
  it('VALID: served template => records the proving run id per recipe onto the flow, and reads a null one as a gap', () => {
    expect({
      theWrite: hasIn({
        needle:
          "recipes: [ { id: '<recipe name>', instanceId: '<the instance>', runId: '<the run>' } ] } ] })",
        text: TEMPLATE,
      }),
      keyedUpsert: hasIn({
        needle:
          'The list is keyed by `id`, so restating a recipe UPSERTS its entry rather than duplicating it.',
        text: TEMPLATE,
      }),
      noProvingRun: hasIn({
        needle: '**A seed with no proving run is a path no walk may be sent down.**',
        text: TEMPLATE,
      }),
      nullIsAGap: hasIn({
        needle: '**`provenRunId: null` is a gap, not a formality.**',
        text: TEMPLATE,
      }),
      manufacturedDefect: hasIn({
        needle:
          'a fixer is then\nbriefed against a symptom no code produced and hunts through working code',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      theWrite: true,
      keyedUpsert: true,
      noProvingRun: true,
      nullIsAGap: true,
      manufacturedDefect: true,
    });
  });

  // ONE STEP PER REQUEST IS THE ROUTER'S RULE, so three missing ingredients are three calls. A
  // request naming three hands one worker all three, on a third of the context each one needs.
  it('VALID: served template => names write-ingredient and issues one request per missing ingredient', () => {
    expect({
      promptName: hasIn({ needle: '`write-ingredient` prompt', text: TEMPLATE }),
      stepKey: hasIn({ needle: "step: 'writeIngredient'", text: TEMPLATE }),
      onePerIngredient: hasIn({
        needle: '**ONE request per missing ingredient.**',
        text: TEMPLATE,
      }),
      threeMeansThree: hasIn({
        needle:
          'three missing\ningredients are three separate `quest-work` calls minting three sessions',
        text: TEMPLATE,
      }),
      batchingCost: hasIn({
        needle: 'A single request naming\nthree ingredients hands ONE worker all three to write',
        text: TEMPLATE,
      }),
      notASubAgent: hasIn({
        needle: '**That is a step of its own, and it is not a sub-agent**',
        text: TEMPLATE,
      }),
      reRunsItself: hasIn({
        needle: '**You re-run the setup yourself when it returns.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      promptName: true,
      stepKey: true,
      onePerIngredient: true,
      threeMeansThree: true,
      batchingCost: true,
      notASubAgent: true,
      reRunsItself: true,
    });
  });

  // THE COMPARE STEP IS RUNNABLE, ON ONE INSTANCE — `compare` refuses a cross-instance query BY
  // NAME (`compareArgsParseTransformer`'s own `--instance-a`/`--instance-b` refusal), so the prompt
  // has to say the seed-twice check runs as two RUNS of one instance, never two instances.
  it('VALID: served template => runs the seed-twice comparison as two runs of one instance, through compare', () => {
    expect({
      oneInstanceNotTwo: hasIn({
        needle: '**One instance, not two.**',
        text: TEMPLATE,
      }),
      crossInstanceRefused: hasIn({
        needle:
          '`--instance-a`/`--instance-b` are refused BY NAME, because two different instances "share nothing\nbut a spec."',
        text: TEMPLATE,
      }),
      twoRunsOneInstance: hasIn({
        needle:
          'dungeonmaster siegelense run --instance <id> --steps <the setup batch, verbatim>   # → run_1\ndungeonmaster siegelense run --instance <id> --steps <the same batch again>        # → run_2\ndungeonmaster siegelense compare --instance <id> --run-a run_1 --run-b run_2',
        text: TEMPLATE,
      }),
      neverTrailingLook: hasIn({
        needle:
          '**End the batch on the step that reaches the entry state — a `goto` or a `click` — never on a\ntrailing `look`.**',
        text: TEMPLATE,
      }),
      lookAlwaysEmpty: hasIn({
        needle: 'a `look` always records one, empty, since\nlooking changes nothing',
        text: TEMPLATE,
      }),
      sideBySide: hasIn({
        needle: '**Read the two deltas side by side — nothing diffs them for you.**',
        text: TEMPLATE,
      }),
      whatDiffersIsGenerated: hasIn({
        needle: '**whatever differs is a value the app generated and\nthen displayed.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      oneInstanceNotTwo: true,
      crossInstanceRefused: true,
      twoRunsOneInstance: true,
      neverTrailingLook: true,
      lookAlwaysEmpty: true,
      sideBySide: true,
      whatDiffersIsGenerated: true,
    });
  });

  // ONE PROMPT, TWO GRAPHS, AND NO FORWARD ROUTE — `flowrider.recipe` and `siegemaster.recipe`
  // share it, and both declare `{ wall: '@blocked' }` alone, so the session returns to its asker.
  it('VALID: served template => states the flow scope, the absent forward route and what `empty` means', () => {
    expect({
      flowScoped: hasIn({
        needle: '**A recipe is flow-scoped, not family-scoped.**',
        text: TEMPLATE,
      }),
      noForwardRoute: hasIn({ needle: '**You declare no forward route.**', text: TEMPLATE }),
      emptyMeaning: hasIn({
        needle:
          '`empty` is the\nhonest outcome when every seed the request named already exists and already carries the run id that\nproved it.',
        text: TEMPLATE,
      }),
      returnsToAsker: hasIn({
        needle: 'The work item you return to is the one that asked for you.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      flowScoped: true,
      noForwardRoute: true,
      emptyMeaning: true,
      returnsToAsker: true,
    });
  });

  // THE BOOK HAS TWO HALVES and a recipe that seeds one of something proves nothing an assertion
  // can tell apart — the quiet failure, which passes while measuring the wrong value.
  it('VALID: served template => demands both halves of a recipe and two of anything an assertion separates', () => {
    expect({
      bookEntry: hasIn({
        needle: 'packages/hydration-recipes/src/statics/recipe-book/recipe-book-statics.ts',
        text: TEMPLATE,
      }),
      seedBroker: hasIn({
        needle: 'packages/hydration-recipes/src/brokers/recipes/<name>/',
        text: TEMPLATE,
      }),
      bothHalves: hasIn({
        needle:
          '**An entry with no broker promises a state nothing can create; a broker with no entry is a state no\nsession can discover.**',
        text: TEMPLATE,
      }),
      twoOfAnything: hasIn({
        needle: '**Seed TWO of anything an assertion must tell apart.**',
        text: TEMPLATE,
      }),
      notAnOutcome: hasIn({
        needle: '**"No recipe covers this path" is not an outcome you may return.**',
        text: TEMPLATE,
      }),
      composeFirst: hasIn({
        needle: '**Your first question is always whether existing recipes already compose to it**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      bookEntry: true,
      seedBroker: true,
      bothHalves: true,
      twoOfAnything: true,
      notAnOutcome: true,
      composeFirst: true,
    });
  });

  // THE FOUR GUIDE FACTS IT TAKES, AND THE ONES IT LEAVES — `CONTROLS` and `FORCING` belong to the
  // siege planner's piece payload, `OFF-SCREEN` to `siegemaster-reader`, `TRAPS` to the planner's
  // notes. A prompt carrying them would author a guide half the graph already owns.
  it('VALID: served template => carries TOOLING, ENTRY, SEEDING and RESET and none of the other four headings', () => {
    expect({
      tooling: hasIn({ needle: '| TOOLING |', text: TEMPLATE }),
      entry: hasIn({ needle: '| ENTRY |', text: TEMPLATE }),
      seeding: hasIn({ needle: '| SEEDING |', text: TEMPLATE }),
      reset: hasIn({ needle: '| RESET |', text: TEMPLATE }),
      controls: TEMPLATE.includes('CONTROLS'),
      forcing: TEMPLATE.includes('FORCING'),
      offScreen: TEMPLATE.includes('OFF-SCREEN'),
      traps: TEMPLATE.includes('TRAPS'),
    }).toStrictEqual({
      tooling: true,
      entry: true,
      seeding: true,
      reset: true,
      controls: false,
      forcing: false,
      offScreen: false,
      traps: false,
    });
  });

  // A SETUP IS SUBMITTED, NOT RE-DERIVED, and a mid-walk seed recorded as part of it turns a
  // live-update test into a fresh-render test — silently, because both pass.
  it('VALID: served template => keeps the three setup properties and bans a ref as an element address', () => {
    expect({
      runnableBatch: hasIn({
        needle: '**A setup is a runnable batch, not prose.**',
        text: TEMPLATE,
      }),
      mixesSteps: hasIn({
        needle: '**It mixes recipes and driving steps.**',
        text: TEMPLATE,
      }),
      midWalkKeyed: hasIn({
        needle: '**Mid-walk seeds are keyed to the node they fire at**, never appended to the end.',
        text: TEMPLATE,
      }),
      testIdNeverRef: hasIn({
        needle: '**Identify every element by `testId` and scope, never by `ref`.**',
        text: TEMPLATE,
      }),
      staleRefIsSilent: hasIn({
        needle: 'A stale ref does not error — it points at whatever\nelement now holds that number',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      runnableBatch: true,
      mixesSteps: true,
      midWalkKeyed: true,
      testIdNeverRef: true,
      staleRefIsSilent: true,
    });
  });

  // IT OPENS ITS OWN INSTANCES because `recipe` declares no lane, so capacity and kill are its own
  // rules rather than the router's — and a leaked instance is not a child process anything reaps.
  it('VALID: served template => asks capacity before starting and closes every instance it opens', () => {
    expect({
      capacityFirst: hasIn({
        needle: '**Ask capacity before you open anything.**',
        text: TEMPLATE,
      }),
      startRefuses: hasIn({
        needle: '`start`\nrefuses outright when it is full',
        text: TEMPLATE,
      }),
      closesThem: hasIn({ needle: '**Close every instance you open.**', text: TEMPLATE }),
      leakReason: hasIn({
        needle: 'it is not\na child process of yours, so nothing tears it down for you',
        text: TEMPLATE,
      }),
      killInScript: hasIn({
        needle: 'dungeonmaster siegelense kill --instance <id>',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      capacityFirst: true,
      startRefuses: true,
      closesThem: true,
      leakReason: true,
      killInScript: true,
    });
  });

  // NOT FOUND IS AN ANSWER — a guessed command costs a whole walk, and an admitted gap costs one
  // lookup. The string is quoted verbatim because a paraphrase is what a reader will not recognise.
  it('VALID: served template => quotes the NOT FOUND line verbatim and prices the alternative', () => {
    expect({
      theLine: hasIn({
        needle: '**"NOT FOUND — the reader must work this out"**',
        text: TEMPLATE,
      }),
      thePrice: hasIn({
        needle: 'A wrong command costs a whole walk; an admitted\ngap costs one lookup.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ theLine: true, thePrice: true });
  });

  // IT WRITES ONLY INSIDE THE RECIPE BOOK AND COMMITS NOTHING — the family's own deterministic
  // `commit` step takes the whole tree, and a bare ward lands a sibling's reds on this work item.
  it('VALID: served template => scopes its writes and its ward, and takes no git verb', () => {
    expect({
      writesScoped: hasIn({
        needle: '`Edit` and `Write` **inside `packages/hydration-recipes` only**',
        text: TEMPLATE,
      }),
      wardScoped: hasIn({
        needle: '`npm run ward -- -- <the recipe files you touched>`',
        text: TEMPLATE,
      }),
      noBareWard: hasIn({
        needle: '**a bare `npm run ward`, and `--uncommitted`.**',
        text: TEMPLATE,
      }),
      noGit: hasIn({
        needle:
          "**git, in every verb.** You commit nothing; the family's own `commit` step takes the whole tree",
        text: TEMPLATE,
      }),
      drivesNoWalk: hasIn({
        needle:
          "**driving a walk.** You reach a starting state and confirm it; reading a screen for a verdict is the walker's job",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      writesScoped: true,
      wardScoped: true,
      noBareWard: true,
      noGit: true,
      drivesNoWalk: true,
    });
  });

  // COUNTED, NOT TESTED FOR PRESENCE — a block landing in two sections costs this prompt its budget
  // twice over for one rule, which is how `spilled-tool-result-statics.test.ts` grades its own hosts.
  // The marking block is absent because this step holds no units: a planner is assigned none, and a
  // requested step is never minted units, so a mark discipline here names an action nobody may take.
  it('VALID: served template => interpolates each shared block it takes exactly once, and takes no marking block', () => {
    expect({
      sadPaths: TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1,
      spilled: TEMPLATE.split(spilledToolResultStatics.markdown).length - 1,
      marking: hasIn({ needle: unitMarkingStatics.markdown, text: TEMPLATE }),
      markingHeading: TEMPLATE.includes('## Marking your units'),
    }).toStrictEqual({ sadPaths: 1, spilled: 1, marking: false, markingHeading: false });
  });

  it('VALID: served template => opens with `get-quest-work` as its first call', () => {
    expect({
      firstStep: hasIn({ needle: '### 1. Read the request', text: TEMPLATE }),
      theCall: hasIn({ needle: 'get-quest-work({ questId, workItemId })', text: TEMPLATE }),
      readsTheReason: hasIn({
        needle:
          'Take the `reason` literally: it is the only statement of\nwhat the asker could not reach',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ firstStep: true, theCall: true, readsTheReason: true });
  });
});
