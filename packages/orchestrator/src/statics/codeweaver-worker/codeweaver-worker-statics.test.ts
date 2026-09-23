import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';
import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { codeweaverWorkerStatics } from './codeweaver-worker-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = codeweaverWorkerStatics.prompt.template;

describe('codeweaverWorkerStatics', () => {
  // OVER `maxVerbatimChars` THE MCP LAYER SPILLS THE RESULT TO A FILE and hands the agent an error
  // stub — the session then holds a path instead of its instructions, and nothing reports a failure.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SERVER SUBSTITUTES THE OPERATION CONTEXT AT `$ARGUMENTS`, and `agentNameToPromptTransformer`
  // reds every served prompt carrying a count other than exactly one. A second slot would split that
  // context in two; one that is not last buries it under instructions already read.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, at the end, under its own heading', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
    }).toStrictEqual({ count: 1, atTheEnd: true, underItsOwnHeading: true });
  });

  // THE HEADING LIST IS THE SHAPE OF THE ROLE. Pinning the LINES rather than the count is what
  // catches a section silently deleted or renamed. Three of these eleven arrive already headed, from
  // the interpolated shared blocks rather than from this file's own prose.
  it('VALID: served template => names its eleven top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Marking your units',
      '## `verifyByHuman`',
      '## What your evidence carries',
      '## Your tools',
      '## Your piece is a best guess',
      '## The script',
      '## The sad paths, and where each lands',
      '## Operation Context',
    ]);
  });

  // THE SCRIPT IS THE WHOLE OF WHAT THIS SESSION DOES. Exact wording, not just a count, so a step
  // silently renamed or reordered reds here rather than passing unnoticed.
  it('VALID: served template => names its eight script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your piece',
      '### 2. Load the standards',
      '### 3. Read what you were handed',
      '### 4. Write the implementation, then the red spec',
      '### 5. Run red, then correct to green',
      '### 6. Create what your piece could not name',
      "### 7. Ward your own piece's paths",
      '### 8. Signal',
    ]);
  });

  // A SHARED BLOCK IS A CONTRACT: INTERPOLATED, NEVER RESTATED. Counted rather than tested for
  // presence, matching the pattern the blocks' own colocated tests use — twice would mean the block
  // landed in two sections and cost this prompt's budget twice over for one rule.
  it('VALID: served template => interpolates the marking, automatability and sad-path blocks exactly once each', () => {
    expect({
      marking: TEMPLATE.split(unitMarkingStatics.markdown).length - 1,
      automatability: TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1,
      sadPaths: TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1,
    }).toStrictEqual({ marking: 1, automatability: 1, sadPaths: 1 });
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE WORKER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN script where the
  // flag applies — right beside the mark it exists to replace, at the point this session actually
  // marks a unit.
  it('VALID: served template => tells the worker to flag verifyByHuman on an observable instead of cant-meet, naming the merge scope, when nothing at any layer could ever settle a unit', () => {
    expect(
      hasIn({
        needle:
          "**Where a unit resists everything your reading and your tests can try, and nothing at any layer — not\na later piece, not a later pass, nothing but a person's own judgment once the quest is done — could\never settle it either: on an OBSERVABLE, set `verifyByHuman: true` on it through `modify-quest`\ninstead of marking `cant-meet`, naming its flow, node and observable id — the merge only touches\nfields you send, so nothing else on the observable needs restating.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A TERMINAL OR BRANCH UNIT CARRIES NO verifyByHuman FIELD. `flowObservableContract` is the only
  // contract with the flag (see `observableAutomatabilityStatics`), and codeweaver's own review step
  // is measured over terminal and branch units too (`stepScopeStatics.byFamilyStep.codeweaver.review
  // .unitKinds`) — so a session that hit the wall on one of those needs the honest mark spelled out,
  // not a blanket "flag it" that names no field to flag.
  it('VALID: served template => tells the worker a terminal or branch unit takes cant-meet with a toSettle instead, since it carries no verifyByHuman field', () => {
    expect(
      hasIn({
        needle:
          "On a terminal or branch unit,\nwhich carries no such field, `cant-meet` is the honest mark instead, with a `toSettle` naming the\nperson's check.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE FALSE MERGE CLAIM IS GONE. modify-quest's deep upsert merges by id and touches only the
  // fields a call sends (`modifyQuestInputContract`, `questItemDeepMergeTransformer`) — it never
  // required "carrying forward" an observable's other fields, and a session told to restate them
  // risks overwriting a sibling's concurrent edit with a stale copy.
  it('VALID: served template => never claims the modify-quest merge requires carrying forward what an observable already declares', () => {
    expect({ carriesForwardClaimGone: TEMPLATE.includes('carrying forward what') }).toStrictEqual({
      carriesForwardClaimGone: false,
    });
  });

  // THIS PROMPT MUST NOT RE-AUTHOR WHAT THE SHARED BLOCKS ALREADY SAY. A local paragraph restating
  // the three marks or the five sad paths would drift from the shared copy the day either one edits.
  it('VALID: served template => never restates the three marks or the sad-path table outside the interpolated blocks', () => {
    const withoutSharedBlocks = TEMPLATE.replace(unitMarkingStatics.markdown, '').replace(
      sadPathRoutingStatics.markdown,
      '',
    );

    expect({
      cantMeetRow: hasIn({
        needle: '`cant-meet` | nobody in this role could settle it at this layer',
        text: withoutSharedBlocks,
      }),
      sadPathTableHeader: hasIn({
        needle: '| Situation | What you do | Where it lands |',
        text: withoutSharedBlocks,
      }),
    }).toStrictEqual({ cantMeetRow: false, sadPathTableHeader: false });
  });

  // THE ONE STARTUP CALL. Every non-planner step in this set begins here — pinned as the exact call
  // shape, because a session copies it. The second `get-quest-work` call in this template is the
  // OPERATION-ITEM form under "Your piece is a best guess", a different shape for a different
  // question (reading the whole plan to amend it) — asserted by name in its own test below, so this
  // one counts the WORK-ITEM form specifically rather than the bare call token.
  it('VALID: served template => step 1 is exactly one get-quest-work call, taking only questId and workItemId', () => {
    const fenced = "get-quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID' })";

    expect({
      theCall: hasIn({ needle: fenced, text: TEMPLATE }),
      callCount: TEMPLATE.split(fenced).length - 1,
      stepHeading: hasIn({ needle: '### 1. Fetch your piece', text: TEMPLATE }),
    }).toStrictEqual({ theCall: true, callCount: 1, stepHeading: true });
  });

  // NO DISPATCH, EITHER DIRECTION. The old operator/sub-agent split collapses into one session here,
  // and that has to be stated by name — not left to be inferred from an absent Agent() example.
  it('VALID: served template => states nobody dispatches for this session and it dispatches nobody', () => {
    expect({
      noOperatorAbove: hasIn({
        needle:
          '**Nobody dispatches for you, and you dispatch nobody.** There is no operator above you deciding what to\nbrief and no sub-agent below you doing the typing',
        text: TEMPLATE,
      }),
      agentToolRefused: hasIn({
        needle: 'Agent(...)                                      nothing runs below you',
        text: TEMPLATE,
      }),
      nothingRunsBelowInDiscovery: hasIn({
        needle: '**Nothing runs below you.** Whatever discovery you need, you do it yourself',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      noOperatorAbove: true,
      agentToolRefused: true,
      nothingRunsBelowInDiscovery: true,
    });
  });

  // THE COMMIT GATE IS GONE. Nobody on this pass commits, so a dirty tree at signal time is the
  // correct state, not a fault — the opposite of the deleted clean-tree gate this page must never
  // reintroduce.
  it('VALID: served template => a dirty tree is fine at signal, and no CLEAN TREE gate survives', () => {
    expect({
      dirtyTreeIsFine: hasIn({
        needle:
          '**A dirty tree does not hold this up.** Nobody on this\npass commits, so `signal-back` succeeds with every file you touched still uncommitted',
        text: TEMPLATE,
      }),
      neverCommits: hasIn({ needle: '**You never commit and you never push.**', text: TEMPLATE }),
      cleanTreeGateGone: TEMPLATE.includes('Your worktree must be clean before you signal'),
      refusesEveryOutcomeGone: TEMPLATE.includes('refuses every outcome while the tree is dirty'),
    }).toStrictEqual({
      dirtyTreeIsFine: true,
      neverCommits: true,
      cleanTreeGateGone: false,
      refusesEveryOutcomeGone: false,
    });
  });

  // NO GIT, AT ALL. `get-quest-work` serves every git fact a dispatched session used to run `git
  // status`/`git log`/`git diff` for — a session that still reaches for one of those is running a
  // command nothing here grants it.
  it('VALID: served template => runs no git command and reads git facts off the served view instead', () => {
    expect({
      noGitTag: hasIn({
        needle: '**[NO GIT] You run no git command, not even `git status`.**',
        text: TEMPLATE,
      }),
      namesTheServedRows: hasIn({
        needle:
          '`uncommittedPaths` is what nobody has committed yet, `committedPaths` is what\nearlier pieces already landed',
        text: TEMPLATE,
      }),
      notYoursRow: hasIn({
        needle: 'any git command, git status included            see [NO GIT]',
        text: TEMPLATE,
      }),
      noGitDiffCommand: TEMPLATE.includes('git diff'),
      noGitLogCommand: TEMPLATE.includes('git log'),
      noGitStatusCommand: TEMPLATE.includes('git status\n'),
    }).toStrictEqual({
      noGitTag: true,
      namesTheServedRows: true,
      notYoursRow: true,
      noGitDiffCommand: false,
      noGitLogCommand: false,
      noGitStatusCommand: false,
    });
  });

  // SCOPE IS THE WHOLE RULE. Ward picks its check types off the paths it is handed, and the widened
  // forms grade someone else's work — the family's own deterministic ward step is the regression pass,
  // not a tool this session reaches for.
  it('VALID: served template => scopes its own ward run to its own piece and forbids every wider form by name', () => {
    expect({
      scopedRun: hasIn({
        needle: "npm run ward -- -- <your own piece's paths>",
        text: TEMPLATE,
      }),
      neverUncommitted: hasIn({
        needle: 'NEVER `--uncommitted`. NEVER a bare ward.',
        text: TEMPLATE,
      }),
      neverBareInTools: hasIn({
        needle:
          'npm run ward -- --uncommitted                   grades the whole tree, not your piece',
        text: TEMPLATE,
      }),
      regressionPassIsTheWardStep: hasIn({
        needle:
          "Grading\nthe whole branch is not your job: the family's own deterministic `ward` step is the regression pass",
        text: TEMPLATE,
      }),
      discoveryMismatch: hasIn({
        needle: 'DISCOVERY MISMATCH on a check type = ward answering, not failing.',
        text: TEMPLATE,
      }),
      noRunWardMcpTool: TEMPLATE.includes('run-ward'),
      noRunRiftcarverMcpTool: TEMPLATE.includes('run-riftcarver'),
    }).toStrictEqual({
      scopedRun: true,
      neverUncommitted: true,
      neverBareInTools: true,
      regressionPassIsTheWardStep: true,
      discoveryMismatch: true,
      noRunWardMcpTool: false,
      noRunRiftcarverMcpTool: false,
    });
  });

  // A RED IS PRODUCED BY EDITING THE SPEC'S OWN ASSERTION, never by touching the implementation or
  // shuffling files — every evasion this codebase has actually seen is banned by name.
  it('VALID: served template => produces a red only from the spec own FAILS IF value, and bans every other route by name', () => {
    expect({
      implementationFirst: hasIn({
        needle:
          'The implementation first, then the spec written AGAINST it, with every unit assertion set to its\n`failsIf` value',
        text: TEMPLATE,
      }),
      receivedValueIsTheProof: hasIn({
        needle:
          "each failure must report this unit's `assert` value\nas what it RECEIVED. Expected the wrong value, received the right one",
        text: TEMPLATE,
      }),
      compileErrorIsNotARed: hasIn({
        needle:
          'A suite that never RAN has produced no red. `Cannot find module`, `Test suite failed to run` and every\n`error TS` are compile failures with no assertion behind them',
        text: TEMPLATE,
      }),
      everyEvasionBannedByName: hasIn({
        needle:
          'Banned, by name: moving, copying or\nrenaming any file; `git stash`; rewriting a file from `git show`; a `.bak` file; editing an\nimplementation file to break it.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      implementationFirst: true,
      receivedValueIsTheProof: true,
      compileErrorIsNotARed: true,
      everyEvasionBannedByName: true,
    });
  });

  // WHERE ASSERT AND FAILSIF ACTUALLY LIVE. They are not on `assignedUnits` — the served view holds
  // no such fields — so a session reading the wrong array finds nothing there.
  it('VALID: served template => sources ASSERT and FAILS IF from piece.payload.units[], not from assignedUnits', () => {
    expect(
      hasIn({
        needle:
          "Your piece's `payload.units[]` — not `assignedUnits` — carries each unit's `assert` (what the test\nreads, and off which surface) and `failsIf` (the wrong value that turns that assertion red)",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A `met` MARK CARRIES A WITNESSED PAIR, not a description of one — the file:line, the assertion,
  // the FAILS IF value, and the RECEIVED value the run actually reported.
  it('VALID: served template => a met mark carries the witnessed file:line, assertion, FAILS IF and RECEIVED pair', () => {
    expect({
      witnessedPair: hasIn({
        needle:
          "A `met` mark's evidence is the witnessed pair:\nthe test `file:line`, the assertion quoted, the `failsIf` value you set it to, and the value the run\nreported as RECEIVED — which is this unit's `assert` value.",
        text: TEMPLATE,
      }),
      transcribeNotDescribe: hasIn({
        needle: 'you watched\nthe run, so transcribe it rather than describe it.',
        text: TEMPLATE,
      }),
      readCheckEvidence: hasIn({
        needle:
          'settled by opening a source file,\nnever by a test — its evidence is the `file:line` where the statement holds, not a `failsIf`/RECEIVED\npair.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ witnessedPair: true, transcribeNotDescribe: true, readCheckEvidence: true });
  });

  // TRAPS ARE READ AND BINDING, NOT MERELY LISTED. This is the RULES half of the old brief template's
  // `TRAPS` block, carried here: a trap names a mistake this piece invites that the session's own
  // standard reading (get-architecture, get-testing-patterns, get-folder-detail, the session
  // snippets) does not already state. The trap CONTENT itself is authored per piece by the planner
  // and lives on `piece.payload.traps` — nothing for this static prompt to carry.
  it('VALID: served template => reads every trap before writing and treats each as binding', () => {
    expect(
      hasIn({
        needle:
          'Read every `trap` too, before you write. Each one names a mistake this piece is known to invite —\nsomething your own reading of `get-architecture`, `get-testing-patterns`, `get-folder-detail` and the\nsession snippets does not already say. Treat every one as binding, not advisory.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // TWO DO NOT TOUCH SETS. `doNotTouch` is fixed at plan time; `uncommittedPaths` is what a batch-mate
  // has open RIGHT NOW, which the planner could not have known when it cut this piece.
  it('VALID: served template => binds two DO NOT TOUCH sets, the planned one and the live one', () => {
    expect(
      hasIn({
        needle:
          '**Two DO NOT TOUCH sets, and both bind, whatever else is true.** `piece.doNotTouch` names what belongs\nto another piece or another mechanism entirely — fixed at plan time. `uncommittedPaths` is the LIVE\none: every path a batch-mate has open right now, which the planner could not know about when it cut\nyour piece.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE PIECE IS A GUESS; THE CODE IS THE FACT. Both halves of the rule are pinned — evidence wins,
  // and a deviation is reported as a mark or an amendment, never slipped past as a note on a pass.
  it('VALID: served template => treats the piece as a best guess and routes every deviation to a mark or an amendment', () => {
    expect({
      hardEvidenceWins: hasIn({
        needle: 'where you find HARD EVIDENCE against a direction, the\nevidence wins — follow it.',
        text: TEMPLATE,
      }),
      neverANoteOnAPass: hasIn({
        needle:
          '**Every deviation comes back as a mark or an amendment, never as a note on a pass.**',
        text: TEMPLATE,
      }),
      refusalNamedNotWorkedAround: hasIn({
        needle:
          'is\nneither a wall nor something to work around silently. Name the rule and what it refused.',
        text: TEMPLATE,
      }),
      amendmentFetch: hasIn({
        needle: "get-quest-work({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      hardEvidenceWins: true,
      neverANoteOnAPass: true,
      refusalNamedNotWorkedAround: true,
      amendmentFetch: true,
    });
  });

  // THREE SIGNAL SHAPES, NAMED. A normal pass derives its outcome from the marks alone; a
  // contracts-only piece with zero assigned units has to declare `done` directly; a wall declares
  // itself the same way and carries a `blockedReason` into `signal-back`.
  it('VALID: served template => signals with three named outcome shapes and no operationStatus field anywhere', () => {
    expect({
      derivedIsTheNormalCase: hasIn({
        needle:
          'Your outcome is normally DERIVED from your marks — once every assigned unit carries `met` or\n`cant-meet`, you owe nothing further before you signal.',
        text: TEMPLATE,
      }),
      zeroUnitOutcome: hasIn({
        needle:
          "quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', payload: { kind: 'outcome', word: 'done', reason: '<what you built>' } })",
        text: TEMPLATE,
      }),
      wallOutcome: hasIn({
        needle:
          "quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', payload: { kind: 'outcome', word: 'wall', reason: '<the wall, and what a person must change>' } })",
        text: TEMPLATE,
      }),
      signalBackDone: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID' })",
        text: TEMPLATE,
      }),
      signalBackBlocked: hasIn({
        needle: "operationItemId: 'OPERATION_ITEM_ID', blockedReason: '<the same wall>' })",
        text: TEMPLATE,
      }),
      noOperationStatus: TEMPLATE.includes('operationStatus'),
    }).toStrictEqual({
      derivedIsTheNormalCase: true,
      zeroUnitOutcome: true,
      wallOutcome: true,
      signalBackDone: true,
      signalBackBlocked: true,
      noOperationStatus: false,
    });
  });

  // A REFUSED SIGNAL NAMES THE CAUSE, and after the commit gate's removal the cause is almost always
  // the unmarked-unit gate rather than a dirty tree.
  it('VALID: served template => tells the session a refused signal is almost always an unmarked unit', () => {
    expect(
      hasIn({
        needle:
          '**A refused `signal-back` arrives as an error on\nthe call itself.** It names what is wrong — almost always a unit still unmarked.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS ROLE WRITES CODE DIRECTLY, AND CARRIES NO STALE COPY-PASTE ARTIFACT. Marks travel through
  // `quest-work`'s flat `observations` array, which the marking block already interpolates —
  // `modify-quest` is scoped to `verifyByHuman` alone (see "Your tools" and the role-specific
  // sentence above), never the old nested flows/nodes/edges sign-off shape this role no longer uses.
  // `MIRROR` is `codeweaver-prompt`'s own DISCOVERY block naming a slot codeweaver's payload never
  // had; carrying it forward here would point at a field this piece's payload does not carry either.
  it('VALID: served template => scopes every modify-quest call to verifyByHuman, and carries no MIRROR reference', () => {
    expect({
      modifyQuestCount: TEMPLATE.split('modify-quest').length - 1,
      toolRow: hasIn({
        needle:
          'modify-quest                                    verifyByHuman only, on a unit nothing could ever settle',
        text: TEMPLATE,
      }),
      notYoursRow: hasIn({ needle: 'modify-quest on any field but verifyByHuman', text: TEMPLATE }),
      noNestedSignoffShape: TEMPLATE.includes('modify-quest({ questId:'),
      mirror: TEMPLATE.includes('MIRROR'),
    }).toStrictEqual({
      modifyQuestCount: 3,
      toolRow: true,
      notYoursRow: true,
      noNestedSignoffShape: false,
      mirror: false,
    });
  });
});
