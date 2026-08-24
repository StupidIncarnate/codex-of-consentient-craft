import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { plannerMinionStatics } from '../planner-minion/planner-minion-statics';
import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
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

// The brief fence: the WHOLE grammar this template permits a brief to use. The fetch line plus the
// key names, and those keys are all a minion ever receives directly.
const BRIEF_FENCE_OPENS = template.indexOf('```', template.indexOf('## Minion dispatch protocol'));
const BRIEF_FENCE = template.slice(
  BRIEF_FENCE_OPENS + 3,
  template.indexOf('```', BRIEF_FENCE_OPENS + 3),
);
const BRIEF_KEYS = Array.from(BRIEF_FENCE.matchAll(/^([A-Z]+):/gmu)).map((match) => match[1] ?? '');

// The round document this template WRITES at step 1.
const CONTEXT_FENCE_OPENS = template.indexOf(
  '```',
  template.indexOf('**1. WRITE the round document'),
);
const CONTEXT_FENCE = template.slice(
  CONTEXT_FENCE_OPENS + 3,
  template.indexOf('```', CONTEXT_FENCE_OPENS + 3),
);

// Its section headings are the ONLY channel between the four sessions of a round, so each one this
// template names is paired here with the minion templates that name it back.
const MINION_NAMES = ['planner', 'worker', 'reviewer'];
const MINION_SOURCES = [PLANNER, WORKER, REVIEWER];
const DOCUMENT_SECTIONS = Array.from(
  new Set(
    Array.from(template.matchAll(/`(## [A-Z][A-Za-z -]*)`/gu)).map((match) => match[1] ?? ''),
  ),
).sort();
const SECTION_READERS = Object.fromEntries(
  DOCUMENT_SECTIONS.map((section) => [
    section,
    MINION_NAMES.filter((_name, index) => (MINION_SOURCES[index] ?? '').includes(`\`${section}\``)),
  ]),
);

// The two routing tables: the per-return one under the script, and the signal table under it.
const NEXT_TABLE = template.slice(
  template.indexOf('| The line says | You do |'),
  template.indexOf('**`continue` and `rework` do the same thing'),
);
const ROUTED_VALUES = Array.from(NEXT_TABLE.matchAll(/^\| `([a-z]+)` \|/gmu)).map(
  (match) => match[1] ?? '',
);
const SIGNAL_TABLE = template.slice(
  template.indexOf("| Your REVIEWER's line | Signal |"),
  template.indexOf('A `wall` never reaches this table.'),
);
const SIGNAL_TABLE_VALUES = Array.from(
  new Set(Array.from(SIGNAL_TABLE.matchAll(/^\| `([a-z]+)`/gmu)).map((match) => match[1] ?? '')),
);

// What each minion declares it may write after `NEXT:` — one per line in the planner, the whole
// menu on ONE line in the worker and the reviewer.
const [PLANNER_NEXT = [], WORKER_NEXT = [], REVIEWER_NEXT = []] = MINION_SOURCES.map((source) =>
  source
    .split('\n')
    .filter((line) => line.startsWith('NEXT:'))
    .flatMap((line) => line.slice('NEXT:'.length).split('|'))
    .map((arm) => arm.trim().split(' ')[0] ?? '')
    .filter((word) => word !== ''),
);

// `QUEST_ID`-shaped tokens: an id a minion can only have got from the brief fence above.
const [PLANNER_IDS = [], WORKER_IDS = [], REVIEWER_IDS = []] = MINION_SOURCES.map((source) =>
  Array.from(
    new Set(Array.from(source.matchAll(/\b[A-Z]+(?:_[A-Z]+)+\b/gu)).map((match) => match[0])),
  ),
);

// The round document: this template creates it, the PLANNER appends the plan to it. Both the path
// and the chunk field names come off the planner's own fence.
const PLAN_FENCE_OPENS = PLANNER.indexOf('```', PLANNER.indexOf('## What you append'));
const PLAN_FENCE = PLANNER.slice(
  PLAN_FENCE_OPENS + 3,
  PLANNER.indexOf('```', PLAN_FENCE_OPENS + 3),
);
const PLAN_CHUNK_FIELDS = Array.from(
  PLAN_FENCE.slice(PLAN_FENCE.indexOf('### chunk 1')).matchAll(/^([A-Z]+):/gmu),
).map((match) => match[1] ?? '');
// The planner's own heading names the path it appends to, as the LAST backticked token on that
// line. Greedy, so a heading that gains another inline-code span ahead of the path still resolves
// to the path.
const PLAN_PATH =
  /^## What you append — .*`([^`]+)`$/mu.exec(PLANNER)?.[1] ?? 'NO PLAN PATH IN THE PLANNER';
// The `WAVES:` index is the ONE thing this session reads out of the plan, so both templates have to
// spell it the same way. The planner writes the index; step 3 here reads it.
const PLAN_WAVES_KEY = /^(WAVES):$/mu.exec(PLAN_FENCE)?.[1] ?? 'THE PLAN CARRIES NO WAVES INDEX';
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
// The two halves separately, so an assertion can say a command is ABSENT from the permitted half
// rather than absent from a fence that also enumerates every ban.
const ALLOWED = TOOL_TABLE.slice(0, TOOL_TABLE.indexOf('FORBIDDEN — no exceptions'));
const FORBIDDEN = TOOL_TABLE.slice(TOOL_TABLE.indexOf('FORBIDDEN — no exceptions'));

