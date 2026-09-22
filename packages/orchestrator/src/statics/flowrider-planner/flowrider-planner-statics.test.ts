import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { flowriderPlannerStatics } from './flowrider-planner-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides, so a needle
// written on one line finds its sentence however the markdown happens to wrap. Anything measuring
// real bytes reads the template directly instead.
const WHITESPACE_RUN = /\s+/gu;

const TEMPLATE = flowriderPlannerStatics.prompt.template;

// THE TOKEN IS WRITTEN DOWN ONCE, in the statics file, and read back here — the same shape every
// sibling prompt test takes. A literal repeated in the test cannot catch a template that stops
// declaring the slot its caller substitutes.
const ARGUMENTS = flowriderPlannerStatics.prompt.placeholders.arguments;

const hasIn = ({ needle }: { needle: string }): boolean =>
  TEMPLATE.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

describe('flowriderPlannerStatics', () => {
  // MEASURED WITH BOTH SHARED BLOCKS ALREADY INTERPOLATED — a template literal expands its
  // interpolations at module load, so `TEMPLATE` IS the string the MCP layer weighs. Over the
  // ceiling that layer spills the result to a file and hands the session a path instead of its
  // instructions, and nothing reports a failure.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(flowriderPlannerStatics.prompt.template, 'utf8')).toBeLessThan(
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

  // THE INTERPOLATED SAD-PATH BLOCK OPENS WITH ITS OWN `##` HEADING, landing between the piece-field
  // section and the operation context — a section this file never writes itself.
  it('VALID: served template => names its seven top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Your tools',
      '## The script',
      '## Writing a piece',
      '## The sad paths, and where each lands',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its sixteen script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your work item',
      '### 2. Read your flow',
      '### 3. A flow retyped `operational`',
      '### 4. The walk paths are given',
      '### 5. Paths are the itinerary, units are the coverage',
      '### 6. Load the standards, then explore',
      '### 7. Read the implementation for the exact value',
      '### 8. Choose `layer`, per unit',
      '### 9. Choose `shape`, per file',
      '### 10. Resolve `observableTarget`, per unit',
      '### 11. Write no `surface`',
      '### 12. If you cannot state `failsIf`, go back to step 7',
      '### 13. Cut one piece per spec file',
      '### 14. Fill `payload.units[]` 1:1 with `assignedUnitIds`',
      '### 15. Where a test needs a seeded system, request a recipe',
      '### 16. Write the plan, read it back, declare the outcome, signal',
    ]);
  });

  it('VALID: served template => names the eight payload blocks a piece carries, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### `.+`$/gmu), (match) => match[0])).toStrictEqual([
      '### `specPath` and `mode`',
      '### `harnesses`',
      '### `walk`',
      '### `units`',
      '### `facts`',
      '### `fences`',
      '### `traps`',
      '### `doNotTouch`',
    ]);
  });

  // STEP 1 IS `get-quest-work`, and it is the first tool call the page names. A session that fetches
  // its flow first is planning against a scope it has not read.
  it('VALID: served template => opens on get-quest-work, before any other call', () => {
    expect({
      theCall: hasIn({
        needle:
          "### 1. Fetch your work item\n\nYour first call, before anything else:\n\n```\nget-quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID' })\n```",
      }),
      beforeGetQuest:
        TEMPLATE.indexOf('get-quest-work({') < TEMPLATE.indexOf("get-quest({ questId: 'QUEST_ID'"),
      beforeGetArchitecture:
        TEMPLATE.indexOf('get-quest-work({') < TEMPLATE.indexOf('`get-architecture` and'),
      nullPiece: hasIn({
        needle:
          '| `piece` | `null`. A planner is handed no piece, because you are the session that writes them |',
      }),
    }).toStrictEqual({
      theCall: true,
      beforeGetQuest: true,
      beforeGetArchitecture: true,
      nullPiece: true,
    });
  });

  // THE FLOW RENDER ARRIVES AT STEP 1 AND IS THE FIRST SECTION CUT WHEN THE RETURN IS OVER BUDGET.
  // `get-quest` is the re-fetch, and it is the one call on this page that can spill.
  it('VALID: served template => re-fetches the flow only when truncated names it', () => {
    expect({
      alreadyHeld: hasIn({
        needle:
          '**You already hold it.** `flows[].rendered` from step 1 is the same text `get-quest` serves, so the ordinary path makes no second call.',
      }),
      firstCut: hasIn({
        needle:
          '**`flows` is the FIRST section cut when the return is over budget.** When `truncated` names it, that render is an empty list rather than a short one, and this is the call that gets it back:',
      }),
      theCall: hasIn({ needle: "get-quest({ questId: 'QUEST_ID', flowId: '<scope.flowId>' })" }),
      neverStage: hasIn({
        needle:
          '**Never pass `stage` beside `flowId`.** The call is refused — `stage` picks sections and `flowId` picks within one, so the two together return an empty answer that reads as "this flow is empty".',
      }),
      neverNarrowedByPackage: hasIn({
        needle:
          '**Never narrow it by package either.** Your scope spans every package the flow crosses, and a flow filtered to one package is not a smaller flow',
      }),
    }).toStrictEqual({
      alreadyHeld: true,
      firstCut: true,
      theCall: true,
      neverStage: true,
      neverNarrowedByPackage: true,
    });
  });

  // A RETYPED FLOW IS `empty`, NEVER A WALL — and the denominator does NOT go empty with it. The
  // planner step declares no scope, so the flow-type filter that narrows `review` never runs here.
  it('VALID: served template => routes a retyped operational flow to empty, with its units marked', () => {
    expect({
      neverBlocked: hasIn({
        needle: '**That is not a wall, and never `blocked`.**',
      }),
      stallsTheQuest: hasIn({
        needle: 'Blocking there stalls the whole quest over a correction that did its job.',
      }),
      denominatorIsNotEmpty: hasIn({
        needle:
          '**Your `inScopeUnits` does NOT come back empty here, and that is the trap.** Your own step declares no scope, so the flow-type filter that narrows the `review` step after you never runs on yours — every unit on the retyped flow arrives in your denominator exactly as it did before.',
      }),
      whatToDo: hasIn({
        needle:
          'Mark each one `cant-meet` with a `toSettle` naming siegemaster, cut no piece, and declare `empty`.',
      }),
    }).toStrictEqual({
      neverBlocked: true,
      stallsTheQuest: true,
      denominatorIsNotEmpty: true,
      whatToDo: true,
    });
  });

  // THE WALK PATHS ARE GIVEN, AND THE TRUNCATION FLAG TRAVELS WITH THEM. A worker handed a silently
  // capped path list writes a suite that looks complete.
  it('VALID: served template => takes the walk paths as given and carries pathsTruncated', () => {
    expect({
      doNotReDerive: hasIn({
        needle:
          '**Do not re-derive them from the graph.** They are a property of the flow, already computed, and a second derivation drifts from the one every other reader shares.',
      }),
      carryTheFlag: hasIn({
        needle:
          "**Carry `pathsTruncated` into every piece's `walk`, exactly as you were served it.**",
      }),
      whatItMeans: hasIn({
        needle: 'A worker handed a silently capped path list writes a suite that looks complete.',
      }),
      differentFromASpill: hasIn({
        needle:
          '**That flag and a spilled fetch are different mechanisms.** A spill is a file you read in full; this is a list you were served less of than exists, with a flag saying so.',
      }),
      pathsAreNotCoverage: hasIn({
        needle:
          '**Covering every path proves nothing on its own** — every unit still needs an assertion that bites',
      }),
    }).toStrictEqual({
      doNotReDerive: true,
      carryTheFlag: true,
      whatItMeans: true,
      differentFromASpill: true,
      pathsAreNotCoverage: true,
    });
  });

  // `layer` IS PER UNIT AND `shape` IS PER FILE, and the two axes are orthogonal. A file-level layer
  // label throws away the choice at its first hop; collapsing either axis into the other settles
  // units it never read.
  it('VALID: served template => keeps layer per unit, shape per file, and the two orthogonal', () => {
    expect({
      neverPerFile: hasIn({
        needle:
          '**Never per file.** One spec file routinely carries units at different layers, and a file-level label throws away the choice you made here at its first hop.',
      }),
      propertyOfTheUnit: hasIn({
        needle: '**The layer is a property of the UNIT, not of the flow and not of the package.**',
      }),
      shapePerFile: hasIn({
        needle:
          'Several paths through one spec file means `journey` — one test per path, driven end to end. One path carrying many independent inputs means `matrix` — one parameterized test over the grid.',
      }),
      orthogonal: hasIn({
        needle:
          '**`shape` and `layer` are orthogonal and neither may collapse the other.** `shape` sets how many tests exist inside a file; `layer` sets where each assertion reads from.',
      }),
      browserCap: hasIn({
        needle:
          '**`browser` is what the concurrency cap counts.** A piece is a browser walk when ANY of its units reads `browser`, and a batch may name at most four of those — the plan is refused past that.',
      }),
    }).toStrictEqual({
      neverPerFile: true,
      propertyOfTheUnit: true,
      shapePerFile: true,
      orthogonal: true,
      browserCap: true,
    });
  });

  // `observableTarget` IS A JOIN OFF THE SERVED UNIT ROW, not a reading of the render: every row
  // carries the nodeId and edgeId from the same enumeration the plan is checked against. Taking an
  // id off an edge LINE is the mistake, because that line carries two and only one is the unit.
  it('VALID: served template => resolves observableTarget off the unit row, by kind', () => {
    expect({
      aJoinNotAReading: hasIn({
        needle:
          '**It is a join off the step-1 unit row, not a reading of the render** — every row carries the `nodeId` and `edgeId` the graph gave it, from the same enumeration the plan is checked against:',
      }),
      terminalRow: hasIn({
        needle: "| `terminal` | `{ target: 'node', nodeId: <that row's nodeId> }` |",
      }),
      branchRow: hasIn({
        needle: "| `branch` | `{ target: 'edge', edgeId: <that row's edgeId> }` |",
      }),
      observableRow: hasIn({
        needle: "| `observable` | `{ target: 'observable', nodeId: <that row's nodeId> }` |",
      }),
      refusedWhenWrong: hasIn({
        needle:
          '**A target that does not resolve to the element its unit actually hangs on is the plan refused.**',
      }),
      twoIdsOnAnEdgeLine: hasIn({
        needle:
          "**an edge line carries TWO ids and they name different things** — the `<edge:…>` at the head is the EDGE's own id and IS the unit, while the `[#…]` further along is the node that edge points AT.",
      }),
    }).toStrictEqual({
      aJoinNotAReading: true,
      terminalRow: true,
      branchRow: true,
      observableRow: true,
      refusedWhenWrong: true,
      twoIdsOnAnEdgeLine: true,
    });
  });

  // THE SURFACE IS SERVED AND REFILLED ON EVERY READ, so typing one is transcribing. Reading it is
  // still required: an assertion taken at a different surface has not proved its unit.
  it('VALID: served template => writes no surface but reads the one it is served', () => {
    expect({
      leaveItAbsent: hasIn({
        needle:
          "**Leave the field absent on every unit row.** The surface each unit is measured at arrives on its own `inScopeUnits` row, computed from that unit's kind and outcome type, and the orchestrator fills the field again on every read. A planner that types one is transcribing a value it was handed.",
      }),
      butReadIt: hasIn({
        needle:
          '**Read it, though.** It says where the assertion has to read from, and an assertion taken at a different surface has not proved its unit whatever the test is called',
      }),
      noSurfaceKeyOnARow: hasIn({
        needle:
          "**No `surface` key, and no `text` key.** The surface is filled for you on every read, and the unit's own words reach the worker on its served unit row rather than through your retyping of them",
      }),
    }).toStrictEqual({ leaveItAbsent: true, butReadIt: true, noSurfaceKeyOnARow: true });
  });

  // `failsIf` IS WHAT MAKES `assert` CHECKABLE, and a unit whose wrong value the planner cannot name
  // is a step-7 reading it has not done — not a sentence to fill in.
  it('VALID: served template => requires failsIf on every unit row and sends a gap back to step 7', () => {
    expect({
      bothRequired: hasIn({
        needle: '**Both are required and the plan is refused without them.**',
      }),
      whatItCatches: hasIn({
        needle:
          '**`failsIf` is what makes `assert` checkable.** An assertion nothing can turn red is the defect this field exists to catch: it passes while reading nothing.',
      }),
      backToStepSeven: hasIn({
        needle:
          'A unit whose wrong value you cannot name is a unit whose assertion is not specified yet — that is a step-7 reading you have not done, never a sentence to fill in.',
      }),
      readForTheExactValue: hasIn({
        needle:
          "**The unit's own words say what must be TRUE. The implementation is the only thing that says what value actually COMES BACK.**",
      }),
    }).toStrictEqual({
      bothRequired: true,
      whatItCatches: true,
      backToStepSeven: true,
      readForTheExactValue: true,
    });
  });

  // ONE PIECE IS ONE SPEC FILE, and the duplicate-path refusal counts harness paths alongside the
  // spec — so two pieces extending one shared harness in one batch is the plan refused.
  it('VALID: served template => cuts one work piece per spec file, harness paths counted', () => {
    expect({
      onePieceOneFile: hasIn({
        needle:
          '**One piece IS one spec file.** `payload.specPath` is the file, `mode` says whether it is written fresh or extended, and `harnesses` are the test-infrastructure files that spec drives through.',
      }),
      bothConditions: hasIn({
        needle:
          '**Two pieces share a BATCH only when BOTH hold: they touch DIFFERENT FILES, and NEITHER needs the other to have landed.**',
      }),
      harnessesCount: hasIn({
        needle:
          'and for this family that count includes every `harnesses[].path`, not just the spec, so two pieces extending one shared harness belong in different batches.',
      }),
      noWait: hasIn({
        needle:
          '**Never write a wait into a piece.** A harness another piece is creating means a LATER BATCH',
      }),
      stepWork: hasIn({
        needle:
          '**Every piece in one batch names the same `step`, and that step is `work`.** Those are the sessions you are cutting. The `review`, `commit` and `ward` steps after them are minted by the router without pieces, so you cut none for them.',
      }),
      noLineNumbers: hasIn({
        needle:
          '**Never a line number, in any field.** Every batch that lands writes files, so a number recorded now is wrong by the batch that reads it.',
      }),
    }).toStrictEqual({
      onePieceOneFile: true,
      bothConditions: true,
      harnessesCount: true,
      noWait: true,
      stepWork: true,
      noLineNumbers: true,
    });
  });

  // THE 1:1 RULE IS WHAT CATCHES A DROPPED TERMINAL, and the four kinds no session of this family
  // can settle are what would otherwise be forced onto a piece or left silent. The planner step
  // declares no scope; `review` is measured over `test`, `runtime` and three kinds.
  it('VALID: served template => holds units 1:1 and routes the four unsettleable kinds to plannerMarks', () => {
    expect({
      oneToOne: hasIn({
        needle:
          'One row per assigned unit, no row for anything else. The two lists are checked against each other: **a row missing or a row extra is the plan refused**, which is what catches a dropped terminal or a dropped labelled edge',
      }),
      theUnfilteredDenominator: hasIn({
        needle:
          '**Four kinds of unit reach your denominator that no session in this family can settle.** Your own step declares no scope and inherits the whole set unfiltered; the `review` step after you is measured over `test` verification, `runtime` flows and the terminal / branch / observable kinds alone.',
      }),
      readCheckRow: hasIn({
        needle:
          "| `verifyByReading: true` — the render marks it `(read-check)` | a green test proves a value is RIGHT, never where it CAME FROM | codeweaver's reviewer, by opening the file |",
      }),
      offMapRow: hasIn({
        needle:
          "| `kind: 'off-map'` | a probe family is a breakage class no flow graph draws | siegemaster |",
      }),
      cantMeetIsTheAccount: hasIn({
        needle:
          '**Each of those is a `plannerMarks` `cant-meet` with a `toSettle` naming who does settle it — never a piece, and never left silent.**',
      }),
      whyNotUnclaimed: hasIn({
        needle:
          "Leaving one unclaimed accounts for it to nobody: your reviewer's scope does not carry it, so it reaches no later session of this family at all.",
      }),
    }).toStrictEqual({
      oneToOne: true,
      theUnfilteredDenominator: true,
      readCheckRow: true,
      offMapRow: true,
      cantMeetIsTheAccount: true,
      whyNotUnclaimed: true,
    });
  });

  // A SEED IS REQUESTED, NEVER INVENTED, and a `recipeId` naming something the flow does not record
  // is the plan refused.
  it('VALID: served template => names a recorded recipe or requests one through quest-work', () => {
    expect({
      readTheRecipes: hasIn({
        needle:
          'and only a recipe the flow already records, with the run that proved it, or the plan is refused.',
      }),
      neverInline: hasIn({
        needle:
          '**Where none does, request one. Never invent a seed inline, and never have a worker seed by hand:**',
      }),
      theCall: hasIn({
        needle: "payload: { kind: 'request', step: 'recipe', reason:",
      }),
      itReturnsToYou: hasIn({
        needle:
          'That mints a `recipe` session and returns to you when it is done. Attach the names it records, then carry on.',
      }),
    }).toStrictEqual({
      readTheRecipes: true,
      neverInline: true,
      theCall: true,
      itReturnsToYou: true,
    });
  });

  // THE PLAN IS A `quest-work` PAYLOAD, family flowrider, and the two server-stamped fields are
  // refused rather than ignored.
  it('VALID: served template => submits the plan as a quest-work plan payload, family flowrider', () => {
    expect({
      envelope: hasIn({
        needle:
          "quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', payload: { kind: 'plan', plan: {",
      }),
      family: hasIn({ needle: "family: 'flowrider'," }),
      serverStamped: hasIn({
        needle:
          'One call. `writtenBy` and `writtenAt` are stamped server-side and a payload carrying either is refused, so send neither.',
      }),
      batchOrder: hasIn({
        needle:
          '**Batch order IS execution order.** The first batch runs, drains, and the next one starts.',
      }),
      marksAndPiecesAreExclusive: hasIn({
        needle:
          'A unit a piece already claims may not also carry a mark — a unit is either assigned to a session or recorded as uncovered, never both.',
      }),
    }).toStrictEqual({
      envelope: true,
      family: true,
      serverStamped: true,
      batchOrder: true,
      marksAndPiecesAreExclusive: true,
    });
  });

  // THE READ-BACK EXISTS FOR THE ABSENCE, and the coverage table renders a MARK column beside the
  // claim column — so a unit an earlier session settled is a third legitimate account, not a hole.
  it('VALID: served template => walks the coverage rows and names three accounts per unit', () => {
    expect({
      theCall: hasIn({
        needle:
          "get-quest-work({ questId: 'QUEST_ID', operationItemId: '<scope.operationItemId>' })",
      }),
      whatItCatches: hasIn({
        needle:
          '**A unit no piece claims is the defect this read exists to catch**: in JSON an absence is invisible by construction, and the table is where it becomes a row.',
      }),
      threeWays: hasIn({
        needle: 'Each one is accounted for in exactly one of three ways:',
      }),
      claimedByAPiece: hasIn({
        needle:
          "| its `claimed by` cell names a piece | claimed, and that piece's `payload.units` carries its row |",
      }),
      recordedCantMeet: hasIn({
        needle:
          '| its `claimed by` cell reads `planner recorded it as cant-meet` | you decided no session writing tests on this flow settles it, and you wrote the `toSettle` |',
      }),
      alreadySettled: hasIn({
        needle:
          '| its `mark` cell already reads `met` or `cant-meet` | a session before you settled it. Nothing re-opens a settled unit, so a piece for it is work nobody needs |',
      }),
      theHole: hasIn({
        needle:
          '**A row whose `mark` reads `outstanding` or `unmet` AND whose `claimed by` reads `— NO PIECE CLAIMS THIS UNIT —` is work you have not cut.**',
      }),
      rowsNotTheNumber: hasIn({
        needle:
          'The count line above the table counts every unclaimed row, settled ones included, so it is the ROWS you read and never the number.',
      }),
      amendment: hasIn({
        needle:
          "payload: { kind: 'amendment', reason: '<what the read-back showed>', plan: { … the whole plan again … } }",
      }),
    }).toStrictEqual({
      theCall: true,
      whatItCatches: true,
      threeWays: true,
      claimedByAPiece: true,
      recordedCantMeet: true,
      alreadySettled: true,
      theHole: true,
      rowsNotTheNumber: true,
      amendment: true,
    });
  });

  // THE OUTCOME IS DECLARED THROUGH `quest-work`; `signal-back` only ends the turn. `empty` here is
  // narrower than a codeweaver's: every unit may be present and still be another family's.
  it('VALID: served template => declares the outcome through quest-work, then signals once', () => {
    expect({
      outcomeCall: hasIn({
        needle:
          "payload: { kind: 'outcome', word: 'done', reason: '<what you cut, and anything a person must rule on>' }",
      }),
      doneRow: hasIn({
        needle: '| `done` | you cut at least one piece | the `work` step, on your first batch |',
      }),
      emptyRow: hasIn({
        needle:
          "| `empty` | nothing on this flow was a flowrider's to prove — every unit is settled, or marked `cant-meet` because another family settles it | the scope closes |",
      }),
      wallRow: hasIn({
        needle:
          '| `wall` | an environment wall stopped you | the quest blocks for a human, carrying your reason |',
      }),
      emptyMeaning: hasIn({
        needle:
          '**`empty` means there was nothing to act on, never that there was work and you chose to cut none.**',
      }),
      signal: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete' })",
      }),
      refusalIsNotACrash: hasIn({
        needle:
          '**A refused `signal-back` arrives as an error on the call itself.** It is not a crash and not something to retry unchanged',
      }),
    }).toStrictEqual({
      outcomeCall: true,
      doneRow: true,
      emptyRow: true,
      wallRow: true,
      emptyMeaning: true,
      signal: true,
      refusalIsNotACrash: true,
    });
  });

  // THE PLANNER DOES NOT WRITE THE TEST, and a piece carrying pseudo-code is how that line is
  // crossed. The walk, the unit rows and the facts pin the behaviour instead.
  it('VALID: served template => forbids pseudo-code and names what replaces it', () => {
    expect({
      noSketch: hasIn({
        needle:
          "**You do not write the test, not even as a sketch.** A piece carrying a spec's body in pseudo-code makes the worker a typist and you the author.",
      }),
      whatItDerivesFrom: hasIn({
        needle:
          "the walk with its forced branch labels, each unit's `layer`, `assert` and `failsIf`, and `facts`.",
      }),
      severalShapes: hasIn({ needle: '**Several correct shapes are fine**' }),
      harnessProvesNothing: hasIn({
        needle:
          'A harness carries no `proves`: it settles no unit of its own. It is the machinery, and the spec file is what carries the claim.',
      }),
      bothSides: hasIn({ needle: '**Both sides, every file** — one side is not a shape.' }),
      factsAnchoredOnAName: hasIn({ needle: '**Anchor every one on a NAME.**' }),
      fencesAreYours: hasIn({
        needle: '**A fence is a boundary only you can draw, because you cut the pieces.**',
      }),
      trapsGroundedInAReading: hasIn({
        needle:
          '**Name where you read the rule this session, so it can check you** — never a rule you remember.',
      }),
    }).toStrictEqual({
      noSketch: true,
      whatItDerivesFrom: true,
      severalShapes: true,
      harnessProvesNothing: true,
      bothSides: true,
      factsAnchoredOnAName: true,
      fencesAreYours: true,
      trapsGroundedInAReading: true,
    });
  });

  // TWO SHARED BLOCKS, EACH ONCE. The spill rule sits with `get-quest`, the one fetch on this page
  // that can actually spill — a `get-quest-work` return is CUT by whole sections and says so in
  // `truncated`, never handed back as a stub. The marking block is absent: a planner is assigned no
  // units, and `plannerMarks` is the whole of its authority.
  it('VALID: served template => takes the spill rule and the sad-path block whole, each exactly once', () => {
    expect({
      spilled: TEMPLATE.split(spilledToolResultStatics.markdown).length - 1,
      spilledSitsWithGetQuest:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest({ questId: 'QUEST_ID'"),
      spilledIsNotAtGetQuestWork:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID' })"),
      sadPath: TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1,
      marking: TEMPLATE.includes(unitMarkingStatics.markdown),
      plannerMarksAuthority: hasIn({
        needle:
          '**Your one mark authority is `plannerMarks`, and `cant-meet` is the only mark it takes** — on a unit no piece of yours claims. Every other mark belongs to the session that settles the unit.',
      }),
      cantMeetNeedsAToSettle: hasIn({
        needle:
          '**`plannerMarks` takes `cant-meet` and nothing else**, on a unit no piece of yours claims, and every entry needs a `toSettle` naming the action that WOULD settle it, as an instruction rather than a question.',
      }),
    }).toStrictEqual({
      spilled: 1,
      spilledSitsWithGetQuest: true,
      spilledIsNotAtGetQuestWork: true,
      sadPath: 1,
      marking: false,
      plannerMarksAuthority: true,
      cantMeetNeedsAToSettle: true,
    });
  });

  // THIS SESSION DISPATCHES NOBODY, WRITES NO FILE AND RUNS NO COMMAND. A planner reaching for a
  // worker runs a batch the router cannot see or route; one reaching for ward or a browser is doing
  // a worker's job with none of a worker's scope.
  it('VALID: served template => dispatches no worker, writes no file and runs no command', () => {
    expect({
      routerDispatches: hasIn({
        needle:
          '**You dispatch no worker.** You cut the pieces; the router mints one session per piece, in the batch order you wrote.',
      }),
      noFile: hasIn({
        needle: '**You write no file at all.** Your plan is a tool call, not a document on disk.',
      }),
      noGit: hasIn({
        needle: '**You run no git.** Everything you would ask it arrives in your step-1 return.',
      }),
      noWard: hasIn({
        needle: '**You run no ward, no Playwright, no dev server and no browser.**',
      }),
      noLedgerEdit: hasIn({
        needle:
          '**You never edit the operations ledger.** You declare an outcome at the end and the router applies it.',
      }),
      searchNotRead: hasIn({ needle: '**Delegate a SEARCH, never a READ.**' }),
      questPlansMap: TEMPLATE.includes('.quest-plans'),
      subagentType: TEMPLATE.includes('subagent_type'),
      modifyQuest: TEMPLATE.includes('modify-quest({'),
    }).toStrictEqual({
      routerDispatches: true,
      noFile: true,
      noGit: true,
      noWard: true,
      noLedgerEdit: true,
      searchNotRead: true,
      questPlansMap: false,
      subagentType: false,
      modifyQuest: false,
    });
  });
});
