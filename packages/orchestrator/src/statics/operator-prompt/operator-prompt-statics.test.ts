import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { plannerMinionStatics } from '../planner-minion/planner-minion-statics';
import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { slotManagerStatics } from '../slot-manager/slot-manager-statics';
import { workerMinionStatics } from '../worker-minion/worker-minion-statics';
import { operatorPromptStatics } from './operator-prompt-statics';

const { template } = operatorPromptStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

// ================================================================================================
// CROSS-FILE DERIVATIONS. The three minion templates this session dispatches. Every needle built
// out of them below is DERIVED from their live values, never copied: a copied string drifts exactly
// the way the prose drifts, and the test goes quiet at the moment it should have failed.
// ================================================================================================
const PLANNER = plannerMinionStatics.prompt.template;
const WORKER = workerMinionStatics.prompt.template;
const REVIEWER = reviewerMinionStatics.prompt.template;

// The header this template mandates at the top of EVERY minion brief.
const HEADER_FENCE_OPENS = template.indexOf(
  '```',
  template.indexOf('**Open every brief with this header.**'),
);
const BRIEF_HEADER = template.slice(
  HEADER_FENCE_OPENS + 3,
  template.indexOf('```', HEADER_FENCE_OPENS + 3),
);
const HEADER_FIELDS = Array.from(BRIEF_HEADER.matchAll(/(?:^|· )([A-Za-z][A-Za-z ]*):/gmu)).map(
  (match) => match[1] ?? '',
);

// The two routing tables: the per-return one under the script, and step 9's.
const NEXT_TABLE = template.slice(
  template.indexOf('| The line says | You do |'),
  template.indexOf('**`continue` and `rework` do the same thing'),
);
const ROUTED_VALUES = Array.from(NEXT_TABLE.matchAll(/^\| `([a-z]+)` \|/gmu)).map(
  (match) => match[1] ?? '',
);
const STEP_NINE_TABLE = template.slice(
  template.indexOf("| Your REVIEWER's line | Signal |"),
  template.indexOf('A `wall` never reaches this table.'),
);
const STEP_NINE_VALUES = Array.from(
  new Set(Array.from(STEP_NINE_TABLE.matchAll(/^\| `([a-z]+)`/gmu)).map((match) => match[1] ?? '')),
);

// What each minion declares it may write after `NEXT:` — one per line in the planner, the whole
// menu on ONE line in the worker and the reviewer.
const [PLANNER_NEXT = [], WORKER_NEXT = [], REVIEWER_NEXT = []] = [PLANNER, WORKER, REVIEWER].map(
  (source) =>
    source
      .split('\n')
      .filter((line) => line.startsWith('NEXT:'))
      .flatMap((line) => line.slice('NEXT:'.length).split('|'))
      .map((arm) => arm.trim().split(' ')[0] ?? '')
      .filter((word) => word !== ''),
);

// `QUEST_ID`-shaped tokens: an id a minion can only have got from the brief header above.
const [PLANNER_IDS = [], WORKER_IDS = [], REVIEWER_IDS = []] = [PLANNER, WORKER, REVIEWER].map(
  (source) =>
    Array.from(
      new Set(Array.from(source.matchAll(/\b[A-Z]+(?:_[A-Z]+)+\b/gu)).map((match) => match[0])),
    ),
);

// The plan file: the PLANNER writes and commits it, this template reads it. Both the path and the
// chunk field names come off the planner's own fence.
const PLAN_FENCE_OPENS = PLANNER.indexOf('```', PLANNER.indexOf('## The plan file'));
const PLAN_FENCE = PLANNER.slice(
  PLAN_FENCE_OPENS + 3,
  PLANNER.indexOf('```', PLAN_FENCE_OPENS + 3),
);
const PLAN_CHUNK_FIELDS = Array.from(
  PLAN_FENCE.slice(PLAN_FENCE.indexOf('## chunk 1')).matchAll(/^([A-Z]+):/gmu),
).map((match) => match[1] ?? '');
const PLAN_PATH =
  /^## The plan file — `([^`]+)`$/mu.exec(PLANNER)?.[1] ?? 'NO PLAN PATH IN THE PLANNER';
// The chunk fields as step 5 has to enumerate them: `A`, `B` … and `Z`.
const PLAN_CHUNK_ENUMERATION = `\`${PLAN_CHUNK_FIELDS.slice(0, -1).join('`, `')}\` and \`${
  PLAN_CHUNK_FIELDS[PLAN_CHUNK_FIELDS.length - 1] ?? ''
}\``;
const REVIEWER_FIRST_ID = REVIEWER_IDS[0] ?? 'THE REVIEWER NAMES NO ID';

// The half this file owns: the template minus the shared operating-rules block it composes. That
// block runs unbroken from the heading to the operator's tree-clean close.
const RULES_BLOCK_START = template.indexOf(agentOperatingRulesStatics.heading);
const RULES_BLOCK_END =
  template.indexOf(agentOperatingRulesStatics.treeCleanOperator) +
  agentOperatingRulesStatics.treeCleanOperator.length;
const authored = template.slice(0, RULES_BLOCK_START) + template.slice(RULES_BLOCK_END);

// The FORBIDDEN fence is the one place a tool name may appear. Outside it, naming a tool reads as
// permission to use that tool.
const TOOL_TABLE = template.slice(
  template.indexOf('ALLOWED — this is the whole list'),
  template.indexOf('```', template.indexOf('FORBIDDEN — no exceptions')),
);

