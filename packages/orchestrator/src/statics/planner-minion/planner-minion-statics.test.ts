import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { operatorPromptStatics } from '../operator-prompt/operator-prompt-statics';
import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { workerMinionStatics } from '../worker-minion/worker-minion-statics';
import { plannerMinionStatics } from './planner-minion-statics';

const { template } = plannerMinionStatics.prompt;

const has = (needle: string): boolean => template.includes(needle);

// ================================================================================================
// CROSS-FILE DERIVATIONS. Every needle built below comes out of the OTHER module's live value. A
// hardcoded copy of the other side's prose drifts exactly the way the prose drifts, and a test that
// holds a stale copy goes quiet at the moment it should have failed.
// ================================================================================================
const OPERATOR = operatorPromptStatics.prompt.template;
const WORKER = workerMinionStatics.prompt.template;
const REVIEWER = reviewerMinionStatics.prompt.template;

// The operator's brief fence — the WHOLE grammar of every brief it writes. This session's `PLAN:`
// path arrives there and nothing else does.
const BRIEF_FENCE_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf(
    '**A brief takes the lines below that\napply to it, in the order they appear here.**',
  ),
);
const OPERATOR_BRIEF_FENCE = OPERATOR.slice(
  BRIEF_FENCE_OPENS + 3,
  OPERATOR.indexOf('```', BRIEF_FENCE_OPENS + 3),
);
const BRIEF_PLAN_PATH =
  /PLAN: (\S+)/u.exec(OPERATOR_BRIEF_FENCE)?.[1] ?? 'THE BRIEF FENCE NAMES NO PLAN PATH';