// This number is a FORCING FUNCTION, not the protocol ceiling. The ceiling is
// `mcpToolResultStatics.maxVerbatimChars`. A separate test below pins that one. This number says
// two things. Everything discipline-specific belongs in a pack rather than here. Everything that
// needs the reader to WEIGH evidence belongs in the prompt of the minion that holds the evidence.
//
// Do not RAISE this number by asking "is there room under 50k". There always is. Ask these two
// questions instead:
//
// 1. Is what you are adding identical for all five disciplines?
// 2. Can the operator ACT on it by looking it up?
//
// Two noes mean it belongs in a pack or in a minion.
//
// It came DOWN from 18,500 when the script replaced the nine-gate loop, and DOWN again from 13,500
// to 13,350 when the template was rewritten into plain speech. It went UP to 15,500 when the round
// became a DOCUMENT — IN came step 1, its section fence and the append rule; OUT went every copy
// instruction the document replaced.
//
// IT WENT UP AGAIN, TO THE NUMBER BELOW, when the reader stopped being told WHAT to do and started
// being told what the thing IS. Four additions, and the trade for each:
//
// - The refusal section. It described two server gates in their own vocabulary — RECOMPUTED, review
//   checklist, unit, disposition, sign-off track — none of which appears anywhere else in a prompt
//   whose reader opens no file. It never said what a refusal physically is: both gates THROW, so it
//   arrives as a FAILED `signal-back` call, which an agent reads as a crash and answers by retrying
//   the identical call. The words bought the mechanic, the ban on the bare retry, and the
//   dirty-tree branch that wants another sweep rather than a re-review.
// - The discipline-tool WALL. The predecessor asserted no pack would ever name a FORBIDDEN tool —
//   a claim about the packs, leaving a reader that hit one holding a contradiction with no move.
// - The resume-in-order rule. "Do not reorder them" read as a ban on the very jump the signal table
//   requires, so an operator landing back on step 1 had no rule telling it to run 2 through 7 again.
// - The sweep going to a REVIEWER, with the reason, because a worker commits nothing.
//
// OUT went the round cap and its `partial` row.
//
// Every one is SCRIPT MECHANICS, identical for all five disciplines, and every one is a lookup.
// Growth of that shape is what this number is for. Growth of any other shape is what it stops.
// Do not raise it again by asking whether there is room under 50k. There always is.
const BUDGET_CHARS_EXCLUDING_OPERATING_RULES = 20_500;

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

    // `$MY_DISCIPLINE` is quoted into the `get-agent-prompt` call every minion must make, inside
    // the brief fence. That is its ONE occurrence, and it must resolve: a survivor reaches the
    // agent as the literal string, every minion it dispatches then fetches with `$MY_DISCIPLINE`
    // as its discipline, and every one of those fetches is refused. Both resolvers use
    // `split`/`join` for exactly that reason, and their colocated tests assert zero unresolved
    // tokens in the served prompt.
    it('VALID: template => carries $DISCIPLINE once, $ARGUMENTS once and last, and $MY_DISCIPLINE once', () => {
      expect({
        disciplineCount: template.split('$DISCIPLINE').length - 1,
        argumentsCount: template.split('$ARGUMENTS').length - 1,
        myDisciplineCount: template.split('$MY_DISCIPLINE').length - 1,
        myDisciplineIsInTheBriefFence: BRIEF_FENCE.includes("discipline: '$MY_DISCIPLINE'"),
        disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
        argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      }).toStrictEqual({
        disciplineCount: 1,
        argumentsCount: 1,
        myDisciplineCount: 1,
        myDisciplineIsInTheBriefFence: true,
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
      wardScoped: false,
      wardNone: true,
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
    // THE WHOLE LIST IS COMMANDS THIS SESSION CAN ACT ON. `npm run build`, every form of
    // `npm run ward`, and `git push` are absent because their results reach a session that may not
    // open a source file: it could only forward them. The reviewer runs all three.
    it('VALID: ALLOWED list => is exactly the commands and calls the script uses', () => {
      expect({
        writeTheDocumentOnce: ALLOWED.includes(
          'Write on .quest-plans/<operationItemId>-round-<n>.md   ← step 1 ONLY, to create it',
        ),
        everyLaterWriteIsAnAppend: ALLOWED.includes(
          'cat >> .quest-plans/<operationItemId>-round-<n>.md     ← every later write to it, always with >>',
        ),
        readOnlyThatPath: ALLOWED.includes(
          'Read on .quest-plans/<operationItemId>-round-<n>.md    ← step 3, that ONE path and no other',
        ),
        status: ALLOWED.includes(
          'git status                                     ← step 6, the sweep, and nowhere else',
        ),
        agent: ALLOWED.includes('Agent(planner-minion | worker-minion | reviewer-minion)'),
        signalBack: ALLOWED.includes('signal-back                                    ← step 7'),
        disciplineMayOpenIt: ALLOWED.includes(
          'whatever your discipline names below           ← a server it owns, its own reset lever',
        ),
        noBuild: ALLOWED.includes('npm run build'),
        noWardOfAnyKind: ALLOWED.includes('npm run ward'),
        noPush: ALLOWED.includes('git push'),
      }).toStrictEqual({
        writeTheDocumentOnce: true,
        everyLaterWriteIsAnAppend: true,
        readOnlyThatPath: true,
        status: true,
        agent: true,
        signalBack: true,
        disciplineMayOpenIt: true,
        noBuild: false,
        noWardOfAnyKind: false,
        noPush: false,
      });
    });

    it('VALID: FORBIDDEN list => names every tool that would let this session read source or grade code', () => {
      expect({
        readWrite: FORBIDDEN.includes(
          'Read / Edit / Write on any path but the round document  ← you never see source. That is the point.',
        ),
        // The ONE `Write` the ALLOWED half grants is bounded to step 1. Below the operator's
        // header sit the planner's plan and every worker's report, and both `Write` and `Edit`
        // replace the whole file — so a second one silently deletes the round.
        noSecondWrite: FORBIDDEN.includes(
          'Write or Edit on the round document after step 1   ← a plan and every report sit below your header',
        ),
        // The annotations name the REVIEWER as the session that runs each. The ward entry says EVERY
        // form rather than "any other form": a reader who takes `--staged` as the exception ends up
        // running the one command the reviewer owns.
        build: FORBIDDEN.includes(
          'npm run build                                  ← your REVIEWER builds, once, after it reads the round',
        ),
        wardInEveryForm: FORBIDDEN.includes(
          'npm run ward, in EVERY form                    ← --staged, scoped, --only, a file list: none is yours',
        ),
        gitWriteAndPush: FORBIDDEN.includes(
          'git add / git commit / git push                ← your REVIEWER commits the round and publishes it',
        ),
        // This one is per-discipline, not universal. On `below-browser` the planner, the worker
        // AND the reviewer each fetch it. On `implementation` nobody does — that pack says "No
        // checklist tool answers it. Do not hunt for one." So an annotation naming ONE minion is
        // false for whichever pack is interpolated next to it.
        qaChecklist: FORBIDDEN.includes(
          'get-qa-checklist                               ← your minions fetch it if their discipline says to',
        ),
        blightChecklist: FORBIDDEN.includes(
          'get-blight-checklist                           ← your REVIEWER fetches it, after you dispatch it',
        ),
        search: FORBIDDEN.includes(
          'discover · get-project-map · get-project-inventory · get-folder-detail',
        ),
        standards: FORBIDDEN.includes('get-architecture · get-syntax-rules · get-testing-patterns'),
        // All three tools stay FORBIDDEN. The annotation names only callers that exist. The
        // `planner-minion` loads `get-quest`. Each discipline's reviewer block writes through
        // `modify-quest`. NO minion template and NO discipline pack calls
        // `get-quest-planning-notes`; its one caller in the repo is `tavernkeeper-prompt-statics`.
        // So the old "your minions read and write the quest" credited work nobody does.
        quest: FORBIDDEN.includes(
          'get-quest · get-quest-planning-notes · modify-quest   ← your planner reads the quest, your reviewer writes it',
        ),
        gitHistory: FORBIDDEN.includes('git log / git diff / git show'),
        // All FIVE verbs every minion prompt bans, not three. "Never, by anyone" over a short list
        // reads as permission for the two it left out.
        gitDestructive: FORBIDDEN.includes(
          'git stash / reset / checkout -- / clean / rebase  ← never, by anyone, on a branch others share',
        ),
        writingAnything: FORBIDDEN.includes(
          'writing code, a test, a plan, a sign-off or a verdict',
        ),
        judging: FORBIDDEN.includes('judging whether code is CORRECT'),
      }).toStrictEqual({
        readWrite: true,
        noSecondWrite: true,
        build: true,
        wardInEveryForm: true,
        qaChecklist: true,
        blightChecklist: true,
        search: true,
        standards: true,
        quest: true,
        gitHistory: true,
        gitWriteAndPush: true,
        gitDestructive: true,
        writingAnything: true,
        judging: true,
      });
    });

    // A forbidden tool named anywhere but the fence reads as permission to use it. That is how the
    // operator's predecessor ended up with `modify-quest` in its ALLOWED list with no step that
    // used it. It is also how a `get-blight-checklist` annotation ended up crediting the wrong
    // minion. The scope here is the AUTHORED half minus the fence. The embedded operating rules
    // legitimately name `npm run ward`, as the thing the reviewer runs, and `git commit`, in the
    // [WALL] rule's denied-command example. This file does not own that text.
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
        wardScoped: outsideFenceAndRules.includes('npm run ward -- --only'),
        wardAnyForm: outsideFenceAndRules.includes('npm run ward'),
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
        wardAnyForm: false,
      });
    });
  });

  describe('the script', () => {
    // SEVEN STEPS: one document write, four dispatch steps, one `git status` gate and one signal.
    // Every command left is one whose result changes what this session DOES next. The build, both
    // wards, the two commits and the push all belong to sessions that can open a file.
    it('VALID: template => numbers its steps 1 through 7, contiguously, and says so in the heading', () => {
      const scriptSection = template.slice(
        template.indexOf('## The script'),
        template.indexOf('## The NEXT table'),
      );

      expect({
        steps: Array.from(scriptSection.matchAll(/^\*\*(\d+)\./gmu)).map((match) => match[0]),
        saysSeven: scriptSection.includes('Seven steps. **Run them in order, one at a time.**'),
        noAdding: scriptSection.includes('Do not skip one, do not reorder them, do not add\none.'),
        // A table sending the reader BACKWARDS is the only thing that leaves the straight line, and
        // the reader has to know it resumes the ordinary order from wherever it lands. "Do not
        // reorder them" alone reads as a ban on the very jump the signal table requires.
        aTableMayMoveYou: scriptSection.includes(
          '**The NEXT table and the signal table are the only two things that move you off that order. When\none sends you to a step, go to that step and run every step after it in order, exactly as you did\nthe first time.**',
        ),
        andRoundTwoStartsCLEAN: scriptSection.includes(
          "sends your reviewer's `rework` back to step 1, which opens round + 1: a NEW document, a NEW\nplanner, a fresh `Read` at step 3.",
        ),
        neverResumeMidStep: scriptSection.includes(
          "**Never resume in the middle of a step, and never carry a step's\nwork over from the round before.**",
        ),
        runsNoBuild: scriptSection.includes('npm run build`.**'),
        runsNoWard: scriptSection.includes('npm run ward -- --staged`.**'),
        runsNoPush: scriptSection.includes('`git push`.**'),
      }).toStrictEqual({
        steps: ['**1.', '**2.', '**3.', '**4.', '**5.', '**6.', '**7.'],
        saysSeven: true,
        noAdding: true,
        aTableMayMoveYou: true,
        andRoundTwoStartsCLEAN: true,
        neverResumeMidStep: true,
        runsNoBuild: false,
        runsNoWard: false,
        runsNoPush: false,
      });
    });

    // THE ROUND OPENS ON A WRITE, and that write is the whole reason every brief below it is a
    // path. The predecessor pasted the entire Operation Context into the planner's brief, each
    // chunk's section into its worker's, and every worker return into the reviewer's — three copies
    // made by the one session that may not open the file that would show a dropped line.
    it('VALID: step 1 => writes the whole operation context into the document, once, with Write', () => {
      expect({
        theFirstAction: has(
          '**1. WRITE the round document.** Your FIRST action of the round, and the only time you `Write` this\nfile.',
        ),
        theWholeContext: CONTEXT_FENCE.includes(
          '<your ENTIRE Operation Context — every line, from `Quest ID:` to the last line of it, verbatim>',
        ),
        titleCarriesTheRoundNumber: CONTEXT_FENCE.includes(
          "# Round <n> — <your operation item's text>",
        ),
        copyTheWholeThing: has('**Copy the WHOLE Operation Context, and re-type none of it.**'),
        // Several operation items run on one quest, each opening at its own round 1, and they share
        // one worktree. Under a bare `round-<n>.md` the next operator to start overwrites this
        // one's round 1.
        theIdIsWhatKeepsTheFileYours: has(
          '**The operation item id is what keeps the file yours.**',
        ),
        namesWhatAMinionsOwnFetchLacks: has(
          'not your operation item, not the ledger, not your flows or packages,\nnot the user request',
        ),
        forbiddenToRead: has(
          'Leave anything out and you have judged material you are forbidden to read.',
        ),
        theIdsRideAlong: has('**The three ids ride along with that copy.**'),
        andAreUuidValidated: has(
          'Each field is UUID-validated, so an id retyped wrong is a REJECTED write rather\nthan a degraded one',
        ),
        // Round 1 has nothing to rework, and an empty heading reads to a planner as "this round
        // reworks nothing named", which is a different claim from "this is round 1".
        reworkIsRoundTwoOnly: CONTEXT_FENCE.includes(
          "<round 2 and later ONLY: last round's reviewer rework text, verbatim. On round 1 leave this whole\nsection out. Never write the heading with nothing under it.>",
        ),
      }).toStrictEqual({
        theFirstAction: true,
        theWholeContext: true,
        titleCarriesTheRoundNumber: true,
        copyTheWholeThing: true,
        theIdIsWhatKeepsTheFileYours: true,
        namesWhatAMinionsOwnFetchLacks: true,
        forbiddenToRead: true,
        theIdsRideAlong: true,
        andAreUuidValidated: true,
        reworkIsRoundTwoOnly: true,
      });
    });

    // Below the operator's header sit the planner's plan and, later, several workers' reports. Both
    // `Write` and `Edit` read the whole file and write it back, so a second one deletes the round.
    it('VALID: step 1 => makes every later write an append, and shows the one-shot command', () => {
      expect({
        appendOnly: has('**Every write to this file after this step is an APPEND, with `>>`.**'),
        namesItsOwnTwo: has('Yours at step 6 and yours\nafter a refused signal, both included.'),
        whyNotWrite: has('`Write` and `Edit` replace the whole file'),
        quotedDelimiter: has(
          'Append in ONE\nshot, with a QUOTED heredoc delimiter so nothing inside expands:',
        ),
        theCommand: has("cat >> .quest-plans/<operationItemId>-round-<n>.md <<'DOC'"),
      }).toStrictEqual({
        appendOnly: true,
        namesItsOwnTwo: true,
        whyNotWrite: true,
        quotedDelimiter: true,
        theCommand: true,
      });
    });

    // Every git read but the sweep gate belongs to the PLANNER, which runs `git status` alongside
    // the `git log` only it runs — so this session never holds tree output it can do nothing with
    // but paste onward.
    // Steps 2 and 5 take the SAME brief, and both name it by pointing at the dispatch protocol
    // rather than restating it. "The same two lines your planner got" was the earlier wording and it
    // was false in one detail nothing catches: the fetch line names the AGENT, so the reviewer's
    // copy says `reviewer-minion`. Both steps now name the source, not each other.
    it('VALID: steps 2 and 5 => brief the planner and the reviewer from the same two protocol lines', () => {
      expect({
        theDispatch: has(
          '**2. Dispatch ONE `planner-minion`**, briefed with the FIRST TWO lines under Minion dispatch\nprotocol below and nothing else.',
        ),
        thenApplyTheTable: has(
          '**2. Dispatch ONE `planner-minion`**, briefed with the FIRST TWO lines under Minion dispatch\nprotocol below and nothing else. Then apply the NEXT table.',
        ),
        theReviewerTakesTheSameTwo: has(
          '**5. Dispatch ONE `reviewer-minion`** over everything the round produced, briefed with the FIRST\nTWO lines under Minion dispatch protocol below and nothing else',
        ),
        // The three lines a reviewer must NOT get, named rather than left to be inferred from the
        // fence's own arrows.
        andNotTheThreeThatAreNotItsOwn: has('— no `WAVE:`, no `CHUNK:`, no\n`SECTION:`.'),
        // The FIRST TWO is only a real anchor because the protocol section says which two those are.
        theProtocolSaysWhichTwo: has('The first two are in every brief.'),
        // Every git read but the step 6 gate is the PLANNER's, and the FORBIDDEN row is where this
        // session is told so — `git status` included, which is the one a reader assumes is shared.
        gitIsThePlannersToRead: FORBIDDEN.includes(
          "git log / git diff / git show                  ← git is your PLANNER's to read, status included",
        ),
        andThePlannerReallyRunsOne: PLANNER.includes('**Start with `git status`.**'),
      }).toStrictEqual({
        theDispatch: true,
        thenApplyTheTable: true,
        theReviewerTakesTheSameTwo: true,
        andNotTheThreeThatAreNotItsOwn: true,
        theProtocolSaysWhichTwo: true,
        gitIsThePlannersToRead: true,
        andThePlannerReallyRunsOne: true,
      });
    });

    it('VALID: steps 3 and 4 => read the document back, then dispatch the plan wave by wave', () => {
      expect({
        readsItBack: has('**3. Read the document back.** `Read` that same path.'),
        takesOnlyTheWaves: has('**That index is the only thing you take from the file.**'),
        waveByWave: has('**4. Dispatch `worker-minion`s WAVE BY WAVE, in `WAVES:` order.**'),
        oneMessagePerWave: has(
          "**Every chunk on one wave's line\ngoes out in a SINGLE assistant message, one `Agent` call each**",
        ),
        waitForAllOfThem: has(
          'They then run at the same time. Wait for all of them to return. Apply the NEXT table to\neach return. Only then dispatch the next wave.',
        ),
        // TWO extra lines, not one. The chunk number is the assignment; the wave number is a check
        // only the worker can run, because only the worker opens the file the check is about.
        theWaveLine: has('WAVE:  <the wave you are dispatching>'),
        theChunkLineBesideIt: has(
          "CHUNK: <the chunk number, one of the numbers on that wave's line>",
        ),
        sendBoth: has('**Send BOTH numbers.**'),
        theWaveIsACheckThisSessionCannotRun: has(
          'The wave number is a CHECK your worker\nmakes and you cannot',
        ),
        aMismatchMeansMisgrouped: has('**A mismatch either way\nmeans you mis-grouped**'),
        pastesNoChunk: has("**Never paste a chunk's text into a brief.**"),
        theWorkerReadsItsOwnSection: has(
          'Your worker opens that same file and reads its own chunk there',
        ),
        andTheSiblingsToo: has(
          'beside\nthe sibling chunks that tell it which paths are NOT its own',
        ),
        thePlanDecidesNotYou: has('**The plan decides what runs together. You never do.**'),
        neverRegroup: has(
          'Never move a chunk\nbetween waves, never merge two, and never start one before the wave before it has fully returned.',
        ),
        zeroChunksIsLegal: has('**`WAVES: none` dispatches zero workers.**'),
      }).toStrictEqual({
        readsItBack: true,
        takesOnlyTheWaves: true,
        waveByWave: true,
        oneMessagePerWave: true,
        waitForAllOfThem: true,
        theWaveLine: true,
        theChunkLineBesideIt: true,
        sendBoth: true,
        theWaveIsACheckThisSessionCannotRun: true,
        aMismatchMeansMisgrouped: true,
        pastesNoChunk: true,
        theWorkerReadsItsOwnSection: true,
        andTheSiblingsToo: true,
        thePlanDecidesNotYou: true,
        neverRegroup: true,
        zeroChunksIsLegal: true,
      });
    });

    // The reviewer's brief is the SAME two lines the planner got. Every worker report is already in
    // the document, so there is nothing left for this session to forward — and forwarding is the
    // one thing it structurally cannot do honestly, because it may not check a word of what it
    // would be carrying.
    //
    // NO `WARD:` BLOCK GOES INTO THIS BRIEF EITHER. The reviewer runs its own build and ward, after
    // it has opened every file, so the errors and the files are held by one session and a straggler
    // is a fix in that same turn.
    it('VALID: step 5 => forwards nothing to the reviewer, and carries no ward block for it', () => {
      expect({
        forwardsNothing: has('**You forward nothing**'),
        aReturnIsANumberAndALine: has(
          "a worker's return to you is a chunk number and a `NEXT:`\nline",
        ),
        theReportsAreAlreadyThere: has('and every report it wrote is already in the document'),
        // NO `WARD:` BLOCK GOES INTO THIS BRIEF. The reviewer runs its own build and ward AFTER it
        // has opened every file, so the errors and the files are held by one session and a
        // straggler is a fix in that same turn. This session has no ward output to forward: the
        // [WARD] rule it carries is `wardNone`, asserted whole in the operating-rules test above.
        noWardBlock: /^WARD:/mu.test(template),
        theRuleSaysWhoRunsThem: agentOperatingRulesStatics.wardNone.includes(
          "The round's `reviewer-minion` runs both, ONCE, after every worker has returned AND after it has opened every file the round produced",
        ),
        andThatItIsTheOnlyOne: agentOperatingRulesStatics.wardNone.includes(
          'ONE session per round runs them',
        ),
        andThatTheSameSessionFixesWhatTheyFind: agentOperatingRulesStatics.wardNone.includes(
          'That session is also the only one that can FIX what they turn up, because it is the only one with every file open.',
        ),
      }).toStrictEqual({
        forwardsNothing: true,
        aReturnIsANumberAndALine: true,
        theReportsAreAlreadyThere: true,
        noWardBlock: false,
        theRuleSaysWhoRunsThem: true,
        andThatItIsTheOnlyOne: true,
        andThatTheSameSessionFixesWhatTheyFind: true,
      });
    });

    // Gate 0a in `quest-handle-signal-back-responder` refuses EVERY outcome — `done`, `partial`
    // and `blocked` alike — while the worktree is dirty. The operator's own FORBIDDEN table denies
    // it `git add` and `git commit`. So the script has to reach a clean tree on its own. The first
    // sweep worker sorts work from scratch. A second commits whatever survived, which always
    // clears the tree. The predecessor ended this step at "signal `blocked`", routing the operator
    // into the one call the server was going to refuse. That ending is pinned negative below so it
    // cannot return.
    it('VALID: step 6 => writes the paths into the document, sorts them, then commits the remainder', () => {
      expect({
        nothingShouldBeListed: has(
          '**6. `git status`.** Nothing should be listed, because your reviewer committed the round.',
        ),
        doNotCommitIt: has('**Do not commit it\nyourself.** You cannot see what it is.'),
        thePathsGoInTheDocument: has(
          'APPEND a `## Sweep` section naming every path `git status` listed, one per line.',
        ),
        // ONE reviewer sorts AND commits. It was a worker that sorted with a reviewer behind it to
        // commit, and that split failed both ways: a worker commits nothing, so the sorter always
        // handed back a dirty tree, and the reviewer behind it committed files it had never read.
        oneReviewerSortsAndCommits: has(
          'Then dispatch\nONE `reviewer-minion` on `SECTION: Sweep`. It opens every path, deletes what is scratch, keeps\nwhat is real, and commits what survived.',
        ),
        neverAWorker: has('**A sweep goes to a REVIEWER, never to a worker.**'),
        becauseSortingAndCommittingAreOneJudgement: has(
          'Deciding a path is scratch and leaving it out of\nthe commit are the same judgement, and only a reviewer commits.',
        ),
        // The worker template refuses the brief from its own side, so neither prompt relies on the
        // other having been updated.
        andTheWorkerRefusesTheBrief: WORKER.includes(
          '**A brief carrying a `SECTION:` line instead of the `WAVE:` and `CHUNK:` pair is NOT yours.**',
        ),
        andTheReviewerOwnsTheWholeJob: REVIEWER.includes('## The sweep brief'),
        secondSweepCommitsEverything: has(
          '**Still dirty → dispatch a SECOND `reviewer-minion` on `SECTION: Sweep`, told in one extra line\nto commit every remaining path whatever it is, under the subject `sweep: uncommitted remainder`.**',
        ),
        commitAlwaysClearsTheTree: has(
          'That second sweep is what gets you to a clean tree, because a commit always clears it.',
        ),
        noOutcomeFromADirtyTree: has(
          '**A dirty\ntree signals nothing.** The server refuses `done`, `partial` and `blocked` alike.',
        ),
        blockedFromADirtyTree: has('signal `blocked`,\nnaming the paths'),
      }).toStrictEqual({
        nothingShouldBeListed: true,
        doNotCommitIt: true,
        thePathsGoInTheDocument: true,
        oneReviewerSortsAndCommits: true,
        neverAWorker: true,
        becauseSortingAndCommittingAreOneJudgement: true,
        andTheWorkerRefusesTheBrief: true,
        andTheReviewerOwnsTheWholeJob: true,
        secondSweepCommitsEverything: true,
        commitAlwaysClearsTheTree: true,
        noOutcomeFromADirtyTree: true,
        blockedFromADirtyTree: false,
      });
    });

    // The REVIEWER pushes, as its own last act after both its commits, and this session names no
    // `git push` anywhere. Its FORBIDDEN row says so, so a reader cannot take the absence from the
    // script as an oversight.
    it('VALID: the script => leaves the push to the reviewer and names no push of its own', () => {
      expect({
        theScriptRunsNoPush: has('`git push`.**'),
        theForbiddenRowSaysWhoDoes: FORBIDDEN.includes(
          'git add / git commit / git push                ← your REVIEWER commits the round and publishes it',
        ),
        andTheReviewerTemplateReallyPushes: REVIEWER.includes('**`git push`.** Bare'),
        asItsLastActAfterBothCommits: REVIEWER.includes(
          '**This is the LAST thing you do before you return, and it comes AFTER both commits.**',
        ),
      }).toStrictEqual({
        theScriptRunsNoPush: false,
        theForbiddenRowSaysWhoDoes: true,
        andTheReviewerTemplateReallyPushes: true,
        asItsLastActAfterBothCommits: true,
      });
    });
  });

  // THE one decision. Three values, one action each, plus a safe default for a return that carries
  // no line at all.
  // A SECTION HEADING NAMES WHAT THE SECTION IS, NEVER WHICH STEP READS IT. The script renumbers
  // whenever a command moves between sessions, and a `### Step N` heading takes every cross-reference
  // to it stale at the same moment — silently, because nothing resolves a markdown heading. The two
  // needles below are derived from the template itself, so a heading that regains a number and a
  // reference that keys on one both fail here.
  it('VALID: template => names its sections, and cross-references them by name rather than by step number', () => {
    expect({
      headingsKeyedOnAStepNumber: Array.from(template.matchAll(/^#+ Step \d+/gmu)).map(
        (match) => match[0],
      ),
      referencesKeyedOnAStepNumber: Array.from(template.matchAll(/step-\d+ table/gu)).map(
        (match) => match[0],
      ),
      theSignalTableIsNamedForWhatItIs: /^### The signal table$/mu.test(template),
      andTheScriptSendsTheReaderThereByThatName: has(
        'Every other path reads **the signal table** below',
      ),
    }).toStrictEqual({
      headingsKeyedOnAStepNumber: [],
      referencesKeyedOnAStepNumber: [],
      theSignalTableIsNamedForWhatItIs: true,
      andTheScriptSendsTheReaderThereByThatName: true,
    });
  });

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
        // A `wall` lands at step 7 like every other path, so the seven-step order holds without an
        // exception. Step 7 is where it is told to signal `blocked`, because the signal table below
        // has no row for a `wall` and says so outright.
        wallRow: has(
          '| `wall` | **STOP dispatching.** Let the rest of the wave finish, then go to step 6 and carry on in order. Step 7 signals `blocked`,',
        ),
        wallNamesUndispatched: has('naming that text and every chunk you had not dispatched yet'),
        andStepSevenDecidesItThere: has(
          '**7. Signal, or start the next round.** A `wall` arrives here already decided by the NEXT table:\nsignal `blocked`.',
        ),
        missingLineDefault: has(
          '| no `NEXT:` line at all | treat it as `rework`, and say so in your signal |',
        ),
      }).toStrictEqual({
        continueRow: true,
        reworkRow: true,
        wallRow: true,
        wallNamesUndispatched: true,
        andStepSevenDecidesItThere: true,
        missingLineDefault: true,
      });
    });

    // A worker's `rework` is a CLAIM about its own chunk. The reviewer reads every worker report
    // out of the document AND opens the files, so the reviewer settles it. That is what reduces
    // the operator's last step from a synthesis of three channels to a lookup on one line.
    it('VALID: template => says continue and rework do the same thing, and that only the reviewer decides', () => {
      expect({
        deliberatelyIdentical: has('**`continue` and `rework` do the same thing, deliberately.**'),
        workerClaimIsAClaim: has("A worker's `rework` is a CLAIM about\nits own chunk."),
        reviewerSettlesIt: has('Your reviewer settles it.'),
        reviewerReadsTheDocument: has(
          "Your reviewer reads every worker's report out of the round\ndocument, opens the files, builds and wards.",
        ),
        onlyReviewerDecides: has("**Only your REVIEWER's line decides the round.**"),
      }).toStrictEqual({
        deliberatelyIdentical: true,
        workerClaimIsAClaim: true,
        reviewerSettlesIt: true,
        reviewerReadsTheDocument: true,
        onlyReviewerDecides: true,
      });
    });

    // THE LOOP IS UNBOUNDED. This table used to turn a `rework` into `partial` once a configured
    // number of rounds were spent. `partial` is not a stop: it completes the operation item and
    // mints a `pt N`, so the whole scope restarts in a FRESH session that has to reconstruct the
    // remainder out of git — and on a locked role it also spends one of three `maxAttempts`. A
    // round costs a round; a `partial` costs a session AND an attempt. So the only thing that ends
    // this session is the reviewer's `continue`.
    it('VALID: the signal table => has no round cap, and routes a rework into another round every time', () => {
      expect({
        doneRow: has('| `continue` | `done` |'),
        anotherRound: has('| `rework` | **Do not signal.** Start round + 1 at step 1'),
        noCap: has('**There is NO round cap. Keep going until your reviewer returns `continue`.**'),
        notOnRoundNine: has('not on round 2, not on round 9'),
        onlyContinueEndsIt: has('**Its `continue` is the only line that ends\nyour session**'),
        // `partial` still EXISTS as a signal shape — it is what a second refused signal earns — so
        // the table says where it lives rather than leaving its absence to read as an omission.
        partialIsNotHere: has('**`partial` is not on this table, and a `rework` never earns it.**'),
        andSaysWhereItIs: has(
          'The one thing that reaches\n`partial` is a second REFUSED signal — see Signalling below.',
        ),
        theTableCarriesExactlyTwoRows: SIGNAL_TABLE_VALUES,
        // The row carries the reviewer's text and nothing else, and it goes where every other
        // round's scope goes: into the next document. A red the reviewer could not fix is already
        // inside that text, because the reviewer is the session that ran the build and the ward.
        // This session has seen no check result all round.
        carriesTheTextIntoTheNextDocument: has(
          "writing that text into the new document's `## Rework` |",
        ),
        andAddsNothingToIt: has(
          "**Your reviewer's `rework` already carries any red it could not fix**",
        ),
        wallNeverReachesIt: has(
          'A `wall` never reaches this table. The table above already routed it.',
        ),
      }).toStrictEqual({
        doneRow: true,
        anotherRound: true,
        noCap: true,
        notOnRoundNine: true,
        onlyContinueEndsIt: true,
        partialIsNotHere: true,
        andSaysWhereItIs: true,
        theTableCarriesExactlyTwoRows: ['continue', 'rework'],
        carriesTheTextIntoTheNextDocument: true,
        andAddsNothingToIt: true,
        wallNeverReachesIt: true,
      });
    });
  });

  // Two server-side gates can refuse a `done`, and nothing is persisted when they do. A refusal is
  // not a dead end. But the refusal MESSAGE is the only copy of the outstanding units that exists,
  // so it goes into the document rather than into a brief — the same place the sweep paths go, and
  // for the same reason.
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

    // THE SECTION LEADS WITH WHAT A REFUSAL IS, not with what the gates measure. Its predecessor
    // described the gates in their own vocabulary — RECOMPUTED, review checklist, unit,
    // disposition, sign-off track — and every one of those words appears nowhere else in this
    // prompt, for a reader that has opened no file and holds no checklist. It also never said what
    // a refusal physically IS. Both gates THROW, so it comes back as a FAILED `signal-back` call
    // rather than a result, and an agent reads a thrown tool error as a crash and answers it by
    // retrying the identical call.
    it('VALID: the refusal path => says a refusal is a thrown error, bans the bare retry, and routes the two kinds apart', () => {
      expect({
        notBelieved: has('**The server does not take your word for `done`.**'),
        overTheWholeWorkItem: has(
          'over every commit YOUR WORK ITEM has made — every\nround of this session, not only the last one',
        ),
        // The one fact this session can ACT on: its reviewer writes both records and it cannot.
        theReviewerWritesBoth: has(
          '**Your reviewer writes both records. Nothing else does, and you cannot.**',
        ),
        arrivesAsAnError: has(
          '**A refusal arrives as an ERROR on the `signal-back` call itself.**',
        ),
        andIsNotACrash: has('**That is not a crash, not a bug and not something you retry.**'),
        nothingPersisted: has('**NOTHING is persisted on\na refusal**'),
        neverRepeatTheCall: has('**Never repeat the same call unchanged.**'),
        // Gate 0a wants another sweep, not a re-review — a reviewer dispatched at a dirty tree
        // finds nothing to settle and the second signal is refused identically.
        aDirtyTreeGoesBackToStepSix: has(
          '**If the message names UNCOMMITTED CHANGES, that is a dirty tree, not a missing record.** Go back to\nstep 6, sweep again, then signal again.',
        ),
        everythingElseIsAReReview: has(
          '**Otherwise:** APPEND a `## Re-review` section to the round document carrying that message\nVERBATIM, then dispatch ONE more `reviewer-minion` on `SECTION: Re-review`.',
        ),
        wordForWord: has(
          '**Word for word, because that message is the only copy that will ever exist.**',
        ),
        whyVerbatim: has('No tool hands the\nlist back a second time.'),
        twoStrikes: has('**A second refusal is `partial`.**'),
      }).toStrictEqual({
        notBelieved: true,
        overTheWholeWorkItem: true,
        theReviewerWritesBoth: true,
        arrivesAsAnError: true,
        andIsNotACrash: true,
        nothingPersisted: true,
        neverRepeatTheCall: true,
        aDirtyTreeGoesBackToStepSix: true,
        everythingElseIsAReReview: true,
        wordForWord: true,
        whyVerbatim: true,
        twoStrikes: true,
      });
    });
  });

  describe('minion dispatch protocol', () => {
    // THE FENCE IS THE WHOLE BRIEF GRAMMAR. A key this fence does not carry is a key no minion
    // template can read, and a key a minion reads that this fence never sends is an instruction
    // nobody can carry out. No brief uses every key: `SECTION:` REPLACES the `WAVE:`/`CHUNK:` pair,
    // which is why the section states an ORDER over the lines rather than a count of them.
    it('VALID: the brief fence => carries the fetch line and exactly four keys', () => {
      expect({
        keys: BRIEF_KEYS,
        theFirstTwoAreUniversal: has('The first two are in every brief.'),
        sectionReplacesThePair: has(
          '**`SECTION:`\nREPLACES the `WAVE:`/`CHUNK:` pair — no brief ever carries both.**',
        ),
        // The path is written RESOLVED. No minion can rebuild it: its fetch hands back no operation
        // item id, and nothing tells it which round the parent is on.
        thePathIsResolved: has(
          '**Write the `PLAN:` path RESOLVED — the real operation item id, the real round number.**',
        ),
        theFetchIsFirst: BRIEF_FENCE.includes(
          "Call get-agent-prompt({ agent: '<planner-minion|worker-minion|reviewer-minion>', questId: 'QUEST_ID', discipline: '$MY_DISCIPLINE' }) FIRST, then follow what it returns exactly.",
        ),
        thePlanPath: BRIEF_FENCE.includes(`PLAN: ${PLAN_PATH}`),
        waveIsWorkerOnly: BRIEF_FENCE.includes(
          'WAVE: <n>                     ← a worker on a plan chunk, always beside CHUNK',
        ),
        chunkIsWorkerOnly: BRIEF_FENCE.includes(
          'CHUNK: <n>                    ← a worker on a plan chunk, and nothing else',
        ),
        // Both `SECTION:` dispatches are a REVIEWER's now. The worker used to take the sweep.
        sectionIsReviewerOnly: BRIEF_FENCE.includes(
          'SECTION: Sweep | Re-review    ← a REVIEWER only: the step 6 sweep, or a re-review after a refused signal',
        ),
        noWorkItemId: has('**That fetch passes NO workItemId.'),
        disciplineRequired: has(
          'The `discipline` argument is REQUIRED, and without it the fetch\nis REFUSED.**',
        ),
        theDocumentIsTheOnlyContext: has(
          '**The round document is the ONLY quest context a minion gets.**',
        ),
        andTheFetchCarriesNothingElse: has(
          'Its own fetch hands back its method\nand the Quest ID and NOTHING else.',
        ),
      }).toStrictEqual({
        keys: ['PLAN', 'WAVE', 'CHUNK', 'SECTION'],
        theFirstTwoAreUniversal: true,
        sectionReplacesThePair: true,
        thePathIsResolved: true,
        theFetchIsFirst: true,
        thePlanPath: true,
        waveIsWorkerOnly: true,
        chunkIsWorkerOnly: true,
        sectionIsReviewerOnly: true,
        noWorkItemId: true,
        disciplineRequired: true,
        theDocumentIsTheOnlyContext: true,
        andTheFetchCarriesNothingElse: true,
      });
    });

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
      theDocumentCarriesTheScope: has('The round document already carries the scope itself'),
      namingItPermitsIt: has('**Your discipline permits a tool by naming it here.**'),
      // ALLOWED is a FLOOR and FORBIDDEN is the CEILING. The predecessor only asserted that no pack
      // would ever name a FORBIDDEN tool — a claim about the packs rather than an instruction,
      // which left the reader holding a contradiction with no move to make.
      allowedIsAFloor: has('**Neither has to appear on the ALLOWED list above. Run it anyway.**'),
      andAToolOnNeitherListIsFine: has(
        'A tool on neither list is yours to run too, as long as your discipline named it.',
      ),
      forbiddenIsAWall: has(
        '**A tool your discipline names that the FORBIDDEN list DENIES is a WALL.**',
      ),
      andTheWallIsSignalledBeforeAnyDispatch: has(
        'Dispatch nothing. Signal\n`blocked` as the only action of your turn',
      ),
      // Signalling `blocked` this early skips the step 6 sweep, so the section says why that is
      // safe rather than leaving it to read as a contradiction of [CLEAN TREE].
      andSaysWhyTheTreeIsAlreadyClean: has(
        'Your tree is already clean, because you have run nothing.',
      ),
    }).toStrictEqual({
      twoFields: true,
      namesBoth: true,
      restIsInTheMinions: true,
      wouldOnlyBeForwarding: true,
      theDocumentCarriesTheScope: true,
      namingItPermitsIt: true,
      allowedIsAFloor: true,
      andAToolOnNeitherListIsFine: true,
      forbiddenIsAWall: true,
      andTheWallIsSignalledBeforeAnyDispatch: true,
      andSaysWhyTheTreeIsAlreadyClean: true,
    });
  });

  // ============================================================================================
  // CROSS-FILE AGREEMENTS. Each test below spans THIS file and one of the three minion templates,
  // and builds its needle out of the OTHER file's live value. Nothing type-checks a brief, a plan
  // fence or a `NEXT:` line, so a reword on either side used to pass ward in silence. It now fails
  // one test that names both sides.
  // ============================================================================================
  describe('agreements with the three minions this session dispatches', () => {
    // SPANS planner-minion-statics.ts ↔ this file. The planner OWNS the plan format and the
    // document path; this template creates the file at that path, reads it back, and names it in
    // every brief. Rename the file in the planner alone and this session writes its context
    // somewhere the planner never looks; rename a chunk field and step 4 promises a worker a
    // section made of fields the plan does not carry.
    it('VALID: {planner plan format, script} => this session reads the WAVES index, names no chunk field, and uses the path the planner commits', () => {
      expect({
        // The `WAVES:` index is the ONE thing step 3 takes out of the plan, so both templates have
        // to spell it identically. Derived from the planner's own fence, never copied.
        thePlannerWritesAnIndexCalled: PLAN_WAVES_KEY,
        stepThreeReadsThatSameIndex: has(
          `Under \`## Plan\` your planner left a\n\`${PLAN_WAVES_KEY}:\` index`,
        ),
        andDispatchesInItsOrder: has(
          `**4. Dispatch \`worker-minion\`s WAVE BY WAVE, in \`${PLAN_WAVES_KEY}:\` order.**`,
        ),
        // The zero-chunk index is a literal both sides must spell the same way. An empty heading
        // reads here as a plan that failed to parse, and this session has no branch for that.
        theEmptyIndexHere: has(`**\`${PLAN_WAVES_KEY}: none\` dispatches zero workers.**`),
        theEmptyIndexInThePlanner: PLANNER.includes(
          `its index reads \`${PLAN_WAVES_KEY}: none\` on ONE line`,
        ),
        // THIS SESSION NAMES NO CHUNK FIELD AT ALL. It never opens a chunk: step 3 takes the index
        // and step 4 sends two numbers. A field named here would be one this session was expected
        // to read out of a section it may not act on.
        chunkFieldsThePlannerWrites: PLAN_CHUNK_FIELDS,
        chunkFieldsThisSessionNames: PLAN_CHUNK_FIELDS.filter((field) => has(field)),
        allowedTableWritesExactlyThatPath: ALLOWED.includes(`Write on ${PLAN_PATH} `),
        allowedTableReadsExactlyThatPath: ALLOWED.includes(`Read on ${PLAN_PATH} `),
        stepOneWritesThatPath: has(`The path is \`${PLAN_PATH}\` —`),
        theBriefFenceNamesThatPath: BRIEF_FENCE.includes(`PLAN: ${PLAN_PATH}`),
        plannerReturnsThatSamePath: PLANNER.includes(`PLAN: ${PLAN_PATH} — <count> chunks`),
      }).toStrictEqual({
        thePlannerWritesAnIndexCalled: 'WAVES',
        stepThreeReadsThatSameIndex: true,
        andDispatchesInItsOrder: true,
        theEmptyIndexHere: true,
        theEmptyIndexInThePlanner: true,
        chunkFieldsThePlannerWrites: ['INTENT', 'FILES', 'UNITS', 'MIRROR', 'NOTES'],
        chunkFieldsThisSessionNames: [],
        allowedTableWritesExactlyThatPath: true,
        allowedTableReadsExactlyThatPath: true,
        stepOneWritesThatPath: true,
        theBriefFenceNamesThatPath: true,
        plannerReturnsThatSamePath: true,
      });
    });

    // SPANS all three minion templates ↔ the section headings this template names. The document is
    // the ONLY channel between the four sessions of a round, so a heading this session writes that
    // no minion reads is a section nobody opens, and a heading a minion reads that this session
    // never writes is an instruction to open something that is not there.
    it('VALID: {document sections, the three minion templates} => every section this session names has a reader', () => {
      expect({
        sectionsThisSessionNames: DOCUMENT_SECTIONS,
        sectionsWithNoMinionReader: Object.entries(SECTION_READERS)
          .filter(([, readers]) => readers.length === 0)
          .map(([section]) => section),
        everySectionAndItsReaders: SECTION_READERS,
      }).toStrictEqual({
        sectionsThisSessionNames: [
          '## Context',
          '## Plan',
          '## Re-review',
          '## Rework',
          '## Sweep',
        ],
        sectionsWithNoMinionReader: [],
        everySectionAndItsReaders: {
          '## Context': ['planner', 'worker', 'reviewer'],
          '## Plan': ['planner', 'worker', 'reviewer'],
          '## Re-review': ['reviewer'],
          '## Rework': ['planner', 'reviewer'],
          // BOTH sweep dispatches are a reviewer's. The worker used to sort the paths with a
          // reviewer behind it to commit; a worker commits nothing, so that split always handed
          // back a dirty tree.
          '## Sweep': ['reviewer'],
        },
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

    // SPANS reviewer-minion-statics.ts ↔ the signal table. That table reads the REVIEWER's line and
    // nothing else, so its first column is a claim about what that one template can write. The
    // reviewer has three values and this table has rows for two: the third is routed by the table
    // above, and the sentence under this one is what says so. Drop that sentence, or let the reviewer
    // grow a fourth value, and one of the two tables stops covering its own input.
    it('VALID: {reviewer NEXT vocabulary, signal table} => it signals on every reviewer value it is the last reader of', () => {
      const routedEarlier = REVIEWER_NEXT.filter((value) => !SIGNAL_TABLE_VALUES.includes(value));

      expect({
        reviewerValuesTheSignalTableHasNoRowFor: routedEarlier.length,
        andTheTemplateSaysWhereEachOfThemWent: routedEarlier.every((value) =>
          has(`A \`${value}\` never reaches this table. The table above already routed it.`),
        ),
        theTableAboveDoesRouteThem: routedEarlier.filter((value) => !ROUTED_VALUES.includes(value)),
        signalRowsWithNoReviewerValueBehindThem: SIGNAL_TABLE_VALUES.filter(
          (value) => !REVIEWER_NEXT.includes(value),
        ),
        onlyTheReviewersLineDecides: has("**Only your REVIEWER's line decides the round.**"),
        theReviewerIsToldTheSame: REVIEWER.includes('**Your last line decides the round.**'),
        andThatItSupersedesEveryWorkerLine: REVIEWER.includes('Yours SUPERSEDES all of them.'),
        theWorkerIsToldItsOwnLineGoesToTheReviewer: WORKER.includes(
          '**Your parent does not act on this.** Your REVIEWER settles',
        ),
      }).toStrictEqual({
        reviewerValuesTheSignalTableHasNoRowFor: 1,
        andTheTemplateSaysWhereEachOfThemWent: true,
        theTableAboveDoesRouteThem: [],
        signalRowsWithNoReviewerValueBehindThem: [],
        onlyTheReviewersLineDecides: true,
        theReviewerIsToldTheSame: true,
        andThatItSupersedesEveryWorkerLine: true,
        theWorkerIsToldItsOwnLineGoesToTheReviewer: true,
      });
    });

    // SPANS the brief fence here ↔ all three minion templates. A minion's own fetch hands back its
    // method and the Quest ID and nothing else, and every other id it needs is read out of the
    // document's `## Context`. So a SHOUTY placeholder id named in a minion prompt has to be one
    // this fence sends; the reviewer's `get-blight-checklist` call is the one that depends on it.
    it('VALID: {brief fence, the three minion templates} => no minion names a placeholder id this fence does not carry', () => {
      expect({
        briefKeys: BRIEF_KEYS.length,
        idsThePlannerNamesAndThisFenceLacks: PLANNER_IDS.filter(
          (token) => !BRIEF_FENCE.includes(token),
        ),
        idsTheWorkerNamesAndThisFenceLacks: WORKER_IDS.filter(
          (token) => !BRIEF_FENCE.includes(token),
        ),
        idsTheReviewerNamesAndThisFenceLacks: REVIEWER_IDS.filter(
          (token) => !BRIEF_FENCE.includes(token),
        ),
        theReviewerReallyDoesNameOne: REVIEWER_IDS.length,
        andItsChecklistCallIsWhatNeedsIt: REVIEWER.includes(
          `get-blight-checklist({ questId: '${REVIEWER_FIRST_ID}'`,
        ),
        // The work item id is NOT a placeholder in any minion prompt. It reaches the reviewer as a
        // real value, read off `## Context`, because a UUID retyped by hand is a REJECTED write.
        theReviewerReadsTheWorkItemIdOffTheDocument: REVIEWER.includes(
          '**`## Context` carries the three ids**',
        ),
      }).toStrictEqual({
        briefKeys: 4,
        idsThePlannerNamesAndThisFenceLacks: [],
        idsTheWorkerNamesAndThisFenceLacks: [],
        idsTheReviewerNamesAndThisFenceLacks: [],
        theReviewerReallyDoesNameOne: 1,
        andItsChecklistCallIsWhatNeedsIt: true,
        theReviewerReadsTheWorkItemIdOffTheDocument: true,
      });
    });
  });
});