// This number is a FORCING FUNCTION, not the protocol ceiling. The ceiling is
// `mcpToolResultStatics.maxVerbatimChars`. A separate test below pins that one. This number says
// two things. Everything discipline-specific belongs in a pack rather than here. Everything that
// needs the reader to WEIGH evidence belongs in the prompt of the minion that holds the evidence.
//
// It came DOWN from 18,500 when the script replaced the nine-gate loop. Five things left:
//
// 1. The expected-versus-unexpected red protocol, an inference from three indirect sources.
// 2. The `--only` narrowing rule, a folder-type map the operator's own tool table denies it.
// 3. The `UNFIXABLE` routing paragraph, a classification only the minion that hit the wall can
//    make.
// 4. The pivot rule.
// 5. The merge of three control channels at the last gate.
//
// The old test called each of those script mechanics. This test calls each of them a JUDGEMENT.
// The second test is the one that matters: an operator that has to weigh evidence it cannot see
// will guess.
//
// Do not RAISE this number by asking "is there room under 50k". There always is. Ask these two
// questions instead:
//
// 1. Is what you are adding identical for all five disciplines?
// 2. Can the operator ACT on it by looking it up?
//
// Two noes mean it belongs in a pack or in a minion.
//
// It came DOWN once, from 18,500, when the script replaced the nine-gate loop, and DOWN again from
// 13,500 to 13,350 when the template was rewritten into plain speech.
//
// It went UP to 15,500 when the round became PARALLEL. Three things grew, and each answers both
// questions above rather than only the second:
//
// 1. Step 5 dispatches WAVE BY WAVE. The wave is a field the planner writes, so the operator looks
//    it up; what it may never do is group two chunks itself.
// 2. Steps 6 and 8 are the operator's own `npm run ward -- --staged`. That command moved here from
//    the reviewer for a mechanical reason: ward's typecheck is `tsc -b`, which BUILDS, so exactly
//    one session per round may run it — and the operator was already the one session that builds.
//    Step 8 is a lookup off the reviewer's `FIXES MADE` block, not a judgement about the fixes.
// 3. The dispatch protocol inverted. Two `Agent` calls in one message is now how a wave runs, so
//    the rule that used to forbid it has to say what IS forbidden instead.
//
// None of the three is discipline-specific and none asks the operator to weigh evidence it cannot
// see. Growth of that shape is what this number is for. Growth of any other shape is what it stops.
const BUDGET_CHARS_EXCLUDING_OPERATING_RULES = 15_500;