// The document fence the operator WRITES at its step 1 — the two sections this session reads back.
const CONTEXT_FENCE_OPENS = OPERATOR.indexOf(
  '```',
  OPERATOR.indexOf('**1. WRITE the round document'),
);
const OPERATOR_CONTEXT_FENCE = OPERATOR.slice(
  CONTEXT_FENCE_OPENS + 3,
  OPERATOR.indexOf('```', CONTEXT_FENCE_OPENS + 3),
);
const OPERATOR_WRITTEN_SECTIONS = Array.from(
  OPERATOR_CONTEXT_FENCE.matchAll(/^(## [A-Z][A-Za-z -]*)$/gmu),
).map((match) => match[1] ?? '');

// The sections THIS session reads back, off the table at the top of its own template.
const BRIEF_TABLE = template.slice(
  template.indexOf('| Section | What it holds |'),
  template.indexOf('**No section tells you the state of the tree.'),
);
const SECTIONS_THIS_SESSION_READS = Array.from(BRIEF_TABLE.matchAll(/^\| `(## [^`]+)`/gmu)).map(
  (match) => match[1] ?? '',
);

// The operator's routing table: the only reader of any minion's `NEXT:` line.
const OPERATOR_ROUTED_VALUES = Array.from(
  OPERATOR.slice(
    OPERATOR.indexOf('| The line says | You do |'),
    OPERATOR.indexOf('**`continue` and `rework` do the same thing'),
  ).matchAll(/^\| `([a-z]+)` \|/gmu),
).map((match) => match[1] ?? '');

// Each template's own `NEXT:` vocabulary — one value per line here, the whole menu on ONE line in
// the worker and the reviewer.
const [NEXT_VALUES = [], WORKER_NEXT = [], REVIEWER_NEXT = []] = [template, WORKER, REVIEWER].map(
  (source) =>
    source
      .split('\n')
      .filter((line) => line.startsWith('NEXT:'))
      .flatMap((line) => line.slice('NEXT:'.length).split('|'))
      .map((arm) => arm.trim().split(' ')[0] ?? '')
      .filter((word) => word !== ''),
);
const VALUES_ROUTED_BUT_NOT_THIS_SESSIONS = OPERATOR_ROUTED_VALUES.filter(
  (value) => !NEXT_VALUES.includes(value),
);

// The commit subjects Method step 5 sends this session into the log for. BOTH are written by the
// reviewer now: no worker commits anything, because a wave of them runs at once.
const REVIEWER_SUBJECTS = Array.from(REVIEWER.matchAll(/subject\s+`([^`]+)`/gu)).map(
  (match) => match[1] ?? '',
);
const ROUND_SUBJECT_CLAIM =
  /commits its whole round under\s+`([^`]+)`/u.exec(template)?.[1] ??
  'THIS TEMPLATE CLAIMS NO ROUND SUBJECT';
const REVIEW_SUBJECT_CLAIM =
  /then its verdict under\s+`([^`]+)`/u.exec(template)?.[1] ??
  'THIS TEMPLATE CLAIMS NO REVIEW SUBJECT';
const CLAIMED_SUBJECT_PREFIXES = [ROUND_SUBJECT_CLAIM, REVIEW_SUBJECT_CLAIM].map((claim) =>
  claim.slice(0, claim.indexOf(':') + 2),
);

// The format rules state their own count in WORDS, and the LIST is the authority. Both sides are
// parsed rather than written down, so a rule added with the sentence left alone fails here.
const COUNT_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
];
const FORMAT_RULES = template.slice(
  template.indexOf('rules govern that format'),
  template.indexOf('**A plan with ZERO chunks'),
);
const FORMAT_RULES_LISTED = (FORMAT_RULES.match(/^- \*\*/gmu) ?? []).length;
const FORMAT_RULES_CLAIMED = COUNT_WORDS.indexOf(
  (/(?<word>\w+) rules govern that format/u.exec(template)?.groups?.word ?? '').toLowerCase(),
);

describe('plannerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(plannerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries $DISCIPLINE once and $ARGUMENTS once, with $ARGUMENTS last', () => {
    expect({
      disciplineCount: template.split('$DISCIPLINE').length - 1,
      argumentsCount: template.split('$ARGUMENTS').length - 1,
      disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
      disciplineComesFirst: template.indexOf('$DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      questIdHeading: /^## The quest id — everything else is in the round document$/mu.test(
        template,
      ),
    }).toStrictEqual({
      disciplineCount: 1,
      argumentsCount: 1,
      disciplineOnItsOwnLine: true,
      disciplineComesFirst: true,
      argumentsIsTheTail: true,
      questIdHeading: true,
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE BRIEF IS A PATH. Its predecessor was handed the operator's whole Operation Context pasted
  // into the spawn message, which doubled that text inside the one session forbidden to open the
  // file that would have shown a dropped line. The table at the top of this template is what makes
  // the path readable: it names each section and what that section holds.
  it('VALID: the opening => names the document, its sections, and what is NOT in any of them', () => {
    expect({
      theBriefIsAPath: has('**Your brief is a PATH.**'),
      andItNamesTheDocument: has(
        'Its `PLAN:` line names the round document, which your parent created\nbefore it summoned you. Everything you were given is in that file:',
      ),
      theTitleCarriesTheRoundNumber: BRIEF_TABLE.includes(
        "| `# Round <n> — …` | the round number, and your parent's operation item text |",
      ),
      contextIsTheWholeOperationContext: BRIEF_TABLE.includes(
        "| `## Context` | your parent's ENTIRE Operation Context, verbatim",
      ),
      reworkIsThisRoundsScope: BRIEF_TABLE.includes("**That IS this round's scope.**"),
      theTreeIsThisSessionsToRead: has(
        '**No section tells you the state of the tree. You read that yourself, at method step 6.**',
      ),
      itProducesThreeThings: has(
        '1. Your `## Plan` section — the `WAVES:` index and the numbered chunks under it — appended to\n   that document.\n2. Its commit.\n3. A two-line return.',
      ),
      openTheRealFiles: has('**Open the real files yourself before you name them in a chunk.**'),
    }).toStrictEqual({
      theBriefIsAPath: true,
      andItNamesTheDocument: true,
      theTitleCarriesTheRoundNumber: true,
      contextIsTheWholeOperationContext: true,
      reworkIsThisRoundsScope: true,
      theTreeIsThisSessionsToRead: true,
      itProducesThreeThings: true,
      openTheRealFiles: true,
    });
  });

  // `$ARGUMENTS` resolves to one line for a minion. That line is not a briefing.
  // `agentPromptGetBroker`'s minion-fetch branch substitutes `Quest ID: <uuid>` and nothing else.
  // That is deliberate. The only richer substitution needs a `workItemId`, and
  // `subagentStopNeedsBlockGuard` would hold a minion that passed one open until it signalled on its
  // PARENT's operation item. So the real assignment arrives in the round document.
  it('VALID: the last section => says the assignment is in the document and this line is the authoritative id', () => {
    expect({
      honestHeading: /^## The quest id — everything else is in the round document$/mu.test(
        template,
      ),
      noBriefingHeading: /^## Briefing$/mu.test(template),
      briefIsTheSpawnMessage: has("**Your BRIEF is your parent's spawn message**"),
      andItIsAPath: has('and it is a `PLAN:` path'),
      oneLineOnly: has('The server supplies what\nfollows. It carries exactly one line.'),
      thisOneWins: has(
        'Where that line and the document disagree about the quest id,\nthe line below wins.',
      ),
      noDocumentIsWall: has(
        '`NEXT: wall — my parent wrote no round document; a human must repair the dispatch`.',
      ),
      noDocumentIsNotRework: has('**A missing document is a wall, not `rework`.**'),
      aFreshSessionCannotFixIt: has(
        'Neither this session nor a fresh one can invent the\nscope your parent never wrote.',
      ),
      doNotReconstruct: has('Do not try to reconstruct it from here.'),
    }).toStrictEqual({
      honestHeading: true,
      noBriefingHeading: false,
      briefIsTheSpawnMessage: true,
      andItIsAPath: true,
      oneLineOnly: true,
      thisOneWins: true,
      noDocumentIsWall: true,
      noDocumentIsNotRework: true,
      aFreshSessionCannotFixIt: true,
      doNotReconstruct: true,
    });
  });

  // The planner takes `delegationSpike`, because it is the ONE minion allowed to spawn a sub-agent,
  // and only for a bounded spike. `delegationLeafBan` would forbid the spike its own method
  // requires, and carrying both would leave it following whichever it read first. The actual side
  // of this assertion is built from the statics, so a piece added there arrives here as an
  // unexpected key rather than going unnoticed.
  it('VALID: template => composes the delegating-minion operating rules, and no piece meant for another reader', () => {
    expect(
      Object.fromEntries(
        Object.entries(agentOperatingRulesStatics).map(([key, piece]) => [key, has(piece)]),
      ),
    ).toStrictEqual({
      heading: true,
      turnEndRole: false,
      turnEndMinion: true,
      background: true,
      wardScoped: false,
      wardNone: true,
      delegationSynchronous: false,
      delegationSpike: true,
      delegationLeafBan: false,
      wallRole: false,
      wallMinion: true,
      treeCleanRole: false,
      treeCleanOperator: false,
    });
  });

  // THE BUILD BAN AND THE NO-WARD LINE. The worker and reviewer templates each ban the build. This
  // one banned nothing. It is also the minion likeliest to try: it is sent to open a failing file
  // a previous round left behind. `docs/quest-role-paths.md` states the invariant: "Planner,
  // workers and reviewer are all forbidden `npm run build`." The no-ward bullet answers the [WARD]
  // rule, which tells its reader that its OWN prompt names the scoped form it may run. That forward
  // reference resolved to nothing here. This template names no ward run of its own, and it only
  // WRITES `WARD:` lines for workers.
  describe('what it never runs', () => {
    // NOBODY HAS BUILT WHEN THIS SESSION RUNS, and the bullet says so in as many words. The round's
    // build is the REVIEWER's, at the end. A planner left to infer that goes hunting for a block no
    // session writes, so the bullet states the absence outright.
    it('VALID: template => bans npm run build, and says nobody has built rather than pointing at a block', () => {
      expect({
        heading: /^## What you never run$/mu.test(template),
        ban: has(
          '- **`npm run build`.** Nobody has built yet this round, and it is not your job to.',
        ),
        theReviewerBuildsAtTheEnd: has(
          "The round's\n  `reviewer-minion` builds at the END, once, after every worker has returned.",
        ),
        sharedDist: has('`tsc` writes one shared\n  `dist/` per package'),
        phantomErrors: has(
          'A second builder hands\n  every sibling session phantom type errors on correct code',
        ),
        noBlockAndNotMissingOne: has('**You have no build output and you are not missing one.**'),
        aBrokenTreeArrivesInTheDocument: has(
          "What a broken tree\n  left behind reaches you as the document's `## Rework` section",
        ),
        diagnosedByTheSessionThatHadTheFilesOpen: has(
          'diagnosed by the reviewer that hit\n  it with the files open',
        ),
        noStaleBuildBlockLeft: has('`BUILD:`'),
      }).toStrictEqual({
        heading: true,
        ban: true,
        theReviewerBuildsAtTheEnd: true,
        sharedDist: true,
        phantomErrors: true,
        noBlockAndNotMissingOne: true,
        aBrokenTreeArrivesInTheDocument: true,
        diagnosedByTheSessionThatHadTheFilesOpen: true,
        noStaleBuildBlockLeft: false,
      });
    });

    it('VALID: template => runs no ward of its own and says whose the two ward commands are', () => {
      expect({
        embeddedRuleSaysNone: agentOperatingRulesStatics.wardNone.includes(
          '**[WARD] You run NO build, NO ward, NO test and NO check of any kind.**',
        ),
        noWard: has('- **Ward, and every test and check of any kind.**'),
        theRuleAboveAlreadySaidIt: has('The [WARD] rule above already says so.'),
        wardLineIsTheWorkers: has(
          '**You do\n  not write one either** — each worker derives its own command from its discipline.',
        ),
        roundsWardIsTheReviewers: has(
          "The round's own\n  ward is the REVIEWER's: one `npm run ward -- --staged` after it has read every file the round\n  produced.",
        ),
      }).toStrictEqual({
        embeddedRuleSaysNone: true,
        noWard: true,
        theRuleAboveAlreadySaidIt: true,
        wardLineIsTheWorkers: true,
        roundsWardIsTheReviewers: true,
      });
    });
  });

  // THE REGRESSION GUARD FOR THE PIVOT. `modify-quest({ planningNotes: { operationPlans: [...] } })`
  // used to persist the plan. That path forced this session to invent a UUID for the plan and for
  // every chunk, against a UUID-VALIDATED contract. A bad id therefore REJECTED the whole write
  // instead of degrading it. That left the operator nothing to read back. It also left it no way to
  // find out why. The plan is a section of a committed markdown file now. `WAVE` IS the order. A
  // file path names a file and nothing more. A bad write shows up in `git status`.
  describe('the plan is a section of a committed file, not a quest write', () => {
    it('VALID: template => names the file path, its commit subject, and nothing about operationPlans', () => {
      expect({
        filePath: has('`.quest-plans/<operationItemId>-round-<n>.md`'),
        commitSubject: has('Commit it with the subject `plan round <n>: <count> chunks`.'),
        onlyGitWrite: has('That commit is the only thing you put in git.'),
        theRoundNumberComesOffTheTitle: has(
          "`<n>` is the round number, off the document's own\n`# Round <n>` title.",
        ),
        noOperationPlans: has('operationPlans'),
        noModifyQuestWrite: has('modify-quest({ questId'),
        noUuidMinting: has('a UUID you generate'),
        noDependsOnField: has('dependsOn'),
      }).toStrictEqual({
        filePath: true,
        commitSubject: true,
        onlyGitWrite: true,
        theRoundNumberComesOffTheTitle: true,
        noOperationPlans: false,
        noModifyQuestWrite: false,
        noUuidMinting: false,
        noDependsOnField: false,
      });
    });

    // THE APPEND. The operator's `## Context` is already in this file, so `Write` and `Edit` both
    // delete it. The delimiter is QUOTED so a plan containing a `$` or a backtick lands verbatim.
    it('VALID: template => appends its section rather than writing the file, with a quoted heredoc', () => {
      expect({
        appendOnly: has('**APPEND it. Never `Write` this file and never `Edit` it.**'),
        theOperatorsContextIsAlreadyThere: has(
          "Your parent's `## Context` is already\nin it, and both of those replace the whole file.",
        ),
        oneShot: has(
          'Append your whole section in ONE shot, with a\nQUOTED heredoc delimiter so nothing inside it expands:',
        ),
        theCommand: has("cat >> <the PLAN: path from your brief> <<'PLAN'"),
        thenAddAndCommit: has(
          '1. `git add` the document.\n2. Commit it with the subject `plan round <n>: <count> chunks`.',
        ),
        andItRewritesNothingAbove: has(
          '- **Your section starts at `## Plan` and ends at `## Round log`.** Never re-write `# Round`,\n  `## Context` or `## Rework`.',
        ),
      }).toStrictEqual({
        appendOnly: true,
        theOperatorsContextIsAlreadyThere: true,
        oneShot: true,
        theCommand: true,
        thenAddAndCommit: true,
        andItRewritesNothingAbove: true,
      });
    });

    // THE APPEND REGION. It is the LAST thing in the fence and it is EMPTY, and both of those are
    // what make a WAVE of workers safe to write into it. An append lands at whatever the end of the
    // file is when it lands, so two siblings both survive; an `Edit` of a chunk section is a
    // read-modify-write and the second one back erases the first. A region the planner wrote under
    // would sit exactly where a worker's bytes are about to go.
    it('VALID: the plan fence => ends on an EMPTY round-log region for its workers to append to', () => {
      const fence = template.slice(
        template.indexOf('## What you append'),
        template.indexOf('**APPEND it.'),
      );

      expect({
        theHeading: fence.includes('## Round log'),
        leftEmpty: fence.includes(
          '<nothing. Each worker appends its own report here as its last act.>',
        ),
        andItIsTheLastThingInTheFence: fence
          .trimEnd()
          .endsWith('<nothing. Each worker appends its own report here as its last act.>\n```'),
        theRuleSaysWriteNothingUnderIt: has(
          '- **`## Round log` is the LAST thing you write, and you write NOTHING under it.**',
        ),
        theRuleSaysWhyEditingRaces: has('and a wave of them editing one file overwrite each other'),
        aZeroChunkPlanStillCarriesIt: has(
          'It carries the `## Round log` header and no `### chunk`\nsections, and its index reads `WAVES: none` on ONE line.',
        ),
      }).toStrictEqual({
        theHeading: true,
        leftEmpty: true,
        andItIsTheLastThingInTheFence: true,
        theRuleSaysWriteNothingUnderIt: true,
        theRuleSaysWhyEditingRaces: true,
        aZeroChunkPlanStillCarriesIt: true,
      });
    });

    it('VALID: the format rules => state a count matching the list underneath them', () => {
      expect({
        theListHasThisMany: FORMAT_RULES_LISTED,
        andTheSentenceClaimsThisMany: FORMAT_RULES_CLAIMED,
      }).toStrictEqual({
        theListHasThisMany: 12,
        andTheSentenceClaimsThisMany: 12,
      });
    });

    // The plan's chunk heading is `### chunk <n>` and a worker's report heading is
    // `### report — chunk <n>`. Both live in the same document under their own `##` section, so the
    // two must never be spellable the same way: a reviewer told to read "chunk 3" out of a file
    // carrying two `### chunk 3` headings grades the report against itself.
    it('VALID: the chunk format => carries every field the worker template reads back, under its own heading', () => {
      expect({
        heading: has('### chunk 1 — <one line a worker can hold in its head>'),
        andTheWorkerReportHeadingIsDifferent: WORKER.includes('### report — chunk <n>'),
        wavesIndexSitsAboveTheChunks: has('WAVES:\n  1: 1, 3\n  2: 2'),
        andNoChunkCarriesItsOwnWave: /^WAVE: /mu.test(template),
        summary: has('SUMMARY: <2-3 sentences'),
        intent: has(
          'INTENT: <what must be TRUE when this chunk is done — an outcome, not a task list>',
        ),
        files: has('FILES:\n  - ./packages/<pkg>/src/<path>.ts'),
        units: has('UNITS:\n  - <a unit id this chunk must satisfy>'),
        mirror: has(
          'MIRROR: ./packages/<pkg>/src/<an existing sibling whose shape this follows>.ts',
        ),
        noWardLineAtAll: /^WARD:/mu.test(template),
        notes: has('NOTES:\n  <everything its worker cannot derive'),
      }).toStrictEqual({
        heading: true,
        andTheWorkerReportHeadingIsDifferent: true,
        wavesIndexSitsAboveTheChunks: true,
        andNoChunkCarriesItsOwnWave: false,
        summary: true,
        intent: true,
        files: true,
        units: true,
        mirror: true,
        noWardLineAtAll: false,
        notes: true,
      });
    });

    // `WAVE` is the dependency order and the chunk number is identity. There is still exactly ONE
    // ordering channel — it just moved, because the number now has to serve as a name a brief can
    // cite while several chunks run at once.
    it('VALID: template => makes the WAVES index the dependency order and the chunk number identity', () => {
      expect({
        wavesIsOrder: has(
          '**`WAVES:` IS THE DEPENDENCY ORDER, and it is the ONE place that order is written.**',
        ),
        onePerWaveContiguous: has(
          'One line per\n  wave, `<wave>: <chunk numbers>`, waves numbered from 1 contiguously.',
        ),
        everyChunkExactlyOnce: has('**Every chunk number appears\n  in it exactly once**'),
        laterIsAHigherWave: has('**A chunk goes in a later\n  wave than anything it depends on.**'),
        independentGoesInWaveOne: has(
          'A chunk that depends on nothing this round goes in wave 1,\n  however high its own number.',
        ),
        serialIsAlwaysLegal: has(
          'Put every chunk in its own wave and you get the old serial round back,\n  which is always correct and always slower.',
        ),
        zeroChunkIndexIsOneLine: has(
          '**On a zero-chunk plan the index is the one line\n  `WAVES: none`**',
        ),
        chunkNumberIsIdentity: has(
          '- **The chunk number is IDENTITY, and no chunk section carries a wave of its own.**',
        ),
      }).toStrictEqual({
        wavesIsOrder: true,
        onePerWaveContiguous: true,
        everyChunkExactlyOnce: true,
        laterIsAHigherWave: true,
        independentGoesInWaveOne: true,
        serialIsAlwaysLegal: true,
        zeroChunkIndexIsOneLine: true,
        chunkNumberIsIdentity: true,
      });
    });

    // A wave is the only place two minions touch the tree at the same time. `FILES` disjointness
    // covers the files; it does not cover Playwright's one report path per package, and it does not
    // cover a discipline that owns one live server.
    it('VALID: template => names the four kinds of sharing FILES cannot show, and defers to the pack', () => {
      expect({
        sameTime: has(
          '**Two chunks in one wave RUN AT THE SAME TIME, in ONE worktree, so they may not share anything.**',
        ),
        filesCoverOwnedPathsOnly: has(
          '`FILES` disjointness covers the paths a chunk OWNS and nothing else.',
        ),
        fourKinds: has('**Four kinds of sharing are\n  invisible to it**'),
        theReadThroughFile: has(
          'any file two chunks READ THROUGH rather than own, which is a `.proxy.ts`,\n  a `.stub.ts`, a harness, or a production line two chunks both mutate to prove their tests bite.',
        ),
        aSharedOneGoesLater: has(
          '**Look for those four before you group. A chunk that shares one goes in a later wave.**',
        ),
        disciplineDecides: has(
          "**Your discipline's\n  `### The waves` section says which of those it holds, and therefore whether two chunks may share\n  a wave at all. Read it before you write the index.**",
        ),
        splitWhenUnsure: has(
          "When your discipline leaves two chunks'\n  independence genuinely open, split the wave. A serial plan costs time. A wrong wave costs both\n  chunks.",
        ),
      }).toStrictEqual({
        sameTime: true,
        filesCoverOwnedPathsOnly: true,
        fourKinds: true,
        theReadThroughFile: true,
        aSharedOneGoesLater: true,
        disciplineDecides: true,
        splitWhenUnsure: true,
      });
    });

    it('VALID: template => makes FILES ownership, bans a shared path, and requires the ./ prefix', () => {
      expect({
        ownership: has('**`FILES` is OWNERSHIP. Two chunks must never list the same path.**'),
        lastWriteWins: has(
          'The second worker to write a\n  shared file erases what the first wrote.',
        ),
        oneChunkIfShared: has('If two chunks genuinely need one file, they are one chunk.'),
        prefix: has('**`FILES` paths start with `./` or are absolute.**'),
        noDirectories: has('They are FILE paths, never directories'),
      }).toStrictEqual({
        ownership: true,
        lastWriteWins: true,
        oneChunkIfShared: true,
        prefix: true,
        noDirectories: true,
      });
    });

    // The planner writes NO ward command. Its WORKER calls `get-folder-detail` for every folder type
    // its `FILES` land in, blocking, at its own method step 1 — so the session banned from choosing
    // holds the folder-type map first-hand, while the session choosing would be stating it for files
    // nobody has written yet. What this session still owes is the explicit `FILES` list.
    it('VALID: template => writes NO ward line and owes the FILES list instead', () => {
      expect({
        noWardLine: has('- **You write NO `WARD` line. Each worker builds its own**'),
        fromTheDisciplineSection: has(
          "from its discipline's `### The ward`\n  section over the `FILES` you gave it.",
        ),
        theWorkerHoldsTheFolderMap: has(
          'That worker has already called `get-folder-detail` for\n  every folder type those files land in, so it knows which test types they actually carry',
        ),
        whatYouOweIsTheFilesList: has('**What you owe it instead is the `FILES`\n  list**'),
        explicitPathsNeverADirectory: has('explicit file paths, never a bare directory.'),
        andWhyADirectoryStrandsTheTurn: has(
          "A bare directory pulls in the whole package,\n  ward auto-backgrounds the run, and that worker's turn stops there.",
        ),
        noWardFenceInTheChunkFormat: /^WARD:/mu.test(template),
      }).toStrictEqual({
        noWardLine: true,
        fromTheDisciplineSection: true,
        theWorkerHoldsTheFolderMap: true,
        whatYouOweIsTheFilesList: true,
        explicitPathsNeverADirectory: true,
        andWhyADirectoryStrandsTheTurn: true,
        noWardFenceInTheChunkFormat: false,
      });
    });

    // The worker runs no typecheck, so nothing else tells it what to go looking for usages of. This
    // line in `NOTES` is the whole input to the worker's usage-site step.
    it('VALID: template => makes NOTES name what the chunk changes that other files use', () => {
      expect({
        nameIt: has('- **Name in `NOTES` whatever this chunk changes that other files USE**'),
        theFourKinds: has(
          'an exported signature, a\n  contract field, a renamed symbol, a moved path',
        ),
        itIsTheWorkersInput: has(
          'Its worker runs no typecheck, so this line is what\n  sends it looking for the usage sites.',
        ),
        whatLeavingItOutCosts: has(
          "Leave it out and a call site elsewhere in the repo stays broken\n  until the reviewer's ward at the end of the round, with nobody assigned to it.",
        ),
      }).toStrictEqual({
        nameIt: true,
        theFourKinds: true,
        itIsTheWorkersInput: true,
        whatLeavingItOutCosts: true,
      });
    });

    it('VALID: template => requires UNITS and says what a chunk without one is graded against', () => {
      expect({
        gradedBySetDifference: has(
          '**`UNITS` is what the reviewer grades the chunk against**, by set difference.',
        ),
        emptyComesBackClean: has('none is graded against nothing. It comes back clean.'),
        theNoneLiteral: has('`UNITS: none — <why this chunk exists>`'),
        theSettledLiteral: has('`UNITS: settled <unit-id> at <sha> — <the assertion you read>`'),
        theOutOfMediumLiteral: has(
          '`UNITS: out-of-medium <unit-id> — <the medium, and which later role owns it>`',
        ),
      }).toStrictEqual({
        gradedBySetDifference: true,
        emptyComesBackClean: true,
        theNoneLiteral: true,
        theSettledLiteral: true,
        theOutOfMediumLiteral: true,
      });
    });

    it('VALID: template => tells the session to keep chunks small and names why a big one is invisible', () => {
      expect({
        errSmall: has('**Keep every chunk small.**'),
        oneWorkerHoldsIt: has('A chunk must be small enough for ONE worker to hold in full.'),
        skimIsInvisible: has(
          '**A worker\n  skims an over-large chunk. A green run hides what it skipped.**',
        ),
        twoTightBeatsOne: has('Two tight\n  chunks beat one oversized chunk.'),
      }).toStrictEqual({
        errSmall: true,
        oneWorkerHoldsIt: true,
        skimIsInvisible: true,
        twoTightBeatsOne: true,
      });
    });
  });

  // The `short:` routing shape had no reader. The operator's last gate decided on the reviewer's
  // remainder alone, so the ledger reported scope the planner had called uncovered as complete.
  // Scope the planner cannot plan cleanly is a CHUNK now. A worker reads it. A reviewer grades it.
  // The next round inherits it. That is the path everything else takes.
  it('VALID: template => turns unplannable scope into a chunk rather than a routing note', () => {
    expect({
      stillGetsAChunk: has('**Scope you cannot plan cleanly still gets a chunk.**'),
      intentNamesTheDecision: has(
        'Its `INTENT` names what must be settled. Its `NOTES` names the contradiction.',
      ),
      reachesTheNextRound: has(
        'Its worker\n  returns `rework` or `wall`. That answer reaches the next round.',
      ),
      leavingItOutDropsIt: has(
        '**Never leave it out of the\n  plan.** A plan that omits it drops that scope.',
      ),
      noChannelWithoutAReader: has(
        'Nothing downstream reads a channel your parent does\n  not route on',
      ),
    }).toStrictEqual({
      stillGetsAChunk: true,
      intentNamesTheDecision: true,
      reachesTheNextRound: true,
      leavingItOutDropsIt: true,
      noChannelWithoutAReader: true,
    });
  });

  describe('what it returns', () => {
    it('VALID: template => returns two lines, and never the plan body', () => {
      expect({
        planLine: has('PLAN: .quest-plans/<operationItemId>-round-<n>.md — <count> chunks'),
        continueLine: has('NEXT: continue'),
        wallLine: has('NEXT: wall — <what, and what a human must change>'),
        exactlyTwoValues: has('`NEXT:` has exactly two values.'),
        zeroChunksIsContinue: has(
          '`continue` covers every plan you were able to write, zero chunks\nincluded.',
        ),
        neverPasteThePlan: has('**Never paste the plan into your return.**'),
      }).toStrictEqual({
        planLine: true,
        continueLine: true,
        wallLine: true,
        exactlyTwoValues: true,
        zeroChunksIsContinue: true,
        neverPasteThePlan: true,
      });
    });

    // THE VOCABULARY SECTION MUST BEAT OPERATING RULE 5. That rule arrives inside
    // `delegatingMinionMarkdown`, a block that opens "Read every rule below before you do anything
    // else". It offers `NEXT: rework` to every minion. The operator cannot route a `rework` from a
    // PLANNER. It matches the first word, then goes to step 3 of its own loop, then `Read`s a
    // document with no `## Plan` section in it. The section must name that third value and refuse
    // it by name. Otherwise rule 5 wins.
    it('VALID: template => excludes rule 5 rework by name and says why a planner has two values', () => {
      expect({
        wallRuleOffersIt: agentOperatingRulesStatics.wallMinion.includes(
          'Work that merely remains unfinished is `NEXT: rework` instead.',
        ),
        namesRuleFive: has(
          '**Operating rule 5 above names a third value, `NEXT: rework`. Never write it.**',
        ),
        twoNotThree: has('A worker and a reviewer each have three values. You have two.'),
        noPlanToRead: has(
          'A rework round would\nhave nothing to act on, because a planner that cannot plan appends no plan.',
        ),
        parentMatchesFirstWord: has(
          'Your parent matches\nthe FIRST WORD of this line and nothing else.',
        ),
        stepThreeReadsNothing: has(
          '`rework` sends it straight to step 3 of its own loop.\nThere it `Read`s a document with no `## Plan` section in it.',
        ),
        noFailureBranch: has('It has no failure branch there. It has\nno tool to find out why.'),
        unplannableIsAChunk: has('Scope you could not plan cleanly is a CHUNK'),
      }).toStrictEqual({
        wallRuleOffersIt: true,
        namesRuleFive: true,
        twoNotThree: true,
        noPlanToRead: true,
        parentMatchesFirstWord: true,
        stepThreeReadsNothing: true,
        noFailureBranch: true,
        unplannableIsAChunk: true,
      });
    });

    it('VALID: template => declares a zero-chunk plan legal and forbids inventing work', () => {
      expect({
        legal: has('**A plan with ZERO chunks is a legal plan.**'),
        alreadyTrue: has('the scope is already true on disk'),
        noChunkSections: has('no `### chunk`'),
        doNotInvent: has('**Do not invent a chunk to look productive.**'),
      }).toStrictEqual({
        legal: true,
        alreadyTrue: true,
        noChunkSections: true,
        doNotInvent: true,
      });
    });

    // Its parent opens no source file. It holds no opinion about the plan. It either guesses at a
    // question handed up or drops it. `ask-user-question` is deliberately absent. A minion runs
    // inside its parent's turn, so nothing resumes it with an answer.
    it('VALID: template => forbids routing a design choice upward and never reaches for a question tool', () => {
      expect({
        wallIsEnvironmentOnly: has('**`wall` is for an environment wall and nothing else.**'),
        designIsNeverAWall: has(
          '**A design choice is NEVER a wall and never a question for your parent.**',
        ),
        parentGuessesOrDrops: has(
          'It either guesses at a question you hand up, or\ndrops it silently.',
        ),
        decideIt: has('Decide it yourself. Write your reasons into the `SUMMARY`.'),
        usersCallIsAChunk: has(
          "Where the call is genuinely the USER's rather than yours, that is still a\nCHUNK.",
        ),
        noAskUserQuestion: has('ask-user-question'),
      }).toStrictEqual({
        wallIsEnvironmentOnly: true,
        designIsNeverAWall: true,
        parentGuessesOrDrops: true,
        decideIt: true,
        usersCallIsAChunk: true,
        noAskUserQuestion: false,
      });
    });
  });

  describe('the method', () => {
    it('VALID: template => numbers its steps 1 through 9, contiguously', () => {
      const method = template.slice(
        template.indexOf('## Method'),
        template.indexOf('## What you append'),
      );

      expect(Array.from(method.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0])).toStrictEqual([
        '1. **',
        '2. **',
        '3. **',
        '4. **',
        '5. **',
        '6. **',
        '7. **',
        '8. **',
        '9. **',
      ]);
    });

    // The OPERATOR writes `## Context` at its own step 1, and this step is the first instruction
    // the planner executes. Its predecessor read a `SCOPE:` block while the operator wrote
    // `CONTEXT:`, which sent the session hunting for a block its parent never wrote. Reading both
    // sides off the same file removes the class of fault entirely.
    it('VALID: step 1 => reads the document, and the ids out of the section the operator wrote', () => {
      expect({
        readsTheDocumentFirst: has(
          "1. **Read the round document first**, whole, at the path your brief's `PLAN:` line names.",
        ),
        twoSectionsAreTheAssignment: has(
          'Its\n   `## Context` and `## Rework` sections are your entire assignment.',
        ),
        roundOneHasNoRework: has(
          '**On round 1 there is no\n   `## Rework` section, and that is correct**',
        ),
        readTheIdsFromThere: has(
          '**Read the ids out of `## Context` rather than reconstructing them.**',
        ),
        theThreeIdsAreItsFirstLines: has(
          '`Quest ID:`,\n   `Work Item ID:` and `Operation Item ID:` are the first three lines of that section',
        ),
        becauseTheParentCopiedTheBlockWhole: has('because\n   your parent copied the block whole.'),
        noBuildBlock: has('`BUILD:`'),
        noTreeBlock: has('`TREE:`'),
      }).toStrictEqual({
        readsTheDocumentFirst: true,
        twoSectionsAreTheAssignment: true,
        roundOneHasNoRework: true,
        readTheIdsFromThere: true,
        theThreeIdsAreItsFirstLines: true,
        becauseTheParentCopiedTheBlockWhole: true,
        noBuildBlock: false,
        noTreeBlock: false,
      });
    });

    it('VALID: step 2 => loads the standards blocking, in one ToolSearch batch', () => {
      expect({
        blocking: has('**Load the project standards YOURSELF (BLOCKING).**'),
        parentCannotDigest: has(
          'Your parent did not load them. It cannot\n   summarise them for you either.',
        ),
        overrideTraining: has(
          'They override your training defaults. Those defaults are WRONG for this\n   codebase.',
        ),
        oneBatch: has(
          'in the SAME\n   first `ToolSearch` batch, so you do not pay a second round-trip later',
        ),
      }).toStrictEqual({
        blocking: true,
        parentCannotDigest: true,
        overrideTraining: true,
        oneBatch: true,
      });
    });

    // THIS SESSION IS THE ONLY ONE ON THE ROUND THAT READS GIT, and step 5 covers all four reads.
    // `status` sits alongside `log`/`diff`/`show` because nothing hands this session the tree
    // either: the document has no section for it. The PARENT keeps a single `git status`, at its
    // sweep gate, where the answer changes what the parent does next.
    it('VALID: steps 4 and 5 => read real code, and are the only session that reads any git', () => {
      expect({
        realCode: has('**Read the real code before you plan against it.**'),
        notAgainstTheSpecAlone: has('**Plan against\n   reality, never against the spec alone.**'),
        allFourReads: has(
          '6. **Read GIT — the tree first, then the history.** You are the only session on this round that\n   reads git at all.',
        ),
        statusFirst: has('**Start with `git status`.**'),
        theParentsIsTheSweepGateOnly: has(
          'Your parent runs one, but only at its own sweep gate, long after\n   you have returned.',
        ),
        aDirtyTreeIsADeadSessions: has(
          'Anything listed here is work a DEAD session left behind, mid-round',
        ),
        thenTheHistory: has('**Then the history.** No other session reconstructs it.'),
        reviewerMayConfirmOneFix: has(
          'A `reviewer-minion` may open a\n   `git diff` or a `git show` to confirm one named fix.',
        ),
        readTheBodies: has('**Read the\n   BODIES.**'),
        noWorkerCommits: has('**No worker commits anything**'),
        roundSubject: has(
          'commits its whole round under\n   `round <n>: <what the round made true>`',
        ),
        reviewSubject: has('then its verdict under\n   `review <n>: <verdict>`'),
        earlierDocumentsAreInGit: has(
          "Earlier rounds'\n   documents are in git too, each holding that round's plan and every worker's report.",
        ),
        andTheyAreNamedForTheirOperationItem: has(
          '**They are\n   named for the operation item that produced them**',
        ),
        ptNIsTheJob: has('makes this the job, not background reading'),
        writesNothingElse: has('**You WRITE nothing to git except the round document.**'),
        andAllFourReadsAreNamedAsReads: has(
          '`status`, `log`, `diff` and `show`\n   are reads and all four are yours.',
        ),
      }).toStrictEqual({
        realCode: true,
        notAgainstTheSpecAlone: true,
        allFourReads: true,
        statusFirst: true,
        theParentsIsTheSweepGateOnly: true,
        aDirtyTreeIsADeadSessions: true,
        thenTheHistory: true,
        reviewerMayConfirmOneFix: true,
        readTheBodies: true,
        noWorkerCommits: true,
        roundSubject: true,
        reviewSubject: true,
        earlierDocumentsAreInGit: true,
        andTheyAreNamedForTheirOperationItem: true,
        ptNIsTheJob: true,
        writesNothingElse: true,
        andAllFourReadsAreNamedAsReads: true,
      });
    });

    // The trigger is the tree this session read at step 5, or a compile error in the document's
    // `## Rework` — never a `BUILD:` block, because nothing compiles until the reviewer builds at
    // the END of the round. The step says outright that a broken tree is INVISIBLE to this session
    // until then, so it does not go hunting for a signal nothing has produced yet.
    it('VALID: step 6 => turns a dirty tree or a rework compile error into chunk 1', () => {
      expect({
        isAChunk: has(
          '**A dirty tree, or a compile error in `## Rework`, is a CHUNK — not a wall.**',
        ),
        canOpenTheFile: has('You can open\n   the failing file yourself.'),
        chunkOne: has('Cut chunk 1 for\n   it, in wave 1. Number the rest of the round after it.'),
        nothingHasCompiledYet: has('**Nothing has compiled this round**'),
        soABrokenTreeIsInvisibleUntilTheReviewer: has(
          'so a\n   broken tree is invisible to you until its reviewer builds at the end',
        ),
      }).toStrictEqual({
        isAChunk: true,
        canOpenTheFile: true,
        chunkOne: true,
        nothingHasCompiledYet: true,
        soABrokenTreeIsInvisibleUntilTheReviewer: true,
      });
    });

    it('VALID: step 7 => bounds the spike to a new pattern under spike-tmp, which git ignores', () => {
      expect({
        onlyMinionAllowed: has('You are the ONLY minion permitted to spawn its own\n   sub-agents'),
        netNewOnly: has('a pattern nobody in this repo has\n   built yet'),
        spikeTmp: has('**Write every spike under `spike-tmp/`.**'),
        gitignored: has('You commit nothing there, because git ignores that\n   path.'),
        untrackedRefusesTheSignal: has("An untracked file REFUSES\n   your parent's every signal."),
        disciplineSaysKeptOrRemoved: has(
          'says which kind it wants:\n\n   - A spike KEPT, as a working pattern a worker extends.\n   - A diagnostic probe REMOVED before you return.',
        ),
        readItYourself: has(
          'If\n   you find yourself spawning a helper to read files for you, read them yourself',
        ),
      }).toStrictEqual({
        onlyMinionAllowed: true,
        netNewOnly: true,
        spikeTmp: true,
        gitignored: true,
        untrackedRefusesTheSignal: true,
        disciplineSaysKeptOrRemoved: true,
        readItYourself: true,
      });
    });
  });

  // ============================================================================================
  // CROSS-FILE AGREEMENTS. Each test spans this file and one other statics file, and derives its
  // needle from that other file's live value. Nothing type-checks a section heading, a `NEXT:`
  // value or a commit subject, so until these landed a reword on either side stayed green.
  // ============================================================================================
  describe('agreements with the operator above and the minions below', () => {
    // SPANS operator-prompt-statics.ts (step 1 WRITES the document) ↔ the table at the top of this
    // template (the only session that READS those sections first). Their predecessors drifted
    // exactly here: this template read `SCOPE:` while the operator wrote `CONTEXT:`. Deriving both
    // section sets live turns a rename into a set difference rather than a section nobody opens.
    it('VALID: {operator document fence, this template} => reads exactly the sections the operator writes', () => {
      expect({
        theOperatorWritesThisManySections: OPERATOR_WRITTEN_SECTIONS.length,
        sectionsTheOperatorWritesAndThisTemplateNeverReads: OPERATOR_WRITTEN_SECTIONS.filter(
          (section) => !SECTIONS_THIS_SESSION_READS.includes(section),
        ),
        sectionsThisTemplateReadsAndTheOperatorNeverWrites: SECTIONS_THIS_SESSION_READS.filter(
          (section) => !OPERATOR_WRITTEN_SECTIONS.includes(section),
        ),
        // Neither side may carry a `BUILD:` or a `TREE:` block: no session has compiled by the time
        // the document is written, and the tree is this session's own to read at step 5.
        andNeitherSideCarriesABuildBlock: `${OPERATOR_CONTEXT_FENCE}${template}`.includes('BUILD:'),
        norATreeBlock: `${OPERATOR_CONTEXT_FENCE}${template}`.includes('TREE:'),
      }).toStrictEqual({
        theOperatorWritesThisManySections: 2,
        sectionsTheOperatorWritesAndThisTemplateNeverReads: [],
        sectionsThisTemplateReadsAndTheOperatorNeverWrites: [],
        andNeitherSideCarriesABuildBlock: false,
        norATreeBlock: false,
      });
    });

    // SPANS operator-prompt-statics.ts (its brief fence) ↔ this file. That fence is the ONLY thing
    // this session receives directly, so the path it appends to, the path it returns, and the path
    // the operator reads back all have to be the fence's path — a rename on one side leaves the
    // operator `Read`ing a file nobody wrote, and its ALLOWED table permits no second path to try.
    it('VALID: {operator brief fence, planner} => appends at the path that fence names, and returns it', () => {
      expect({
        theFenceNamesAPath: BRIEF_PLAN_PATH,
        thisTemplateAppendsAtThatExactPath: has(
          `## What you append — to the \`PLAN:\` path, at \`${BRIEF_PLAN_PATH}\``,
        ),
        andReturnsThatExactPath: has(`PLAN: ${BRIEF_PLAN_PATH} — <count> chunks`),
        andTheOperatorWritesThatExactPath: OPERATOR.includes(`Write on ${BRIEF_PLAN_PATH} `),
        andReadsItBack: OPERATOR.includes(`Read on ${BRIEF_PLAN_PATH} `),
        // The round number comes off the document's own title now, because the brief carries no
        // header for it to sit in.
        theRoundNumberComesOffTheTitle: has(
          "`<n>` is the round number, off the document's own\n`# Round <n>` title.",
        ),
        andTheOperatorWritesThatTitle: OPERATOR_CONTEXT_FENCE.includes('# Round <n> — '),
      }).toStrictEqual({
        theFenceNamesAPath: '.quest-plans/<operationItemId>-round-<n>.md',
        thisTemplateAppendsAtThatExactPath: true,
        andReturnsThatExactPath: true,
        andTheOperatorWritesThatExactPath: true,
        andReadsItBack: true,
        theRoundNumberComesOffTheTitle: true,
        andTheOperatorWritesThatTitle: true,
      });
    });

    // SPANS operator-prompt-statics.ts (its NEXT table is the only reader of this line) ↔ this
    // file, plus the two sibling minions this template makes a claim about. Every value this
    // session can write must be a row the operator routes. The reverse does NOT hold, and that
    // asymmetry is the whole point: the operator routes a third value its OTHER two minions may
    // write, operating rule 5 offers that value to every minion, and a planner that took it sends
    // the operator to step 3 to `Read` a document with no plan in it. So the refusal below names
    // that value, and this test derives the name from the difference between the two sets.
    it('VALID: {planner NEXT values, operator NEXT table} => declares only routed values, and refuses the routed value it must never write', () => {
      expect({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: NEXT_VALUES.filter(
          (value) => !OPERATOR_ROUTED_VALUES.includes(value),
        ),
        thisTemplateDeclares: NEXT_VALUES.length,
        andSaysSo: has('`NEXT:` has exactly two values.'),
        routedValuesThisSessionMustNeverWrite: VALUES_ROUTED_BUT_NOT_THIS_SESSIONS.length,
        eachOfThemRefusedByName: VALUES_ROUTED_BUT_NOT_THIS_SESSIONS.every((value) =>
          has(`names a third value, \`NEXT: ${value}\`. Never write it.**`),
        ),
        theWorkerAndTheReviewerReallyDoDeclareThree: [WORKER_NEXT.length, REVIEWER_NEXT.length],
        andThisTemplateSaysThatToo: has(
          'A worker and a reviewer each have three values. You have two.',
        ),
        theOperatorMatchesTheFirstWord: OPERATOR.includes('Match the FIRST WORD.'),
        andThisTemplateTellsTheReaderThat: has(
          'Your parent matches\nthe FIRST WORD of this line and nothing else.',
        ),
      }).toStrictEqual({
        valuesThisTemplateDeclaresThatTheOperatorCannotRoute: [],
        thisTemplateDeclares: 2,
        andSaysSo: true,
        routedValuesThisSessionMustNeverWrite: 1,
        eachOfThemRefusedByName: true,
        theWorkerAndTheReviewerReallyDoDeclareThree: [3, 3],
        andThisTemplateSaysThatToo: true,
        theOperatorMatchesTheFirstWord: true,
        andThisTemplateTellsTheReaderThat: true,
      });
    });

    // SPANS reviewer-minion-statics.ts ↔ the git step. This session is the only one that reads
    // history, and it reads it BY SUBJECT. Every subject on a quest branch is the reviewer's, since
    // no worker commits. Reword one there and this step sends the one session that could
    // reconstruct a `pt N` predecessor's work looking for commits under a name nothing writes.
    //
    // The two `sweep:` subjects are DELIBERATELY outside what this step greps for. A sweep commits
    // paths no chunk owned, on a tree the round already left; it records no round, so a planner
    // reconstructing what a predecessor built would read one as a round that never happened.
    it('VALID: {reviewer commit subjects, method step 6} => greps for the round subjects, and not the sweeps', () => {
      expect({
        theReviewerWritesThisManySubjects: REVIEWER_SUBJECTS.length,
        thisStepClaimsBothOfThem: CLAIMED_SUBJECT_PREFIXES.length,
        reviewerSubjectsOutsideThePrefixesThisStepGrepsFor: REVIEWER_SUBJECTS.filter(
          (subject) => !CLAIMED_SUBJECT_PREFIXES.some((prefix) => subject.startsWith(prefix)),
        ),
        andNoWorkerCommitsAtAll: WORKER.includes('git commit'),
        andThisStepSaysSo: has('**No worker commits anything**'),
        andTheReviewerReallyDoesPutItsReturnInTheBody: REVIEWER.includes(
          'your whole return block below in the body, verbatim',
        ),
        soThisStepTellsTheReaderToOpenThem: has('**Read the\n   BODIES.**'),
      }).toStrictEqual({
        theReviewerWritesThisManySubjects: 4,
        thisStepClaimsBothOfThem: 2,
        reviewerSubjectsOutsideThePrefixesThisStepGrepsFor: [
          'sweep: <what these paths are>',
          'sweep: uncommitted remainder',
        ],
        andNoWorkerCommitsAtAll: false,
        andThisStepSaysSo: true,
        andTheReviewerReallyDoesPutItsReturnInTheBody: true,
        soThisStepTellsTheReaderToOpenThem: true,
      });
    });
  });
});
