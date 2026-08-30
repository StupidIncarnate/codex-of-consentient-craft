import { warpgatePromptStatics } from './warpgate-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `template` is bound with every whitespace run — spaces,
// newlines, indent — collapsed to a single space, so a needle written on ONE line finds its
// sentence however the prompt happens to wrap. Re-flowing a paragraph in the statics file then
// reds nothing that is still true, which is why no needle below carries an escaped newline. The
// line-anchored `toMatch` assertions read `warpgatePromptStatics.prompt.template` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const template = warpgatePromptStatics.prompt.template.replace(WHITESPACE_RUN, ' ');

describe('warpgatePromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(warpgatePromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(warpgatePromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(warpgatePromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: title => frames Warpgate as a merge relay worker', () => {
    expect(warpgatePromptStatics.prompt.template).toMatch(/^# Warpgate - Merge Relay Worker$/mu);
  });

  it('VALID: template => tells the role it owns ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // This used to name ChaosWhisperer as a spec-time ledger author. ChaosWhisperer never was one.
  // `operations` sits on NO status's `allowedFields` in questStatusInputAllowlistStatics, so
  // modify-quest rejects that field whatever the status and whoever the caller. The codeweaver
  // ledger is DERIVED at Start Quest by questBuildRelayGraphBroker instead. Name a second writer
  // here and this session reads a write it will never see happen as somebody's normal business.
  it('VALID: template => names the orchestrator as the only writer of the ledger', () => {
    const needle =
      'The ledger has exactly one writer, the orchestrator. The modify-quest tool rejects the `operations` field whoever sends it, because `operations` is off its allowlist at every status.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git fetch and git push', () => {
    const needle =
      '| `git fetch` | You read the base branch you compare against from the quest. Never from origin. | | `git push` | You are done once the merge lands on the local base branch. The user decides whether to publish it, outside this session. |';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git stash', () => {
    const needle =
      "| `git stash` | Never hide work behind a stash. Not yours, and not the repo root checkout's. |";
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // [WARD] and this step have to agree, because a session follows whichever it reads first. They
  // used to contradict each other outright: [WARD] said NEVER run the whole-repo `npm run ward`
  // while this step ordered exactly that, and the step papered over it by calling itself an
  // exception. [WARD] now DIRECTS the whole-repo run for this role, so the step cites it instead.
  // A base merge can break files outside the quest's own, and a scoped run cannot see those.
  it('VALID: template => names its whole-repo ward as the run [WARD] directs, in the background', () => {
    expect({
      wholeRepo: template.includes('`npm run ward`, whole-repo, no `--only` and no paths'),
      isTheException: template.includes(
        '**This is the whole-repo ward [WARD] directs. It is the only ward this session runs.**',
      ),
      namesWhyScopedCannotWork: template.includes(
        "You are checking that a BASE MERGE did not break something outside the quest's own files. A scoped run cannot see that.",
      ),
      runsItRule2sWay: template.includes(
        'The harness auto-backgrounds a whole-repo run, so [DELEGATION] governs it. Do these three things, in order: 1. Set `run_in_background: true`. 2. Wait for the task notification. 3. Read the output once.',
      ),
      neverSleepAndTail: template.includes('Do NOT sleep and then tail the output.'),
    }).toStrictEqual({
      wholeRepo: true,
      isTheException: true,
      namesWhyScopedCannotWork: true,
      runsItRule2sWay: true,
      neverSleepAndTail: true,
    });
  });

  it('VALID: template => tells the session to branch on the full-mode ward exit code', () => {
    const needle =
      '**Read its exit code and branch on it.** Do NOT run ward and then move on without reading what it returned.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => never merges into base while ward is red', () => {
    const needle =
      'You never merge into the base branch while ward is red. The base branch tip stays exactly where it started for as long as ward is red.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => moves work onto base only once the quest branch is green', () => {
    const needle =
      'Base never receives an unproven merge, because the work moves onto base only once the branch is green.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => skips intake and the full ward run when base is already an ancestor', () => {
    const needle =
      '| Already an ancestor | The quest branch already contains everything base has. Skip step 2 AND step 3 entirely. Go straight to step 4, the repo root checkout. |';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => moves to the repo root checkout because base cannot live in two worktrees at once', () => {
    const needle =
      'Move to the repo root checkout for the rest of the job. Base lives there, because the base branch cannot be checked out in two worktrees at once.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the base merge runs with cwd equal to the repo root checkout, never the worktree', () => {
    const needle =
      'Every git command in this step runs with cwd equal to the repo root checkout, never the worktree.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => commits the intake merge and every repair with a message beginning warpgate:', () => {
    const needle =
      'Commit the intake merge and every repair with a message beginning `warpgate:`. The worktree must be clean before you merge into the base branch.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // The commit-before-signal gate resolves the QUEST WORKTREE through questCwdResolveBroker. It
  // measures that tree for uncommitted changes. `warpgate` is in its CODE_CHANGING_ROLES set. This
  // step used to gate `done` on "the repo root checkout is clean", which names the wrong tree twice
  // over. The gate never reads the repo root. Step 5 deliberately leaves the user's own uncommitted
  // repo-root work in place. An agent debugging a refused signal inspected the clean repo root and
  // had nowhere left to look.
  it('VALID: template => names the quest worktree as the tree the commit gate measures', () => {
    expect({
      doneIsTheCommittedMergeOnBase: template.includes(
        "Signal `complete` with `operationStatus: 'done'` once the merge is committed on base in the repo root checkout.",
      ),
      gateMeasuresTheWorktree: template.includes(
        "A commit gate runs before that signal. The gate measures a DIFFERENT tree, the quest's WORKTREE. It refuses every outcome while that tree carries uncommitted changes, tracked or untracked. It refuses `done` and `blocked` alike. It never looks at the repo root at all.",
      ),
      sendsADirtyRefusalToTheWorktree: template.includes(
        '**If a signal comes back refused as dirty, run `git status` in the quest worktree. Not in the repo root you are standing in.**',
      ),
      noLongerGatesOnRepoRootCleanliness: template.includes('checkout is clean'),
    }).toStrictEqual({
      doneIsTheCommittedMergeOnBase: true,
      gateMeasuresTheWorktree: true,
      sendsADirtyRefusalToTheWorktree: true,
      noLongerGatesOnRepoRootCleanliness: false,
    });
  });

  it('VALID: template => a blocked signal names the specific files it could not resolve', () => {
    const needle =
      'Give a `blockedReason` NAMING THE SPECIFIC FILES. Name the exact paths you could not reconcile, or the uncommitted repo-root paths that checking out base would destroy.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // Warpgate is a work-item role that CHANGES FILES and runs its own ward, so it takes the role
  // side of every axis. Taking BOTH sides of one axis is the failure this pins: "run ward" and "run
  // no ward" in one block leaves the agent following whichever it reads first.
  //
  // The needles are LITERAL rather than read off a shared statics object. The operating rules used
  // to be interpolated from one, and this assertion compared the prompt against it — which stopped
  // being possible once each rule was inlined per prompt and then rewritten to the ward this role
  // actually runs, which is the WHOLE-REPO sweep rather than a scoped one. Hence `wardScoped` reads
  // false here while every other role-side key reads true.
  it('VALID: template => composes the work-item operating rules, and no piece meant for another reader', () => {
    expect({
      heading: template.includes('## Operating Rules'),
      turnEndRole: template.includes('Call `signal-back` as the last action of your turn, always.'),
      turnEndMinion: template.includes('Never call `signal-back`. Your final message is how you'),
      turnEndWhileHelperOut: template.includes(
        '**With everything you can do done and a helper still out, end your turn on a plain message and no tool call.** The notification brings you back.',
      ),
      wardScoped: template.includes('[WARD] Run ward scoped, in the foreground'),
      wardNone: template.includes('You run no build, no ward, no test and no check of any kind.'),
      delegationSynchronous: template.includes(
        'The `Agent`/Task tool is ASYNCHRONOUS, and so is a backgrounded command. A return only says the work STARTED.',
      ),
      delegationSpike: template.includes('You delegate LOOKING and CHECKING.'),
      delegationLeafBan: template.includes('You are the last agent in this chain.'),
      wallRole: template.includes("signal `operationStatus: 'blocked'`. Never `partial`."),
      wallMinion: template.includes('report it. Do not work around it.'),
      treeCleanRole: template.includes('Commit whatever you finished before you signal'),
      treeCleanOperator: template.includes('Your worktree must be clean before you signal.'),
    }).toStrictEqual({
      heading: true,
      turnEndRole: true,
      turnEndMinion: false,
      turnEndWhileHelperOut: true,
      wardScoped: false,
      wardNone: false,
      delegationSynchronous: true,
      delegationSpike: false,
      delegationLeafBan: false,
      wallRole: true,
      wallMinion: false,
      treeCleanRole: true,
      treeCleanOperator: false,
    });
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(warpgatePromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
