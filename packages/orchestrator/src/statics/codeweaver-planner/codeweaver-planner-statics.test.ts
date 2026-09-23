import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { codeweaverPlannerStatics } from './codeweaver-planner-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides, so a needle
// written on one line finds its sentence however the markdown happens to wrap. Anything measuring
// real bytes reads the template directly instead.
const WHITESPACE_RUN = /\s+/gu;

const TEMPLATE = codeweaverPlannerStatics.prompt.template;

// THE TOKEN IS WRITTEN DOWN ONCE, in the statics file, and read back here — the same shape every
// sibling prompt test takes. A literal repeated in the test cannot catch a template that stops
// declaring the slot its caller substitutes.
const ARGUMENTS = codeweaverPlannerStatics.prompt.placeholders.arguments;

const hasIn = ({ needle }: { needle: string }): boolean =>
  TEMPLATE.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

describe('codeweaverPlannerStatics', () => {
  // MEASURED WITH `sadPathRoutingStatics.markdown` ALREADY INTERPOLATED — a template literal expands
  // its interpolations at module load, so `TEMPLATE` IS the string the MCP layer weighs. Over the
  // ceiling that layer spills the result to a file and hands the session a path instead of its
  // instructions, and nothing reports a failure.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(codeweaverPlannerStatics.prompt.template, 'utf8')).toBeLessThan(
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

  it('VALID: served template => names its ten script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your work item',
      '### 2. Fetch your flow',
      '### 3. Load the standards',
      '### 4. Explore your package',
      '### 5. Read what the scopes before you landed',
      '### 6. Cut the pieces',
      '### 7. Where the code you need lives in another package',
      '### 8. Write the plan',
      '### 9. Read the plan back',
      '### 10. Declare the outcome, then signal',
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
    }).toStrictEqual({ theCall: true, beforeGetQuest: true, beforeGetArchitecture: true });
  });

  // `piece: null` IS SERVED AS AN EXPLICIT NULL, and a session reading an absent key as a failed
  // fetch reports a wall. The page says which value it is and why.
  it('VALID: served template => reads the step-1 return as scope, denominator and a null piece', () => {
    expect({
      scope: hasIn({
        needle:
          "| `scope` | your cell — `flowId`, `packageNames`, `operationItemId`, and the operation item's own text |",
      }),
      denominator: hasIn({
        needle:
          '| `inScopeUnits` | every unit this scope is answerable for. **This is your denominator**, and step 9 counts against it |',
      }),
      nullPiece: hasIn({
        needle:
          '| `piece` | `null`. A planner is handed no piece, because you are the session that writes them |',
      }),
      committedPaths: hasIn({
        needle:
          '| `committedPaths` | what the scopes before you already committed on this branch |',
      }),
    }).toStrictEqual({ scope: true, denominator: true, nullPiece: true, committedPaths: true });
  });

  // THIS SESSION RUNS NO GIT. `committedPaths` is served at step 1, so the reading a `git log` would
  // buy is already in hand — and a planner that reaches for git is one command away from a tree it
  // is only supposed to read.
  it('VALID: served template => runs no git and no ward, and says what replaces each', () => {
    expect({
      noGitRule: hasIn({
        needle: '**You run no git.** Everything you would ask it arrives in your step-1 return.',
      }),
      noWardRule: hasIn({
        needle:
          "**You run no ward.** A worker wards its own paths, and this family's `ward` step grades the branch.",
      }),
      gitToolRow: hasIn({ needle: 'git, in any form step 1 serves what you would ask it' }),
      wardToolRow: hasIn({ needle: 'npm run ward, in any form a worker wards its own paths' }),
      committedPathsIsTheReading: hasIn({
        needle: '`committedPaths` from step 1 is that reading, and it is the whole of it.',
      }),
      noGitLog: TEMPLATE.includes('git log'),
    }).toStrictEqual({
      noGitRule: true,
      noWardRule: true,
      gitToolRow: true,
      wardToolRow: true,
      committedPathsIsTheReading: true,
      noGitLog: false,
    });
  });

  // `packagesAffected` IS THE ONE `modify-quest` FIELD THIS STEP HOLDS, and it is REPLACED WHOLE —
  // a write sending back fewer entries than it found drops the rest.
  it('VALID: served template => writes packagesAffected through modify-quest and nothing else', () => {
    expect({
      theCall: hasIn({
        needle:
          "modify-quest({ questId: 'QUEST_ID', packagesAffected: [ … every entry already there, plus yours … ] })",
      }),
      replacedWhole: hasIn({
        needle:
          '**`packagesAffected` is REPLACED WHOLE on write.** Send every entry already there back with your new one, or the write drops the rest. It is the one field this step may touch.',
      }),
      toolRow: hasIn({ needle: 'modify-quest step 7, packagesAffected and nothing else' }),
      notYoursRow: hasIn({ needle: 'modify-quest on any field but packagesAffected' }),
      beforePlanningAgainstIt: hasIn({
        needle:
          '**Add any package your pieces write into to `packagesAffected` BEFORE you plan against it**',
      }),
    }).toStrictEqual({
      theCall: true,
      replacedWhole: true,
      toolRow: true,
      notYoursRow: true,
      beforePlanningAgainstIt: true,
    });
  });

  // THE PLAN PAYLOAD IS A WIRE SHAPE the work tool parses by field name. A field renamed here is a
  // plan refused whole, and the two server-stamped fields are refused rather than ignored.
  it('VALID: served template => submits the plan as a quest-work plan payload, family codeweaver', () => {
    expect({
      envelope: hasIn({
        needle:
          "quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', payload: { kind: 'plan', plan: {",
      }),
      family: hasIn({ needle: "family: 'codeweaver'," }),
      flowIdNullable: hasIn({
        needle: "flowId: '<scope.flowId, or null on a contracts-only cell>',",
      }),
      serverStamped: hasIn({
        needle:
          'One call. `writtenBy` and `writtenAt` are stamped server-side and a payload carrying either is refused, so send neither.',
      }),
      batchOrder: hasIn({
        needle:
          '**Batch order IS execution order.** The first batch runs, drains, and the next one starts.',
      }),
    }).toStrictEqual({
      envelope: true,
      family: true,
      flowIdNullable: true,
      serverStamped: true,
      batchOrder: true,
    });
  });

  // EVERY PIECE THIS PLANNER CUTS IS A `work` PIECE. The steps after it are minted by the router with
  // no piece behind them, so a planner cutting a `review` piece is cutting a session nobody dispatches.
  it('VALID: served template => cuts work pieces only, one per file group', () => {
    expect({
      oneFileGroup: hasIn({ needle: '**One piece per FILE GROUP.**' }),
      stepWork: hasIn({
        needle:
          "Every piece names `step: 'work'`: those are the sessions you are cutting. The `review`, `commit` and `ward` steps after them are minted by the router without pieces, so you cut none for them.",
      }),
      bothConditions: hasIn({
        needle:
          '**Two pieces share a BATCH only when BOTH hold: they touch DIFFERENT FILES, and NEITHER needs the other to have landed.**',
      }),
      noWait: hasIn({
        needle:
          '**Never write a wait into a piece.** A file another piece is creating means a LATER BATCH',
      }),
      noFilePathTwiceInABatch: hasIn({
        needle: 'two pieces in ONE batch naming the same file path;',
      }),
      unitsOneToOne: hasIn({
        needle: 'a piece whose `payload.units` is not 1:1 with its own `assignedUnitIds`;',
      }),
    }).toStrictEqual({
      oneFileGroup: true,
      stepWork: true,
      bothConditions: true,
      noWait: true,
      noFilePathTwiceInABatch: true,
      unitsOneToOne: true,
    });
  });

  // ASSIGNED IS WHAT A PIECE MARKS; CONTEXT IS THE SEAM'S FAR HALF. Claiming a sibling cell's unit is
  // the refusal, and dropping it entirely is the silent version — the piece then builds against
  // nothing.
  it('VALID: served template => splits assigned units from context units', () => {
    expect({
      theSplit: hasIn({
        needle:
          "**Split ASSIGNED from CONTEXT.** A unit whose `{package}` is yours is assigned — it goes in that piece's `assignedUnitIds` and gets a row in `payload.units`. A sibling's unit on a node you tag is CONTEXT",
      }),
      readAndNeverClaimed: hasIn({
        needle: 'so it goes in `contextUnitIds`, is read and built against, and is never claimed.',
      }),
      exemptFromScope: hasIn({
        needle:
          "an assigned unit that is not in your `inScopeUnits` — a context unit is exempt, and that exemption is what keeps a seam's far half legal;",
      }),
    }).toStrictEqual({ theSplit: true, readAndNeverClaimed: true, exemptFromScope: true });
  });

  // A `(read-check)` UNIT IS SETTLED BY OPENING A FILE, so it can sit on no piece that is measured by
  // tests: the 1:1 rule would then force a unit row nothing can assert. Its constraint is a trap, and
  // the reviewer is the step whose scope carries it.
  it("VALID: served template => routes a read-check unit to traps, never to a piece's units", () => {
    expect({
      whatItIs: hasIn({
        needle:
          '**An observable marked `(read-check)` is settled by OPENING A FILE, not by running a test.**',
      }),
      neverAUnitRow: hasIn({
        needle:
          "So it never goes in a piece's `payload.units` and never in its `assignedUnitIds`. It goes in `payload.traps`, worded as the constraint the worker honours while it writes, and the reviewer settles it by opening the file.",
      }),
      trapsSectionRepeatsIt: hasIn({
        needle:
          "A `(read-check)` unit's constraint lives here and only here, worded as what the worker must honour while it writes",
      }),
      greenTestProvesTheValue: hasIn({
        needle: 'A green test proves the value is RIGHT, never where the value CAME FROM.',
      }),
    }).toStrictEqual({
      whatItIs: true,
      neverAUnitRow: true,
      trapsSectionRepeatsIt: true,
      greenTestProvesTheValue: true,
    });
  });

  // AN EDGE LINE CARRIES TWO IDS AND ONLY ONE OF THEM IS THE UNIT. Naming the target node instead
  // puts the mark on nothing, and nothing downstream reports it.
  it("VALID: served template => takes the edge's own id off an edge line, never the target node's", () => {
    expect({
      twoIds: hasIn({
        needle:
          "**AN EDGE LINE CARRIES TWO IDS AND THEY NAME DIFFERENT THINGS.** The `<edge:…>` at the head of the line is the EDGE's own id, and it is the unit. The `[#…]` further along is the node the edge points AT. Put the node's id on a piece and the mark lands on nothing.",
      }),
      ownershipFollowsTheNode: hasIn({
        needle:
          '**A terminal or a labelled edge is YOURS only where the node it hangs off carries `◀ YOURS`** — for a branch, the node the edge LEAVES.',
      }),
      noLineNumbers: hasIn({
        needle:
          '**Never a line number, in any field.** Every batch that lands edits files, so a number recorded now is wrong by the batch that reads it.',
      }),
    }).toStrictEqual({ twoIds: true, ownershipFollowsTheNode: true, noLineNumbers: true });
  });

  // THE SECOND `## Contracts` HEADING IS SHOWN TO NO SIBLING SESSION. A planner that skips it ships a
  // hole nobody is behind, which is why the page says so rather than listing the two groups flatly.
  it('VALID: served template => plans both Contracts headings, and routes each line by its own path', () => {
    expect({
      everyContractIsWork: hasIn({
        needle: '**EVERY CONTRACT UNDER A `## Contracts` HEADING CARRIES WORK OF YOURS.**',
      }),
      routesByFilePath: hasIn({
        needle:
          "**Build what each line's OWN path names:** a property printing `[<path>]` lives at that path, not in the contract's `source`.",
      }),
      shownToNoSibling: hasIn({
        needle:
          '**No sibling session is ever shown these.** There is no cell for a (package, flow) pairing the package does not tag, so a contract you skip here reaches nobody and ships missing. Plan the file; do NOT plan the flow it names.',
      }),
      contractsOnlyCell: hasIn({
        needle:
          "**A contracts-only cell calls `get-quest({ questId: 'QUEST_ID', packageName: '<your package>' })`**",
      }),
      neverStageSpec: hasIn({
        needle:
          "**Never `stage: 'spec'`.** That renders the whole quest, every flow on it, and the render grows as the quest does — past the tool-result ceiling on any quest of real size.",
      }),
    }).toStrictEqual({
      everyContractIsWork: true,
      routesByFilePath: true,
      shownToNoSibling: true,
      contractsOnlyCell: true,
      neverStageSpec: true,
    });
  });

  // THE READ-BACK EXISTS FOR THE ABSENCE. A unit no piece claims is invisible in the JSON a planner
  // just wrote, and the coverage table is the one surface that renders it as a row.
  it('VALID: served template => reads the plan back by operationItemId and walks the coverage rows', () => {
    expect({
      theCall: hasIn({
        needle:
          "get-quest-work({ questId: 'QUEST_ID', operationItemId: '<scope.operationItemId>' })",
      }),
      whatItCatches: hasIn({
        needle:
          '**A unit no piece claims is the defect this read exists to catch** — in JSON an absence is invisible by construction, and the table is where it becomes a row.',
      }),
      unclaimedRow: hasIn({ needle: '| `— NO PIECE CLAIMS THIS UNIT —` |' }),
      rowsNotTheNumber: hasIn({
        needle:
          'The count line above the table counts read-checks too, so it is the ROWS you read, never the number.',
      }),
      amendment: hasIn({
        needle:
          "payload: { kind: 'amendment', reason: '<what the read-back showed>', plan: { … the whole plan again … } }",
      }),
    }).toStrictEqual({
      theCall: true,
      whatItCatches: true,
      unclaimedRow: true,
      rowsNotTheNumber: true,
      amendment: true,
    });
  });

  // THE OUTCOME IS DECLARED THROUGH `quest-work`; `signal-back` only ends the turn. `empty` is the
  // word that closes the scope, so the page pins what it means rather than leaving it to a session
  // that cut nothing.
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
          '| `empty` | nothing was in scope to cut — every unit is settled and every contract your package owns exists | the scope closes |',
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
    }).toStrictEqual({
      outcomeCall: true,
      doneRow: true,
      emptyRow: true,
      wallRow: true,
      emptyMeaning: true,
      signal: true,
    });
  });

  // A PIECE'S HUMAN NAME IS DISTINCT FROM ITS `id`. The router carries `pieceName` onto the minted
  // work item's payload, and the execution panel reads it to label a step's rows — a piece skeleton
  // missing the field is a plan every downstream reader can only label by its bare id.
  it('VALID: served template => requires pieceName on a piece, distinct from id', () => {
    expect({
      fieldInSkeleton: hasIn({
        needle: "pieceName: '<a short human name — what a reader calls this piece",
      }),
      requiredAndDistinctFromId: hasIn({
        needle:
          '**`pieceName` is required, and it is not `id`.** `id` is your own cross-reference mnemonic;',
      }),
    }).toStrictEqual({ fieldInSkeleton: true, requiredAndDistinctFromId: true });
  });

  it('VALID: served template => names the six payload blocks a piece carries, in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### `.+`$/gmu), (match) => match[0])).toStrictEqual([
      '### `files`',
      '### `facts`',
      '### `fences`',
      '### `traps`',
      '### `doNotTouch`',
      '### `units`',
    ]);
  });

  // A UNIT ROW'S `text` IS THE QUEST'S OWN SENTENCE, and `failsIf` is what makes `assert` checkable.
  // A paraphrase passes while proving something else; an assertion nothing can turn red passes while
  // reading nothing.
  it('VALID: served template => pins a unit row to verbatim text, an assert and a failsIf', () => {
    expect({
      rowShape: hasIn({
        needle:
          "{ unitId: '<the id, copied exactly>',\n  kind: 'observable' | 'terminal' | 'branch',",
      }),
      verbatim: hasIn({
        needle:
          '**`text` is quoted, never paraphrased.** A worker that builds against your paraphrase and reports against the same paraphrase passes while proving something else.',
      }),
      failsIf: hasIn({
        needle:
          '**`failsIf` is what makes `assert` checkable.** An assertion nothing can turn red is the defect this field exists to catch',
      }),
      oneRowPerAssignedUnit: hasIn({
        needle:
          "One row per entry in this piece's `assignedUnitIds`, and the two lists are checked against each other — a row missing or a row extra is the plan refused.",
      }),
    }).toStrictEqual({
      rowShape: true,
      verbatim: true,
      failsIf: true,
      oneRowPerAssignedUnit: true,
    });
  });

  // THE PLANNER DOES NOT WRITE THE CODE, and a piece carrying pseudo-code is how that line is
  // crossed. Three fields pin the behaviour instead, so several correct shapes are fine.
  it('VALID: served template => forbids pseudo-code and names the three fields that replace it', () => {
    expect({
      noSketch: hasIn({
        needle:
          "**You do not write the code, not even as a sketch.** A piece carrying a file's body in pseudo-code makes the worker a typist and you the author.",
      }),
      theThreeFields: hasIn({
        needle:
          "each file's `in` and `out`, the `units` with their `assert` and `failsIf`, and `facts`.",
      }),
      severalShapes: hasIn({ needle: '**Several correct shapes are fine.**' }),
      bothSides: hasIn({ needle: '**Both sides, every file.** One side is not a shape' }),
      provesIsTestOnly: hasIn({
        needle:
          "**`proves` is a TEST file's field alone.** A product file proves nothing by itself, so it carries no `proves` key at all",
      }),
      filesNotExhaustive: hasIn({
        needle: '**This list is not exhaustive and does not have to be.**',
      }),
    }).toStrictEqual({
      noSketch: true,
      theThreeFields: true,
      severalShapes: true,
      bothSides: true,
      provesIsTestOnly: true,
      filesNotExhaustive: true,
    });
  });

  // A TRAP NAMES A RULE THIS SESSION READ, never one it remembers. The measured failure is a piece
  // that banned something nothing bans, leaving the worker unable to tell which side was right.
  it('VALID: served template => grounds a trap in a rule read this session', () => {
    expect({
      whereYouReadIt: hasIn({
        needle:
          '**Name where you read the rule this session, so it can check you** — never a rule you remember.',
      }),
      theMeasuredCase: hasIn({
        needle:
          'One measured piece banned `.toBeInTheDocument`, which nothing in this repo bans and its own widget tests use throughout, and the session had no way to tell which of the two was right.',
      }),
      whatAFactMayNotRestate: hasIn({
        needle:
          'It arrives having read `get-architecture`, `get-testing-patterns`, `get-folder-detail` for its folder types and every session snippet',
      }),
      fencesAreYours: hasIn({
        needle: '**A fence is a boundary only you can draw, because you cut the pieces.**',
      }),
    }).toStrictEqual({
      whereYouReadIt: true,
      theMeasuredCase: true,
      whatAFactMayNotRestate: true,
      fencesAreYours: true,
    });
  });

  // THE MOVE TABLE HAS ONE RIGHT ROW, and the escape hatch below it is bounded: a repo with no
  // library package gets an import or a commented copy, never a new dependency on an ordinary
  // sibling.
  it('VALID: served template => moves shared code to a library package rather than copying it', () => {
    expect({
      theRightRow: hasIn({
        needle:
          '| move it into a package both can call, then point both sides at the new home | yes |',
      }),
      byKindNotByName: hasIn({
        needle:
          '**`get-project-map` names the candidates.** Every repo calls that package something different — `shared`, `shared-core`, `shared-ui` — so look for the KIND rather than the name: a package the map labels `[library]` is one every other package may depend on.',
      }),
      neverANewSiblingDependency: hasIn({
        needle: '**Never ADD a dependency on an ordinary sibling.**',
      }),
      theCommentOnACopy: hasIn({
        needle:
          'a `payload.traps` line telling the worker to head the copy with one comment naming the sibling file it came from and why',
      }),
      addAFileRatherThanEditOne: hasIn({
        needle:
          '**Add a file rather than editing one, wherever the choice exists.** Sibling cells run at the same time as yours, and two sessions editing one file in a shared package overwrite each other.',
      }),
    }).toStrictEqual({
      theRightRow: true,
      byKindNotByName: true,
      neverANewSiblingDependency: true,
      theCommentOnACopy: true,
      addAFileRatherThanEditOne: true,
    });
  });

  // `get-project-map` BEFORE `discover`, ALWAYS. A glob that guessed wrong returns nothing, which
  // reads exactly like a package with nothing in it — and that is how a planner cuts a piece to
  // rebuild something that already exists.
  it('VALID: served template => orders the exploration tools and delegates a search but never a read', () => {
    expect({
      oneMapCall: hasIn({
        needle:
          '**ONE `get-project-map` call, before your first `discover`, naming EVERY package you already know you will look at**',
      }),
      discoverAfter: hasIn({
        needle: '**`discover` comes AFTER those, never instead of them.**',
      }),
      wrongGlobReadsEmpty: hasIn({
        needle:
          'a glob that guessed wrong returns nothing, which reads exactly like a package that has nothing there.',
      }),
      searchNotRead: hasIn({ needle: '**Delegate a SEARCH, never a READ.**' }),
      standardsFirst: hasIn({
        needle:
          'both come before you read any code — they override training defaults that are wrong for this codebase',
      }),
    }).toStrictEqual({
      oneMapCall: true,
      discoverAfter: true,
      wrongGlobReadsEmpty: true,
      searchNotRead: true,
      standardsFirst: true,
    });
  });

  // TWO SHARED BLOCKS, EACH ONCE. The marking rules are written for the sessions that hold units; a
  // planner is assigned none, and `plannerMarks` is the whole of its authority. The spill rule binds
  // every session that fetches quest data, and a second copy of it is text served twice.
  it('VALID: served template => takes the spill rule and the sad-path block whole, each exactly once', () => {
    expect({
      spilled: TEMPLATE.split(spilledToolResultStatics.markdown).length - 1,
      spilledSitsWithTheFetch:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest({ questId: 'QUEST_ID'"),
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
      spilledSitsWithTheFetch: true,
      sadPath: 1,
      marking: false,
      plannerMarksAuthority: true,
      cantMeetNeedsAToSettle: true,
    });
  });

  // THIS SESSION DISPATCHES NOBODY. The router mints one session per piece, so a planner reaching for
  // the Agent tool to start a worker is running a batch the router cannot see or route.
  it('VALID: served template => dispatches no worker and writes no file', () => {
    expect({
      routerDispatches: hasIn({
        needle:
          '**You dispatch no worker.** You cut the pieces; the router mints one session per piece, in the batch order you wrote.',
      }),
      noFile: hasIn({
        needle: '**You write no file at all.** Your plan is a tool call, not a document on disk.',
      }),
      noLedgerEdit: hasIn({
        needle:
          '**You never edit the operations ledger.** You declare an outcome at the end and the router applies it.',
      }),
      questPlansMap: TEMPLATE.includes('.quest-plans'),
      subagentType: TEMPLATE.includes('subagent_type'),
    }).toStrictEqual({
      routerDispatches: true,
      noFile: true,
      noLedgerEdit: true,
      questPlansMap: false,
      subagentType: false,
    });
  });
});