describe('operatorPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(operatorPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          myDiscipline: '$MY_DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  // Two independent `.replace` calls in two separate resolvers do the substitution. One puts the
  // pack's authored MARKDOWN at `$DISCIPLINE`. The other puts the bare discipline id at
  // `$MY_DISCIPLINE`. If one token were a PREFIX of the other, the pack substitution would match
  // the prefix first and leave `<whole pack markdown>_NAME` behind. `$DISCIPLINE_NAME` and
  // `$DISCIPLINE_ID` both are. So it is pinned here: neither token may contain the other, in
  // either direction. The next person to rename one of these cannot see that from the call sites.
  describe('the two discipline placeholders cannot collide under substitution', () => {
    it('VALID: {both placeholders} => neither token contains the other, so substitution order is irrelevant', () => {
      const { discipline, myDiscipline } = operatorPromptStatics.prompt.placeholders;

      expect({
        packTokenContainsIdToken: discipline.includes(myDiscipline),
        idTokenContainsPackToken: myDiscipline.includes(discipline),
        idTokenStartsWithPackToken: myDiscipline.startsWith(discipline),
        packTokenStartsWithIdToken: discipline.startsWith(myDiscipline),
      }).toStrictEqual({
        packTokenContainsIdToken: false,
        idTokenContainsPackToken: false,
        idTokenStartsWithPackToken: false,
        packTokenStartsWithIdToken: false,
      });
    });

    it('VALID: {either order} => both orders produce the identical rendered prompt', () => {
      const { placeholders } = operatorPromptStatics.prompt;

      const packFirst = template
        .replace(placeholders.discipline, () => '<PACK MARKDOWN>')
        .split(placeholders.myDiscipline)
        .join('manual-qa');
      const idFirst = template
        .split(placeholders.myDiscipline)
        .join('manual-qa')
        .replace(placeholders.discipline, () => '<PACK MARKDOWN>');

      expect({
        identical: idFirst === packFirst,
        packTokenGone: packFirst.includes(placeholders.discipline),
        idTokenGone: packFirst.includes(placeholders.myDiscipline),
        packSubstituted: packFirst.split('<PACK MARKDOWN>').length - 1,
      }).toStrictEqual({
        identical: true,
        packTokenGone: false,
        idTokenGone: false,
        packSubstituted: 1,
      });
    });

    // `$MY_DISCIPLINE` appears TWICE, and every occurrence must resolve. It is quoted into the
    // `get-agent-prompt` call the operator's minions must make. It is quoted again into the header
    // every brief opens with. A resolver reaching for `.replace(token, fn)` substitutes the FIRST
    // match only. The survivor then reaches the agent as the literal string. Every minion the
    // agent dispatches after that fetches with `$MY_DISCIPLINE` as its discipline and is refused.
    // Both resolvers use `split`/`join` for exactly this reason. Their colocated tests assert zero
    // unresolved tokens in the served prompt.
    it('VALID: template => carries $DISCIPLINE once, $ARGUMENTS once and last, and $MY_DISCIPLINE twice', () => {
      expect({
        disciplineCount: template.split('$DISCIPLINE').length - 1,
        argumentsCount: template.split('$ARGUMENTS').length - 1,
        myDisciplineCount: template.split('$MY_DISCIPLINE').length - 1,
        disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
        argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      }).toStrictEqual({
        disciplineCount: 1,
        argumentsCount: 1,
        myDisciplineCount: 2,
        disciplineOnItsOwnLine: true,
        argumentsIsTheTail: true,
      });
    });
  });

  describe('budgets', () => {
    it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
      expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
    });

    it('VALID: authored half => stays under the forcing-function budget', () => {
      expect(authored.length).toBeLessThan(BUDGET_CHARS_EXCLUDING_OPERATING_RULES);
    });
  });

  // The operator runs NO ward, so it takes `wardNone` — the [WARD] rule that negates the scoping
  // rule the other three readers carry. `wardScoped` would hand it back a command its own FORBIDDEN
  // table takes away, and carrying both would leave it following whichever it read first. The
  // actual side of this assertion is built from the statics, so a piece added there arrives here as
  // an unexpected key rather than going unnoticed.
  it('VALID: template => composes the operator operating rules, and no piece meant for another reader', () => {
    expect(
      Object.fromEntries(
        Object.entries(agentOperatingRulesStatics).map(([key, piece]) => [key, has(piece)]),
      ),
    ).toStrictEqual({
      heading: true,
      turnEndRole: true,
      turnEndMinion: false,
      background: true,
      wardScoped: true,
      wardNone: false,
      delegationSynchronous: true,
      delegationSpike: false,
      delegationLeafBan: false,
      wallRole: true,
      wallMinion: false,
      treeCleanRole: false,
      treeCleanOperator: true,
    });
  });

  // The whole design rests on the operator's context never filling up. The table is what makes
  // that true. A post-mortem measured agents dropping the prose version of the same rule: one
  // operator ran 217 turns with zero `Agent` calls and wrote all 27 of its own sign-offs.
  describe('the tool table', () => {
    it('VALID: ALLOWED list => is exactly the commands and calls the script uses', () => {
      expect({
        build: TOOL_TABLE.includes('npm run build                                  ← step 1'),
        wardStaged: TOOL_TABLE.includes(
          'npm run ward -- --staged                       ← steps 6 and 8, that ONE form and no other',
        ),
        status: TOOL_TABLE.includes(
          'git status                                     ← steps 2 and 9',
        ),
        push: TOOL_TABLE.includes('git push                                       ← step 10, bare'),
        readOnlyThePlan: TOOL_TABLE.includes(
          'Read on .quest-plans/round-<n>.md              ← step 4, that ONE path and no other',
        ),
        agent: TOOL_TABLE.includes('Agent(planner-minion | worker-minion | reviewer-minion)'),
        signalBack: TOOL_TABLE.includes('signal-back                                    ← step 11'),
        disciplineMayOpenIt: TOOL_TABLE.includes(
          'whatever your discipline names below           ← a server it owns, its own reset lever',
        ),
      }).toStrictEqual({
        build: true,
        wardStaged: true,
        status: true,
        push: true,
        readOnlyThePlan: true,
        agent: true,
        signalBack: true,
        disciplineMayOpenIt: true,
      });
    });

    it('VALID: FORBIDDEN list => names every tool that would let this session read source or grade code', () => {
      expect({
        readWrite: TOOL_TABLE.includes('Read / Edit / Write on any path but the plan file'),
        wardInAnyOtherForm: TOOL_TABLE.includes(
          'npm run ward in any other form                 ← scoped, --only, a file list: none of them is yours',
        ),
        // This one is per-discipline, not universal. On `below-browser` the planner, the worker
        // AND the reviewer each fetch it. On `implementation` nobody does — that pack says "No
        // checklist tool answers it. Do not hunt for one." So an annotation naming ONE minion is
        // false for whichever pack is interpolated next to it.
        qaChecklist: TOOL_TABLE.includes(
          'get-qa-checklist                               ← your minions fetch it if their discipline says to',
        ),
        blightChecklist: TOOL_TABLE.includes(
          'get-blight-checklist                           ← your REVIEWER fetches it, after you dispatch it',
        ),
        search: TOOL_TABLE.includes(
          'discover · get-project-map · get-project-inventory · get-folder-detail',
        ),
        standards: TOOL_TABLE.includes(
          'get-architecture · get-syntax-rules · get-testing-patterns',
        ),
        // All three tools stay FORBIDDEN. The annotation names only callers that exist. The
        // `planner-minion` loads `get-quest`. Each discipline's reviewer block writes through
        // `modify-quest`. NO minion template and NO discipline pack calls
        // `get-quest-planning-notes`; its one caller in the repo is `tavernkeeper-prompt-statics`.
        // So the old "your minions read and write the quest" credited work nobody does.
        quest: TOOL_TABLE.includes(
          'get-quest · get-quest-planning-notes · modify-quest   ← your planner reads the quest, your reviewer writes it',
        ),
        gitHistory: TOOL_TABLE.includes('git log / git diff / git show'),
        gitWrite: TOOL_TABLE.includes('git add / git commit'),
        // All FIVE verbs every minion prompt bans, not three. "Never, by anyone" over a short list
        // reads as permission for the two it left out.
        gitDestructive: TOOL_TABLE.includes(
          'git stash / reset / checkout -- / clean / rebase  ← never, by anyone, on a branch others share',
        ),
        writingAnything: TOOL_TABLE.includes(
          'writing code, a test, a plan, a sign-off or a verdict',
        ),
        judging: TOOL_TABLE.includes('judging whether code is CORRECT'),
      }).toStrictEqual({
        readWrite: true,
        wardInAnyOtherForm: true,
        qaChecklist: true,
        blightChecklist: true,
        search: true,
        standards: true,
        quest: true,
        gitHistory: true,
        gitWrite: true,
        gitDestructive: true,
        writingAnything: true,
        judging: true,
      });
    });

    // A forbidden tool named anywhere but the fence reads as permission to use it. That is how the
    // operator's predecessor ended up with `modify-quest` in its ALLOWED list with no step that
    // used it. It is also how a `get-blight-checklist` annotation ended up crediting the wrong
    // minion. The scope here is the AUTHORED half minus the fence. The embedded operating rules
    // legitimately name `npm run ward`, as the thing the reviewer runs, and `git commit`, in rule
    // 5's denied-command example. This file does not own that text.
    it('VALID: outside the fence => no code-reading, quest-writing or ward command is mentioned at all', () => {
      const outsideFenceAndRules = authored.split(TOOL_TABLE).join('');

      expect({
        discover: outsideFenceAndRules.includes('discover'),
        getProjectMap: outsideFenceAndRules.includes('get-project-map'),
        getProjectInventory: outsideFenceAndRules.includes('get-project-inventory'),
        getFolderDetail: outsideFenceAndRules.includes('get-folder-detail'),
        getArchitecture: outsideFenceAndRules.includes('get-architecture'),
        getSyntaxRules: outsideFenceAndRules.includes('get-syntax-rules'),
        getTestingPatterns: outsideFenceAndRules.includes('get-testing-patterns'),
        modifyQuest: outsideFenceAndRules.includes('modify-quest'),
        getQuestPlanningNotes: outsideFenceAndRules.includes('get-quest-planning-notes'),
        gitLog: outsideFenceAndRules.includes('git log'),
        gitDiff: outsideFenceAndRules.includes('git diff'),
        gitCommit: outsideFenceAndRules.includes('git commit'),
        // The ONE ward form this session runs is named in steps 6 and 8, so it is not on this
        // list. Every other form is, and the table's FORBIDDEN half says so.
        wardScoped: outsideFenceAndRules.includes('npm run ward -- --only'),
        wardBare: /npm run ward(?! -- --staged)/u.test(outsideFenceAndRules),
      }).toStrictEqual({
        discover: false,
        getProjectMap: false,
        getProjectInventory: false,
        getFolderDetail: false,
        getArchitecture: false,
        getSyntaxRules: false,
        getTestingPatterns: false,
        modifyQuest: false,
        getQuestPlanningNotes: false,
        gitLog: false,
        gitDiff: false,
        gitCommit: false,
        wardScoped: false,
        wardBare: false,
      });
    });
  });

  // Nine steps, numbered contiguously. A step that goes missing changes what the operator does. It
  // fails nothing at runtime. Every predecessor of this template lost or renumbered one at least
  // once.
  describe('the script', () => {
    it('VALID: template => numbers its steps 1 through 11, contiguously, and says so in the heading', () => {
      const scriptSection = template.slice(
        template.indexOf('## The script'),
        template.indexOf('## The NEXT table'),
      );

      expect({
        steps: Array.from(scriptSection.matchAll(/^\*\*(\d+)\./gmu)).map((match) => match[0]),
        saysEleven: scriptSection.includes('Eleven steps. Run them in order.'),
        noAdding: scriptSection.includes('Do not skip one, do not reorder them, do not add one.'),
      }).toStrictEqual({
        steps: [
          '**1.',
          '**2.',
          '**3.',
          '**4.',
          '**5.',
          '**6.',
          '**7.',
          '**8.',
          '**9.',
          '**10.',
          '**11.',
        ],
        saysEleven: true,
        noAdding: true,
      });
    });

    it('VALID: steps 1 and 2 => collect output the session is explicitly told NOT to act on', () => {
      expect({
        buildUnpiped: has('Run it as its own command, unpiped, with nothing chained after it'),
        buildNotActedOn: has('**Do not act on it.**\nYou paste it into step 3.'),
        onlyBuilder: has('**You are the only session on this quest that ever runs this command.**'),
        statusNotActedOn: has('Do not act on this one either. It goes into step 3 as well.'),
      }).toStrictEqual({
        buildUnpiped: true,
        buildNotActedOn: true,
        onlyBuilder: true,
        statusNotActedOn: true,
      });
    });

    // The predecessor said "copy your Operation Context's SCOPE BLOCK". No such labelled block
    // exists. `workItemToPromptTransformer` splices `codeweaverScopeBlockTransformer`'s output for
    // `codeweaver` ALONE, under headings of its own (`Your nodes`, `Must satisfy`, `Contracts you
    // own`, `Seams`). The other four operator roles get no scope block at all. So four of five
    // operators were told to copy something absent. The fifth had to guess which lines counted. So
    // the operator now copies the WHOLE context, which removes the question. The same MCP ceiling
    // that bounds the rest of the prompt bounds that context too. The operator cannot read it well
    // enough to choose anyway.
    it('VALID: step 3 => hands the planner the ENTIRE operation context, plus the build and tree output', () => {
      expect({
        contextHeading: has('CONTEXT:'),
        wholeThing: has(
          '<your ENTIRE Operation Context — every line, from `Quest ID:` to the last line of it, verbatim>',
        ),
        buildLine: has("BUILD:  <step 1's output, verbatim>"),
        treeLine: has("TREE:   <step 2's output, verbatim>"),
        reworkLine: has(
          "REWORK: <round 2 and later only: last round's reviewer rework text, verbatim>",
        ),
        doNotPick: has('**Copy the WHOLE thing. Do not pick out the part you think matters.**'),
        namesWhatThePlannerLacks: has(
          'not your operation item, not the ledger,\nnot your flows or packages, not the user request',
        ),
        forbiddenToRead: has('judging material you are forbidden to read'),
        noScopeBlockClaim: has("Operation Context's scope block"),
      }).toStrictEqual({
        contextHeading: true,
        wholeThing: true,
        buildLine: true,
        treeLine: true,
        reworkLine: true,
        doNotPick: true,
        namesWhatThePlannerLacks: true,
        forbiddenToRead: true,
        noScopeBlockClaim: false,
      });
    });

    it('VALID: steps 4 and 5 => read one file, then dispatch the plan wave by wave', () => {
      expect({
        readsThePlanFile: has('`Read` the path its return names — `.quest-plans/round-<n>.md`'),
        onlyFileAllSession: has('This is the\none file you open all session.'),
        orderIsDispatchOrder: has('You dispatch them in the order the plan\nlists them.'),
        waveByWave: has('**5. Dispatch `worker-minion`s WAVE BY WAVE, in `WAVE` order.**'),
        oneMessagePerWave: has(
          '**Dispatch every chunk of one wave in a SINGLE assistant message, one `Agent` call each.**',
        ),
        waitForAllOfThem: has(
          'Wait for all of them to return. Apply the NEXT table to each return.\nOnly then dispatch the next wave.',
        ),
        chunkVerbatim: has("that chunk's whole section of the plan\nfile, copied verbatim"),
        thePlanDecidesNotYou: has('**The plan decides what runs together. You never do.**'),
        neverRegroup: has(
          'Never move a chunk\nbetween waves, never merge two, and never start one before the wave before it has fully returned.',
        ),
        zeroChunksIsLegal: has('**A plan with zero chunks dispatches zero workers.**'),
      }).toStrictEqual({
        readsThePlanFile: true,
        onlyFileAllSession: true,
        orderIsDispatchOrder: true,
        waveByWave: true,
        oneMessagePerWave: true,
        waitForAllOfThem: true,
        chunkVerbatim: true,
        thePlanDecidesNotYou: true,
        neverRegroup: true,
        zeroChunksIsLegal: true,
      });
    });

    // Those returns live ONLY in the operator's context. They are not on the quest and not in git.
    // The reviewer's whole job is to grade them against disk. Summarising them makes the operator
    // the grader, which is the one thing it structurally cannot be.
    it('VALID: step 6 => runs the round --staged and says it is the only thing that typechecks', () => {
      expect({
        theCommand: has('**6. `npm run ward -- --staged`.**'),
        foregroundWithTimeout: has('Foreground, `timeout: 600000`.'),
        wardRejectsCompanions: has(
          'No `--only`, no file list —\nward rejects both alongside `--staged`.',
        ),
        theRangeIsTheRound: has(
          'This is every check type over every source file origin does\nnot have yet, which IS this round.',
        ),
        doNotActOnIt: has('**Keep the output. Do not act on it.**'),
        theOnlyTypecheck: has('**This run is the only thing that TYPECHECKS the round.**'),
        becauseWorkersCannot: has(
          "because ward's typecheck is `tsc -b`, which builds — and two workers building\nat once corrupt the shared `dist/`",
        ),
        contractBreaksSurfaceHere: has('A broken contract surfaces here and nowhere earlier.'),
      }).toStrictEqual({
        theCommand: true,
        foregroundWithTimeout: true,
        wardRejectsCompanions: true,
        theRangeIsTheRound: true,
        doNotActOnIt: true,
        theOnlyTypecheck: true,
        becauseWorkersCannot: true,
        contractBreaksSurfaceHere: true,
      });
    });

    // Those returns live ONLY in the operator's context, and so does step 6's ward output. The
    // reviewer's whole job is to grade both against disk. Summarising either makes the operator the
    // grader, which is the one thing it structurally cannot be.
    it('VALID: step 7 => hands the reviewer the ward output and every worker return verbatim', () => {
      expect({
        planPath: has('PLAN: .quest-plans/round-<n>.md'),
        wardBlock: has("WARD:   <step 6's output, verbatim>"),
        verbatimReturns: has('<every worker return from step 5, VERBATIM and in dispatch order>'),
        nowhereElse: has('Those returns exist NOWHERE else — not on the quest, not in git'),
        norDoesTheWardOutput: has('Neither does that ward output.'),
        summarisingGrades: has(
          '**Summarise any of it and you have\ngraded it yourself.** That is the one thing you cannot do.',
        ),
        theReviewerCommitsTheRound: has('**Your reviewer commits the whole round.**'),
      }).toStrictEqual({
        planPath: true,
        wardBlock: true,
        verbatimReturns: true,
        nowhereElse: true,
        norDoesTheWardOutput: true,
        summarisingGrades: true,
        theReviewerCommitsTheRound: true,
      });
    });

    // The reviewer runs no ward, so it cannot check its own fixes. This second run is that check,
    // keyed on the reviewer's own `FIXES MADE` block rather than on a judgement about whether the
    // fixes looked risky.
    it('VALID: step 8 => re-runs the ward only when the reviewer reported fixes', () => {
      expect({
        theCommand: has('**8. `npm run ward -- --staged` again — ONLY if'),
        keyedOnFixesMade: has("your reviewer's `FIXES MADE` block lists\nanything.**"),
        whyItExists: has(
          'Your reviewer runs no ward, so it could not check its own fixes; this is\nthat check.',
        ),
        emptyMeansSkip: has(
          'An empty `FIXES MADE` means nothing changed since step 6 — go to step 9.',
        ),
        aRedIsNotYours: has('A red here is\nnot yours to fix.'),
        whereItGoes: has("It goes into the next round's `REWORK:`, or into your `partial` reason."),
      }).toStrictEqual({
        theCommand: true,
        keyedOnFixesMade: true,
        whyItExists: true,
        emptyMeansSkip: true,
        aRedIsNotYours: true,
        whereItGoes: true,
      });
    });

    // Gate 0a in `quest-handle-signal-back-responder` refuses EVERY outcome — `done`, `partial`
    // and `blocked` alike — while the worktree is dirty. The operator's own FORBIDDEN table denies
    // it `git add` and `git commit`. So the script has to reach a clean tree on its own. The first
    // sweep worker sorts work from scratch. A second commits whatever survived, which always
    // clears the tree. The predecessor ended this step at "signal `blocked`", routing the operator
    // into the one call the server was going to refuse. That ending is pinned negative below so it
    // cannot return.
    it('VALID: step 9 => sorts a dirty tree through a worker, then commits the remainder through a reviewer', () => {
      expect({
        nothingShouldBeListed: has(
          '**9. `git status`.** Nothing should be listed, because your reviewer committed the round.',
        ),
        doNotCommitIt: has('**Do not commit it\nyourself.** You cannot see what it is.'),
        oneWorkerSorts: has(
          'Dispatch ONE `worker-minion` whose whole brief is the header\nplus those paths.',
        ),
        itDeletesScratchAndReturnsWork: has(
          'It opens them, deletes what is scratch, and returns what is real.',
        ),
        aReviewerCommitsWhatSurvived: has(
          'Then dispatch ONE\n`reviewer-minion` to commit what survived, briefed with those paths and nothing else.',
        ),
        secondSweepCommitsEverything: has(
          '**Still dirty → dispatch a SECOND `reviewer-minion`, briefed to commit every remaining path,\nwhatever it is, under the subject `sweep: uncommitted remainder`.**',
        ),
        commitAlwaysClearsTheTree: has(
          'That second sweep is what gets\nyou to step 10 clean, because a commit always clears the tree.',
        ),
        noOutcomeFromADirtyTree: has(
          '**A dirty tree signals nothing.** The\nserver refuses `done`, `partial` and `blocked` alike.',
        ),
        blockedFromADirtyTree: has('signal `blocked`,\nnaming the paths'),
      }).toStrictEqual({
        nothingShouldBeListed: true,
        doNotCommitIt: true,
        oneWorkerSorts: true,
        itDeletesScratchAndReturnsWork: true,
        aReviewerCommitsWhatSurvived: true,
        secondSweepCommitsEverything: true,
        commitAlwaysClearsTheTree: true,
        noOutcomeFromADirtyTree: true,
        blockedFromADirtyTree: false,
      });
    });

    // The push is what makes the NEXT round measurable. The reviewer scopes both its ward
    // (`--staged`) and its review (`scope: 'unpushed'`) to what origin does not have. So a round
    // that never got pushed is a round the next reviewer reads as its own.
    it('VALID: step 8 => pushes bare and names what the push gives the next round', () => {
      expect({
        bare: has('Bare — no branch, no `-u`, no flags.'),
        alreadyTracking: has('Your branch already tracks its upstream.'),
        makesNextRoundMeasurable: has('**This push is what makes the next round measurable.**'),
        bothScopes: has(
          'Your reviewer scopes both its ward and its\nreview to what is committed and not yet pushed.',
        ),
      }).toStrictEqual({
        bare: true,
        alreadyTracking: true,
        makesNextRoundMeasurable: true,
        bothScopes: true,
      });
    });
  });

  // THE one decision. Three values, one action each, plus a safe default for a return that carries
  // no line at all.
  describe('the NEXT table is the lookup every dispatch decision runs through', () => {
    it('VALID: template => declares the three-value vocabulary and says to match the first word', () => {
      expect({
        continueValue: has('NEXT: continue'),
        reworkValue: has('NEXT: rework — <what is not done>'),
        wallValue: has('NEXT: wall — <what a human must change>'),
        matchFirstWord: has('Match the FIRST WORD.'),
        nothingElseRoutes: has('Nothing else in any return is a control signal'),
      }).toStrictEqual({
        continueValue: true,
        reworkValue: true,
        wallValue: true,
        matchFirstWord: true,
        nothingElseRoutes: true,
      });
    });

    it('VALID: the table => routes continue and rework identically, and stops the round on wall', () => {
      expect({
        continueRow: has('| `continue` | go to the next step |'),
        reworkRow: has('| `rework` | go to the next step |'),
        wallRow: has(
          '| `wall` | **STOP dispatching.** Let the rest of the wave finish, then go straight to step 9, then step 10',
        ),
        wallNamesUndispatched: has('and every chunk you had not dispatched yet'),
        missingLineDefault: has(
          '| no `NEXT:` line at all | treat it as `rework`, and say so in your signal |',
        ),
      }).toStrictEqual({
        continueRow: true,
        reworkRow: true,
        wallRow: true,
        wallNamesUndispatched: true,
        missingLineDefault: true,
      });
    });

    // A worker's `rework` is a CLAIM about its own chunk. The reviewer reads every worker return
    // AND opens the files, so the reviewer settles it. That is what reduces the operator's last
    // step from a synthesis of three channels to a lookup on one line.
    it('VALID: template => says continue and rework do the same thing, and that only the reviewer decides', () => {
      expect({
        deliberatelyIdentical: has('**`continue` and `rework` do the same thing, deliberately.**'),
        workerClaimIsAClaim: has("A worker's `rework` is a CLAIM about\nits own chunk."),
        reviewerSettlesIt: has('Your reviewer settles it.'),
        onlyReviewerDecides: has("**Only your REVIEWER's line decides the round.**"),
      }).toStrictEqual({
        deliberatelyIdentical: true,
        workerClaimIsAClaim: true,
        reviewerSettlesIt: true,
        onlyReviewerDecides: true,
      });
    });

    it('VALID: step 9 table => maps the reviewer line to done, another round, or partial, using the configured cap', () => {
      const cap = slotManagerStatics.operator.maxRoundsPerSession;

      expect({
        doneRow: has('| `continue` | `done` |'),
        anotherRound: has(
          `| \`rework\`, and fewer than ${cap} rounds are spent | Do not signal. Start round + 1 at step 1`,
        ),
        carriesTheText: has(
          "with that text — plus any red from step 8 — as the next planner's `REWORK:` |",
        ),
        partialRow: has(
          `| \`rework\`, and ${cap} rounds are spent | \`partial\`, with that text as your reason |`,
        ),
        wallNeverReachesIt: has(
          'A `wall` never reaches this table. The table above already routed it.',
        ),
      }).toStrictEqual({
        doneRow: true,
        anotherRound: true,
        carriesTheText: true,
        partialRow: true,
        wallNeverReachesIt: true,
      });
    });
  });

  // Two server-side gates can refuse a `done`, and nothing is persisted when they do. A refusal is
  // not a dead end. But the re-review has to be told TWO things: that its usual not-yet-pushed
  // window is empty, and that the round is already published. Told neither, it enumerates nothing,
  // records nothing, and earns the identical refusal.
  describe('signalling', () => {
    it('VALID: template => carries all three signal-back shapes', () => {
      expect({
        done: has("operationStatus: 'done' })"),
        partial: has("operationStatus: 'partial' })"),
        blocked: has(
          "operationStatus: 'blocked', blockedReason: '<the wall, and what a human must change to clear it>' })",
        ),
        exactlyOnce: has('Signal exactly once, as the final action of your turn.'),
      }).toStrictEqual({ done: true, partial: true, blocked: true, exactlyOnce: true });
    });

    it('VALID: the refusal path => re-dispatches ONE reviewer with the quest scope and no ward, then gives up after two', () => {
      expect({
        recomputed: has('**`done` is RECOMPUTED, not believed.**'),
        refusalIsADispatch: has('A refusal is not a dead end.'),
        nothingPersisted: has('**NOTHING is persisted on a refusal.**'),
        refusalVerbatim: has('REFUSAL: <the refusal message, verbatim>'),
        questScope: has('SCOPE: quest'),
        whyQuestScope: has(
          "The reviewer's usual not-yet-pushed window is EMPTY,\nbecause you pushed at step 10.",
        ),
        twoStrikes: has('**A second refusal is `partial`.**'),
      }).toStrictEqual({
        recomputed: true,
        refusalIsADispatch: true,
        nothingPersisted: true,
        refusalVerbatim: true,
        questScope: true,
        whyQuestScope: true,
        twoStrikes: true,
      });
    });
  });

  describe('minion dispatch protocol', () => {
    it('VALID: template => fixes a model per minion and names the expensive downgrade', () => {
      expect({
        subagentType: has('`subagent_type: "general-purpose"`'),
        planner: has('| `planner-minion` | `model: "opus"` |'),
        worker: has('| `worker-minion` | `model: "sonnet"` |'),
        reviewer: has('| `reviewer-minion` | `model: "opus"` |'),
        downgradeWarning: has('Never downgrade the reviewer.'),
      }).toStrictEqual({
        subagentType: true,
        planner: true,
        worker: true,
        reviewer: true,
        downgradeWarning: true,
      });
    });

    // The ban inverted when the round went parallel. Two `Agent` calls in one message IS a wave.
    // What is forbidden now is grouping the operator chose itself, because the only thing that
    // makes a group safe is the planner having read the files and said so.
    it('VALID: template => makes concurrency the wave mechanism and forbids a grouping it chose itself', () => {
      expect({
        concurrencyIsTheWave: has(
          '**Two `Agent` calls in one assistant message run CONCURRENTLY. That is how a wave runs, and the\nonly thing it is for.**',
        ),
        oneMessagePerWave: has('One message per wave, one call per chunk in it.'),
        neverTwoWaves: has(
          '**Never put two WAVES in one message, and never a planner or a reviewer beside anything else.**',
        ),
        thePlannerIsWhyAWaveIsSafe: has(
          "A\nwave's chunks are safe together only because your planner read the files and said so.",
        ),
        cause: has(
          'two minions that collide hand each other\nphantom failures that eat the rest of your turn',
        ),
        andTheOldSerialBanIsGone: has('**Never two `Agent` calls in one assistant message.**'),
      }).toStrictEqual({
        concurrencyIsTheWave: true,
        oneMessagePerWave: true,
        neverTwoWaves: true,
        thePlannerIsWhyAWaveIsSafe: true,
        cause: true,
        andTheOldSerialBanIsGone: false,
      });
    });

    // A minion's own fetch returns its method and the Quest ID and nothing else. The sign-off and
    // disposition contracts each REQUIRE a uuid-validated id only the parent holds. So an omission
    // does not degrade a write. It REJECTS one. Step 9's `done` is then refused with nothing on
    // the quest to show why.
    it('VALID: template => mandates the brief header and names what a missing id costs', () => {
      expect({
        minionFetch: has(
          "get-agent-prompt({ agent: 'planner-minion', questId: 'QUEST_ID', discipline: '$MY_DISCIPLINE' })",
        ),
        noWorkItemId: has('That fetch passes **NO workItemId**.'),
        disciplineRequired: has(
          '**The `discipline` argument is REQUIRED. Without it the fetch is REFUSED.**',
        ),
        headerIds: has(
          'Quest ID: QUEST_ID · Work Item ID: WORK_ITEM_ID · Operation Item ID: OPERATION_ITEM_ID',
        ),
        headerRoundAndPlan: has(
          'discipline: $MY_DISCIPLINE · round: <n> · plan file: .quest-plans/round-<n>.md',
        ),
        rejectedNotDegraded: has(
          'An omitted id does not degrade the write. The server REJECTS it instead.',
        ),
      }).toStrictEqual({
        minionFetch: true,
        noWorkItemId: true,
        disciplineRequired: true,
        headerIds: true,
        headerRoundAndPlan: true,
        rejectedNotDegraded: true,
      });
    });

    // `workItemToPromptTransformer` prints a DIFFERENT caveat per role, keyed on
    // `signoffTrackEligibilityStatics.byTrack`. That map holds `flowrider`, `groundstomper` and
    // `siegemaster` and nothing else. Those three read `Your flows:` / `Your packages:` with "YOUR
    // unit of accountability" and "YOUR coverage slice" under them, because that IS what their
    // completion gate measures. `codeweaver` and `pesteater` read `Flows your operation item lands
    // on:` with "(A starting point, NOT a boundary …)" instead. This ONE template serves all five.
    // So it may assert neither reading, and it may not claim a label two of its readers never see.
    // It points at the caveat instead. It keeps the part that holds for every role: neither
    // reading makes the flows or packages an ARGUMENT a minion can widen or narrow.
    it('VALID: template => points at the per-discipline caveat instead of asserting one reading of it', () => {
      expect({
        caveatBinds: has(
          "**The caveat printed under your Operation Context's flow and package lists is the one that binds.**",
        ),
        trackReading: has('| has a sign-off track | YOUR scope.'),
        gateMeasuresThem: has("The track's completion gate measures against exactly them."),
        noTrackReading: has('| has no track | a starting point, not a boundary |'),
        notAnArgument: has('Neither reading makes them an ARGUMENT'),
        noMinionCanWiden: has('No minion can widen or narrow anything by how it passes\nthem.'),
        whatNamingThemGives: has('A brief that names them gives the minion its SEARCH.'),
        // The two claims that were false for `codeweaver` and `pesteater`, pinned out.
        unhedgedScopeClaim: has("**Your flows and packages ARE your item's scope.**"),
        contextSaysSo: has('Your Operation Context says so on the line under'),
        noContradiction: has('are NOT scope arguments'),
      }).toStrictEqual({
        caveatBinds: true,
        trackReading: true,
        gateMeasuresThem: true,
        noTrackReading: true,
        notAnArgument: true,
        noMinionCanWiden: true,
        whatNamingThemGives: true,
        unhedgedScopeClaim: false,
        contextSaysSo: false,
        noContradiction: false,
      });
    });
  });

  // The pack's operator block is TWO fields. It was four. `SCOPE` duplicated `Your operation
  // item:` / `Your flows:` / `Your packages:` from `$ARGUMENTS`, which are generated from live
  // quest data and therefore cannot drift from it the way pack prose can. `EMPTY` duplicated the
  // script's own "a plan with zero chunks dispatches zero workers". What is left is the only two
  // things a session that opens no file can act on, and four of the five packs answer both with
  // "none".
  it('VALID: the discipline section => announces two fields and permits a discipline-named tool', () => {
    expect({
      twoFields: has('**Your discipline names at most two things below.**'),
      namesBoth: has(
        '| `RESOURCE` | the one long-running server this discipline owns |\n| `RESET` | the one lever it pulls between workers |',
      ),
      restIsInTheMinions: has(
        "Your minions' own prompts hold everything else your discipline has to say.",
      ),
      wouldOnlyBeForwarding: has('because you would only be forwarding it'),
      contextCarriesTheScope: has('Your Operation Context already carries the scope itself'),
      namingItPermitsIt: has('**Your discipline permits a tool by naming it here.**'),
      forbiddenIsAbsolute: has(
        'No discipline may ever hand you back\nsomething the FORBIDDEN list denies you.',
      ),
    }).toStrictEqual({
      twoFields: true,
      namesBoth: true,
      restIsInTheMinions: true,
      wouldOnlyBeForwarding: true,
      contextCarriesTheScope: true,
      namingItPermitsIt: true,
      forbiddenIsAbsolute: true,
    });
  });

  // ============================================================================================
  // CROSS-FILE AGREEMENTS. Each test below spans THIS file and one of the three minion templates,
  // and builds its needle out of the OTHER file's live value. Nothing type-checks a brief, a plan
  // fence or a `NEXT:` line, so a reword on either side used to pass ward in silence. It now fails
  // one test that names both sides.
  // ============================================================================================
  describe('agreements with the three minions this session dispatches', () => {
    // SPANS planner-minion-statics.ts ↔ this file. The planner OWNS the plan format and the plan
    // path; this template consumes both — step 5 promises to copy each chunk field verbatim, and
    // the ALLOWED table permits `Read` on that ONE path and no other. Rename the file in the
    // planner alone and this session is locked out of the only file it opens all session; rename a
    // chunk field and step 5 promises to copy a section it can no longer name.
    it('VALID: {planner plan file, script} => step 5 names every chunk field the planner writes, and every step reads the path it commits', () => {
      expect({
        plannerWritesThisManyChunkFields: PLAN_CHUNK_FIELDS.length,
        stepFiveNamesThemAllInTheSameOrder: template
          .replace(/\s+/gu, ' ')
          .includes(`copied verbatim — its ${PLAN_CHUNK_ENUMERATION}`),
        allowedTableGrantsReadOnExactlyThatPath: has(`Read on ${PLAN_PATH} `),
        stepFourReadsThatPath: has(`\`Read\` the path its return names — \`${PLAN_PATH}\``),
        stepSixBriefNamesThatPath: has(`PLAN: ${PLAN_PATH}`),
        briefHeaderNamesThatPath: BRIEF_HEADER.includes(`plan file: ${PLAN_PATH}`),
        plannerReturnsThatSamePath: PLANNER.includes(`PLAN: ${PLAN_PATH} — <count> chunks`),
      }).toStrictEqual({
        plannerWritesThisManyChunkFields: 7,
        stepFiveNamesThemAllInTheSameOrder: true,
        allowedTableGrantsReadOnExactlyThatPath: true,
        stepFourReadsThatPath: true,
        stepSixBriefNamesThatPath: true,
        briefHeaderNamesThatPath: true,
        plannerReturnsThatSamePath: true,
      });
    });

    // SPANS all three minion templates ↔ this table. Each minion DECLARES its own vocabulary; this
    // table is the only thing that reads one. A value a minion can emit and this table has no row
    // for falls through to the no-`NEXT:`-line default and is silently re-read as `rework` — which
    // is how a `wall` becomes another full round into the same wall. A row here with no minion
    // behind it is the mirror fault: a routing branch nothing can reach.
    it('VALID: {every minion NEXT vocabulary, the NEXT table} => the table routes exactly the values the minions can emit', () => {
      const emitted = Array.from(new Set([...PLANNER_NEXT, ...WORKER_NEXT, ...REVIEWER_NEXT]));

      expect({
        valuesAMinionCanEmitThatThisTableCannotRoute: emitted.filter(
          (value) => !ROUTED_VALUES.includes(value),
        ),
        rowsHereWithNoMinionBehindThem: ROUTED_VALUES.filter((value) => !emitted.includes(value)),
        plannerDeclares: PLANNER_NEXT.length,
        workerDeclares: WORKER_NEXT.length,
        reviewerDeclares: REVIEWER_NEXT.length,
        thisTableRoutes: ROUTED_VALUES.length,
        theValueThePlannerRefusesIsStillRoutedForTheOtherTwo: ROUTED_VALUES.filter(
          (value) => !PLANNER_NEXT.includes(value),
        ).every((value) =>
          PLANNER.includes(`names a third value, \`NEXT: ${value}\`. Never write it.**`),
        ),
        matchesTheFirstWord: has('Match the FIRST WORD.'),
        nothingElseRoutes: has('Nothing else in any return is a control signal'),
      }).toStrictEqual({
        valuesAMinionCanEmitThatThisTableCannotRoute: [],
        rowsHereWithNoMinionBehindThem: [],
        plannerDeclares: 2,
        workerDeclares: 3,
        reviewerDeclares: 3,
        thisTableRoutes: 3,
        theValueThePlannerRefusesIsStillRoutedForTheOtherTwo: true,
        matchesTheFirstWord: true,
        nothingElseRoutes: true,
      });
    });

    // SPANS reviewer-minion-statics.ts ↔ step 9. Step 9 reads the REVIEWER's line and nothing
    // else, so its first column is a claim about what that one template can write. The reviewer
    // has three values and this table has rows for two: the third is routed by the table above,
    // and the sentence under this one is what says so. Drop that sentence, or let the reviewer
    // grow a fourth value, and one of the two tables stops covering its own input.
    it('VALID: {reviewer NEXT vocabulary, step 9} => step 9 signals on every reviewer value it is the last reader of', () => {
      const routedEarlier = REVIEWER_NEXT.filter((value) => !STEP_NINE_VALUES.includes(value));

      expect({
        reviewerValuesStepNineHasNoRowFor: routedEarlier.length,
        andTheTemplateSaysWhereEachOfThemWent: routedEarlier.every((value) =>
          has(`A \`${value}\` never reaches this table. The table above already routed it.`),
        ),
        theTableAboveDoesRouteThem: routedEarlier.filter((value) => !ROUTED_VALUES.includes(value)),
        stepNineRowsWithNoReviewerValueBehindThem: STEP_NINE_VALUES.filter(
          (value) => !REVIEWER_NEXT.includes(value),
        ),
        onlyTheReviewersLineDecides: has("**Only your REVIEWER's line decides the round.**"),
        theReviewerIsToldTheSame: REVIEWER.includes('**Your last line decides the round.**'),
        andThatItSupersedesEveryWorkerLine: REVIEWER.includes('Yours SUPERSEDES all of them.'),
        theWorkerIsToldItsOwnLineGoesToTheReviewer: WORKER.includes(
          'Your parent hands it\n  to your reviewer.',
        ),
      }).toStrictEqual({
        reviewerValuesStepNineHasNoRowFor: 1,
        andTheTemplateSaysWhereEachOfThemWent: true,
        theTableAboveDoesRouteThem: [],
        stepNineRowsWithNoReviewerValueBehindThem: [],
        onlyTheReviewersLineDecides: true,
        theReviewerIsToldTheSame: true,
        andThatItSupersedesEveryWorkerLine: true,
        theWorkerIsToldItsOwnLineGoesToTheReviewer: true,
      });
    });

    // SPANS the brief header here ↔ all three minion templates. A minion's own fetch hands back
    // its method and the Quest ID and nothing else, so any id it names in its own prompt has to
    // have arrived in this header. An id named down there that this header never sends is an
    // instruction no minion can carry out; the reviewer's `get-blight-checklist` call is the one
    // that actually depends on it.
    it('VALID: {brief header, the three minion templates} => no minion names an id this header does not carry', () => {
      expect({
        headerFields: HEADER_FIELDS.length,
        idsThePlannerNamesAndThisHeaderLacks: PLANNER_IDS.filter(
          (token) => !BRIEF_HEADER.includes(token),
        ),
        idsTheWorkerNamesAndThisHeaderLacks: WORKER_IDS.filter(
          (token) => !BRIEF_HEADER.includes(token),
        ),
        idsTheReviewerNamesAndThisHeaderLacks: REVIEWER_IDS.filter(
          (token) => !BRIEF_HEADER.includes(token),
        ),
        theReviewerReallyDoesNameOne: REVIEWER_IDS.length,
        andItsChecklistCallIsWhatNeedsIt: REVIEWER.includes(
          `get-blight-checklist({ questId: '${REVIEWER_FIRST_ID}'`,
        ),
        theBriefIsTheOnlyContextAMinionGets: has(
          '**Your brief is the ONLY quest context a minion gets.**',
        ),
      }).toStrictEqual({
        headerFields: 8,
        idsThePlannerNamesAndThisHeaderLacks: [],
        idsTheWorkerNamesAndThisHeaderLacks: [],
        idsTheReviewerNamesAndThisHeaderLacks: [],
        theReviewerReallyDoesNameOne: 1,
        andItsChecklistCallIsWhatNeedsIt: true,
        theBriefIsTheOnlyContextAMinionGets: true,
      });
    });
  });
});
