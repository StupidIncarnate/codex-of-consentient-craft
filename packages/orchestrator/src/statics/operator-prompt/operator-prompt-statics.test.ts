import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { slotManagerStatics } from '../slot-manager/slot-manager-statics';
import { operatorPromptStatics } from './operator-prompt-statics';

const { template } = operatorPromptStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

// The template minus the embedded operating-rules block: the half this file is responsible for.
const authored = template.split(agentOperatingRulesStatics.operatorMarkdown).join('');

// The FORBIDDEN fence is where a tool name is ALLOWED to appear. Everything outside it is where a
// mention would read as a grant.
const TOOL_TABLE = template.slice(
  template.indexOf('ALLOWED — this is the whole list'),
  template.indexOf('```', template.indexOf('FORBIDDEN — no exceptions')),
);

// This is a FORCING FUNCTION, not the protocol ceiling. `mcpToolResultStatics.maxVerbatimChars` is
// the ceiling and is pinned separately below; this number is what says everything discipline-specific
// belongs in a pack rather than here, and everything that requires WEIGHING evidence belongs in the
// prompt of the minion that holds the evidence.
//
// It came DOWN from 18,500 when the script replaced the nine-gate loop. What left: the
// expected-versus-unexpected red protocol (an inference from three indirect sources), the `--only`
// narrowing rule (a folder-type map this session's own tool table denies it), the `UNFIXABLE`
// routing paragraph (a classification the minion that hit the wall can make and this one cannot),
// the pivot rule, and the merge of three control channels at the last gate. Each of those was
// script mechanics by the old test and a JUDGEMENT by this one, and the second test is the one that
// matters: a session that has to weigh rather than look up is a session that guesses.
//
// The test for RAISING it is not "is there room under 50k" (there always is). It is: is what you are
// adding identical for all five disciplines, and can the operator ACT on it by lookup? Two noes mean
// it belongs in a pack or in a minion.
// Currently 13,196. It went UP ~770 from the first cut of this script, and every character of that
// is step 3 telling the operator to copy its WHOLE Operation Context and saying why. That is the
// trade this budget is meant to price: the sentence it replaced was shorter, named a "scope block"
// that exists for one role out of five, and left the other four picking lines out of a context they
// are forbidden to read. A longer instruction that removes a judgement is what this number is for.
const BUDGET_CHARS_EXCLUDING_OPERATING_RULES = 13_500;

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

  // `$DISCIPLINE` is substituted with the pack's authored MARKDOWN and `$MY_DISCIPLINE` with the
  // bare discipline id, by two independent `.replace` calls in two separate resolvers. If one token
  // were a PREFIX of the other — `$DISCIPLINE_NAME` and `$DISCIPLINE_ID` both are — the pack
  // substitution would match the prefix first and leave `<whole pack markdown>_NAME` behind. The
  // next person to rename one of these has no way to know that from the call sites, so it is pinned
  // here: neither token may contain the other, in either direction.
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

    // `$MY_DISCIPLINE` appears MORE THAN ONCE and every occurrence must resolve — it is quoted into
    // the `get-agent-prompt` call this session's minions must make, into the header every brief
    // opens with, and into the discipline heading. A resolver reaching for `.replace(token, fn)`
    // substitutes the FIRST match only, and the survivors reach the agent as the literal string;
    // every minion it then dispatches fetches with `$MY_DISCIPLINE` as its discipline and is
    // refused. Both resolvers use `split`/`join` for exactly this reason, and their colocated tests
    // assert zero unresolved tokens in the served prompt.
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

  // This role runs NO ward, so it takes the operating-rules variant whose rule 3 is the negation of
  // the scoping rule the other three carry. Embedding any other variant hands it back a command its
  // own FORBIDDEN table takes away.
  it('VALID: template => embeds the operator operating-rules variant and no other', () => {
    expect({
      operatorVariant: has(agentOperatingRulesStatics.operatorMarkdown),
      workItemVariant: has(agentOperatingRulesStatics.markdown),
      delegatingMinionVariant: has(agentOperatingRulesStatics.delegatingMinionMarkdown),
      leafMinionVariant: has(agentOperatingRulesStatics.leafMinionMarkdown),
    }).toStrictEqual({
      operatorVariant: true,
      workItemVariant: false,
      delegatingMinionVariant: false,
      leafMinionVariant: false,
    });
  });

  // The whole design rests on this session's context never filling up, and the table is what buys
  // that. A post-mortem measured the prose version of the same rule being the version that got
  // dropped: one operator ran 217 turns with zero `Agent` calls and wrote all 27 of its own sign-offs.
  describe('the tool surface', () => {
    it('VALID: ALLOWED list => is exactly the commands and calls the script uses', () => {
      expect({
        build: TOOL_TABLE.includes('npm run build                                  ← step 1'),
        status: TOOL_TABLE.includes(
          'git status                                     ← steps 2 and 7',
        ),
        push: TOOL_TABLE.includes('git push                                       ← step 8, bare'),
        readOnlyThePlan: TOOL_TABLE.includes(
          'Read on .quest-plans/round-<n>.md              ← step 4, that ONE path and no other',
        ),
        agent: TOOL_TABLE.includes('Agent(planner-minion | worker-minion | reviewer-minion)'),
        signalBack: TOOL_TABLE.includes('signal-back                                    ← step 9'),
        disciplineMayOpenIt: TOOL_TABLE.includes(
          'whatever your discipline names below           ← a server it owns, its own reset lever',
        ),
      }).toStrictEqual({
        build: true,
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
        ward: TOOL_TABLE.includes(
          'npm run ward                                   ← your REVIEWER runs it',
        ),
        qaChecklist: TOOL_TABLE.includes(
          'get-qa-checklist                               ← your PLANNER fetches it',
        ),
        blightChecklist: TOOL_TABLE.includes(
          'get-blight-checklist                           ← your REVIEWER fetches it',
        ),
        search: TOOL_TABLE.includes(
          'discover · get-project-map · get-project-inventory · get-folder-detail',
        ),
        standards: TOOL_TABLE.includes(
          'get-architecture · get-syntax-rules · get-testing-patterns',
        ),
        quest: TOOL_TABLE.includes('get-quest · get-quest-planning-notes · modify-quest'),
        gitHistory: TOOL_TABLE.includes('git log / git diff / git show'),
        gitWrite: TOOL_TABLE.includes('git add / git commit'),
        gitDestructive: TOOL_TABLE.includes('git stash / git reset / git checkout --'),
        writingAnything: TOOL_TABLE.includes(
          'writing code, a test, a plan, a sign-off or a verdict',
        ),
        judging: TOOL_TABLE.includes('judging whether code is CORRECT'),
      }).toStrictEqual({
        readWrite: true,
        ward: true,
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

    // A forbidden tool named anywhere but the fence reads as a GRANT — that is how the operator's
    // predecessor ended up with `modify-quest` in its ALLOWED list with no step that used it, and
    // with a `get-blight-checklist` annotation crediting the wrong minion. The scope here is the
    // AUTHORED half minus the fence: the embedded operating rules legitimately name `npm run ward`
    // (as the thing the reviewer runs) and `git commit` (in rule 5's denied-command example), and
    // this file does not own that text.
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
        ward: outsideFenceAndRules.includes('npm run ward'),
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
        ward: false,
      });
    });
  });

  // Nine steps, numbered contiguously. A step that goes missing changes what the session does and
  // fails nothing at runtime — every predecessor of this template lost or renumbered one at least
  // once.
  describe('the script', () => {
    it('VALID: template => numbers its steps 1 through 9, contiguously, and says so in the heading', () => {
      const scriptSection = template.slice(
        template.indexOf('## The script'),
        template.indexOf('## The NEXT table'),
      );

      expect({
        steps: Array.from(scriptSection.matchAll(/^\*\*(\d)\./gmu)).map((match) => match[0]),
        saysNine: scriptSection.includes('Nine steps. Run them in order.'),
        noAdding: scriptSection.includes('Do not skip one, do not reorder them, do not add one.'),
      }).toStrictEqual({
        steps: ['**1.', '**2.', '**3.', '**4.', '**5.', '**6.', '**7.', '**8.', '**9.'],
        saysNine: true,
        noAdding: true,
      });
    });

    it('VALID: steps 1 and 2 => collect output the session is explicitly told NOT to act on', () => {
      expect({
        buildUnpiped: has('Its own command, unpiped, with nothing chained after it'),
        buildNotActedOn: has('**Do not act on it**; you are going to paste\nit into step 3.'),
        onlyBuilder: has('**You are the only session on this quest that ever runs this command**'),
        statusNotActedOn: has('Do not act on it either — it goes into step 3 as well.'),
      }).toStrictEqual({
        buildUnpiped: true,
        buildNotActedOn: true,
        onlyBuilder: true,
        statusNotActedOn: true,
      });
    });

    // The predecessor said "copy your Operation Context's SCOPE BLOCK". No such labelled block
    // exists: `workItemToPromptTransformer` splices `codeweaverScopeBlockTransformer`'s output for
    // `codeweaver` ALONE, under headings of its own (`Your nodes`, `Must satisfy`, `Contracts you
    // own`, `Seams`), and the other four operator roles get no scope block at all. So four of five
    // operators were told to copy something absent, and the fifth had to guess which lines counted.
    // Copying the WHOLE context removes the question — it is bounded by the same MCP ceiling the
    // rest of the prompt is, and this session cannot read it well enough to choose.
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
        forbiddenToRead: has('judgement about material you are forbidden to read'),
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

    it('VALID: steps 4 and 5 => read one file, then dispatch one worker per chunk in the plan order', () => {
      expect({
        readsThePlanFile: has('`Read` the path its return names — `.quest-plans/round-<n>.md`'),
        onlyFileAllSession: has('This is the\none file you open all session.'),
        orderIsDispatchOrder: has(
          'the order they are listed in is the order\nthey are dispatched in',
        ),
        onePerChunk: has("**5. Dispatch `worker-minion`s, ONE PER CHUNK, in the plan's order.**"),
        chunkVerbatim: has("that chunk's whole section of the plan file, copied verbatim"),
        zeroChunksIsLegal: has('**A plan with zero chunks dispatches zero workers.**'),
      }).toStrictEqual({
        readsThePlanFile: true,
        onlyFileAllSession: true,
        orderIsDispatchOrder: true,
        onePerChunk: true,
        chunkVerbatim: true,
        zeroChunksIsLegal: true,
      });
    });

    // Those returns live ONLY in this session's context — not on the quest, not in git — and grading
    // them against disk is the reviewer's whole job. Summarising them makes this session the grader,
    // which is the one thing it structurally cannot be.
    it('VALID: step 6 => hands the reviewer every worker return verbatim, and says why a summary is disqualifying', () => {
      expect({
        planPath: has('PLAN: .quest-plans/round-<n>.md'),
        verbatimReturns: has('<every worker return from step 5, VERBATIM and in dispatch order>'),
        nowhereElse: has('Those returns exist NOWHERE else — not on the quest, not in git'),
        summarisingGrades: has(
          '**Summarise them and you have graded them yourself**, which is\nthe one thing you cannot do.',
        ),
      }).toStrictEqual({
        planPath: true,
        verbatimReturns: true,
        nowhereElse: true,
        summarisingGrades: true,
      });
    });

    // `signal-back` refuses every outcome while the tree is dirty, and this session may not commit,
    // so a one-worker sweep is the ONLY remedy inside the script for an untracked file no chunk owns.
    it('VALID: step 7 => sweeps a dirty tree through ONE worker and blocks if it survives that', () => {
      expect({
        doNotCommitIt: has('**Do not\ncommit it yourself**: you cannot see what it is.'),
        oneWorker: has(
          'Dispatch ONE `worker-minion` whose whole brief is\nthe header plus those paths',
        ),
        decidesPerPath: has(
          'it opens them, commits what is work, deletes what is scratch, and\nreturns',
        ),
        oneSweepThenBlock: has(
          '**Still dirty after that one sweep → signal `blocked`,\nnaming the paths.**',
        ),
      }).toStrictEqual({
        doNotCommitIt: true,
        oneWorker: true,
        decidesPerPath: true,
        oneSweepThenBlock: true,
      });
    });

    // The push is what makes the NEXT round measurable: the reviewer scopes both its ward
    // (`--staged`) and its review (`scope: 'unpushed'`) to what origin does not have, so a round that
    // never got pushed is a round the next reviewer reads as its own.
    it('VALID: step 8 => pushes bare and names what the push buys the next round', () => {
      expect({
        bare: has('Bare — no branch, no `-u`, no flags.'),
        alreadyTracking: has(
          'The branch was made to track its upstream\nwhen the quest was carved.',
        ),
        makesNextRoundMeasurable: has('**This push is what makes the next round measurable**'),
        bothScopes: has(
          'your reviewer\nscopes both its ward and its review to what is committed and not yet pushed',
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
  describe('the NEXT table is the only decision the session makes', () => {
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
        wallRow: has('| `wall` | **STOP dispatching.** Go straight to step 7, then step 8'),
        wallNamesUndispatched: has('plus every chunk you had not dispatched yet'),
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

    // A worker's `rework` is a CLAIM about its own chunk. The reviewer reads every worker return AND
    // opens the files, so it is the session that settles it — which is what reduces the operator's
    // last step from a synthesis of three channels to a lookup on one line.
    it('VALID: template => says continue and rework do the same thing, and that only the reviewer decides', () => {
      expect({
        deliberatelyIdentical: has('**`continue` and `rework` do the same thing, deliberately.**'),
        workerClaimIsAClaim: has("A worker's claim that its chunk is\nunfinished is a CLAIM"),
        reviewerSettlesIt: has('the session that settles it is your reviewer'),
        onlyReviewerDecides: has("**Only your REVIEWER's line decides the\nround.**"),
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
          `| \`rework\`, and fewer than ${cap} rounds are spent | no signal — round + 1, back to step 1`,
        ),
        carriesTheText: has("with that text as the next planner's `REWORK:` |"),
        partialRow: has(
          `| \`rework\`, and ${cap} rounds are spent | \`partial\`, with that text as your reason |`,
        ),
        wallNeverReachesIt: has('A `wall` never reaches this table — it exited at the one above.'),
      }).toStrictEqual({
        doneRow: true,
        anotherRound: true,
        carriesTheText: true,
        partialRow: true,
        wallNeverReachesIt: true,
      });
    });
  });

  // Two server-side gates can refuse a `done`, and nothing is persisted when they do. A refusal is a
  // dispatch, not a dead end — but the re-review has to be told BOTH that its usual not-yet-pushed
  // window is empty and that the round is already published, or it enumerates nothing, dispositions
  // nothing, and earns the identical refusal.
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
        recomputed: has('**`done` is RECOMPUTED, not believed'),
        nothingPersisted: has('**NOTHING is persisted on a refusal**'),
        refusalVerbatim: has('REFUSAL: <the refusal message, verbatim>'),
        questScope: has('SCOPE: quest'),
        skipWard: has('SKIP WARD: this round is already pushed'),
        whyQuestScope: has(
          "You pushed at step 8, so the reviewer's usual\nnot-yet-pushed window is EMPTY",
        ),
        twoStrikes: has('**A second refusal is `partial`**'),
      }).toStrictEqual({
        recomputed: true,
        nothingPersisted: true,
        refusalVerbatim: true,
        questScope: true,
        skipWard: true,
        whyQuestScope: true,
        twoStrikes: true,
      });
    });
  });

  describe('minion dispatch protocol', () => {
    it('VALID: template => fixes a model per minion and names the expensive downgrade', () => {
      expect({
        subagentType: has('`subagent_type: "general-purpose"`'),
        planner: has('`planner-minion` → `model: "opus"`'),
        worker: has('`worker-minion` → `model: "sonnet"`'),
        reviewer: has('`reviewer-minion` → `model: "opus"`'),
        downgradeWarning: has('Downgrading the reviewer is the expensive mistake'),
      }).toStrictEqual({
        subagentType: true,
        planner: true,
        worker: true,
        reviewer: true,
        downgradeWarning: true,
      });
    });

    it('VALID: template => bans two Agent calls in one message and names the shared dist as the cause', () => {
      expect({
        ban: has('**Never two `Agent` calls in one assistant message.**'),
        cause: has(
          'concurrent\nminions corrupt the shared `dist/` and hand each other phantom failures',
        ),
        serialShape: has('One call, wait for it, then the next.'),
      }).toStrictEqual({ ban: true, cause: true, serialShape: true });
    });

    // A minion's own fetch returns its method and the Quest ID and nothing else, while the sign-off
    // and disposition contracts each REQUIRE a uuid-validated id only the parent holds — so an
    // omission does not degrade a write, it REJECTS one, and step 9's `done` is then refused with
    // nothing on the quest to show why.
    it('VALID: template => mandates the brief header and names what a missing id costs', () => {
      expect({
        minionFetch: has(
          "get-agent-prompt({ agent: 'planner-minion', questId: 'QUEST_ID', discipline: '$MY_DISCIPLINE' })",
        ),
        noWorkItemId: has('minion-fetch, **NO workItemId**'),
        disciplineRequired: has(
          '**The `discipline` argument is REQUIRED and the fetch is REFUSED without it**',
        ),
        headerIds: has(
          'Quest ID: QUEST_ID · Work Item ID: WORK_ITEM_ID · Operation Item ID: OPERATION_ITEM_ID',
        ),
        headerRoundAndPlan: has(
          'discipline: $MY_DISCIPLINE · round: <n> · plan file: .quest-plans/round-<n>.md',
        ),
        rejectedNotDegraded: has('an omitted id does not degrade — the write is REJECTED'),
      }).toStrictEqual({
        minionFetch: true,
        noWorkItemId: true,
        disciplineRequired: true,
        headerIds: true,
        headerRoundAndPlan: true,
        rejectedNotDegraded: true,
      });
    });

    // `workItemToPromptTransformer` injects a per-role caveat under `Your flows:` and
    // `Your packages:` — for a sign-off-track role it reads "YOUR unit of accountability" and "YOUR
    // coverage slice", because that IS what its completion gate measures. A template line saying
    // those are "NOT scope" contradicts the injected line on the same screen, so the distinction has
    // to be the one that is actually true: they ARE the scope, they are not an ARGUMENT.
    it('VALID: template => calls the flows and packages the scope, and only denies they are an argument', () => {
      expect({
        theyAreTheScope: has("**Your flows and packages ARE your item's scope**"),
        contextSaysSo: has('your Operation Context says so on the line under\neach'),
        gateMeasuresThem: has('that gate measures against exactly them'),
        notAnArgument: has('What\nthey are NOT is an ARGUMENT'),
        noMinionCanWiden: has('so no minion can widen or\nnarrow anything by how it passes them'),
        whatTheyBuy: has('Naming them in a brief buys SEARCH'),
        noContradiction: has('are NOT scope arguments'),
      }).toStrictEqual({
        theyAreTheScope: true,
        contextSaysSo: true,
        gateMeasuresThem: true,
        notAnArgument: true,
        noMinionCanWiden: true,
        whatTheyBuy: true,
        noContradiction: false,
      });
    });
  });

  // The pack's operator block is TWO fields. It was four: `SCOPE` duplicated `Your operation item:`
  // / `Your flows:` / `Your packages:` from `$ARGUMENTS`, which are generated from live quest data
  // and therefore cannot drift from it the way pack prose can; `EMPTY` duplicated the script's own
  // "a plan with zero chunks dispatches zero workers". What is left is the only two things a session
  // that opens no file can act on, and four of the five packs answer both with "none".
  it('VALID: the discipline section => announces two fields and grants a discipline-named tool', () => {
    expect({
      twoFields: has('**Two fields, and most disciplines have neither.**'),
      namesBoth: has(
        'the one long-running RESOURCE this discipline owns, and the\none RESET lever it pulls between workers',
      ),
      restIsInTheMinions: has(
        "Everything else your discipline has to say is written into\nyour minions' own prompts",
      ),
      wouldOnlyBeForwarding: has('you would only be forwarding it'),
      contextCarriesTheScope: has('your Operation Context already carries the scope itself'),
      namingIsTheGrant: has('**Naming a tool here IS the grant.**'),
      forbiddenIsAbsolute: has(
        'What none may ever do is hand you back something the\nFORBIDDEN list names.',
      ),
    }).toStrictEqual({
      twoFields: true,
      namesBoth: true,
      restIsInTheMinions: true,
      wouldOnlyBeForwarding: true,
      contextCarriesTheScope: true,
      namingIsTheGrant: true,
      forbiddenIsAbsolute: true,
    });
  });
});
