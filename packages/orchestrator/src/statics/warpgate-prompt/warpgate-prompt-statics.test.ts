import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { warpgatePromptStatics } from './warpgate-prompt-statics';

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
    const { template } = warpgatePromptStatics.prompt;
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
      'The ledger has exactly one writer, the orchestrator.\nThe modify-quest tool rejects the `operations` field whoever sends it, because `operations` is\noff its allowlist at every status.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git fetch and git push', () => {
    const needle =
      '| `git fetch` | You read the base branch you compare against from the quest. Never from origin. |\n| `git push` | You are done once the merge lands on the local base branch. The user decides whether to publish it, outside this session. |';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git stash', () => {
    const needle =
      "| `git stash` | Never hide work behind a stash. Not yours, and not the repo root checkout's. |";
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // The prompt has to state this exception itself, rather than leave it to whichever rule the
  // session reads first. Rule 3, embedded in this same prompt, says NEVER run the whole-repo
  // `npm run ward`. Rule 2 says a command the harness auto-backgrounds strands the turn. This role
  // is the one legitimate exception. A base merge can break files outside the quest's own. A
  // scoped run cannot see those.
  it('VALID: template => names its whole-repo ward as the deliberate exception to Rule 3, run in the background', () => {
    const { template } = warpgatePromptStatics.prompt;

    expect({
      wholeRepo: template.includes('`npm run ward`, whole-repo, no\n`--only` and no paths'),
      isTheException: template.includes(
        '**This is a deliberate exception to Operating Rule 3 above. It is the\nonly exception on the quest.**',
      ),
      namesWhyScopedCannotWork: template.includes(
        "You are checking that a BASE MERGE did not break something\noutside the quest's own files. A scoped run cannot see that.",
      ),
      runsItRule2sWay: template.includes(
        'Run it the way Rule 2 allows, because the harness auto-backgrounds a whole-repo run. Do these\nthree things, in order:\n\n1. Set `run_in_background: true`.\n2. Wait for the task notification.\n3. Read the output once.',
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
      '**Read its exit code and branch on it.** Do NOT run ward and then move on without reading what\nit returned.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => never merges into base while ward is red', () => {
    const needle =
      'You never merge into the base branch while ward is red. The base branch tip stays exactly where\nit started for as long as ward is red.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => moves work onto base only once the quest branch is green', () => {
    const needle =
      'Base never receives an unproven merge, because the work\nmoves onto base only once the branch is green.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => skips intake and the full ward run when base is already an ancestor', () => {
    const needle =
      '| Already an ancestor | The quest branch already contains everything base has. Skip step 2 AND step 3 entirely. Go straight to step 4, the repo root checkout. |';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => moves to the repo root checkout because base cannot live in two worktrees at once', () => {
    const needle =
      'Move to the repo root checkout for the rest of the job. Base lives there, because the base\nbranch cannot be checked out in two worktrees at once.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the base merge runs with cwd equal to the repo root checkout, never the worktree', () => {
    const needle =
      'Every git command in this step runs with cwd equal to the repo root checkout, never the\nworktree.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => commits the intake merge and every repair with a message beginning warpgate:', () => {
    const needle =
      'Commit the intake merge and every repair with a message beginning `warpgate:`. The worktree\nmust be clean before you merge into the base branch.';
    const { template } = warpgatePromptStatics.prompt;
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
    const { template } = warpgatePromptStatics.prompt;

    expect({
      doneIsTheCommittedMergeOnBase: template.includes(
        "Signal `complete` with `operationStatus: 'done'` once the merge is committed on base in the\nrepo root checkout.",
      ),
      gateMeasuresTheWorktree: template.includes(
        "A commit gate runs before that signal. The gate measures a DIFFERENT tree, the quest's WORKTREE.\nIt refuses every outcome while that tree carries uncommitted changes, tracked or untracked. It\nrefuses `done` and `blocked` alike. It never looks at the repo root at all.",
      ),
      sendsADirtyRefusalToTheWorktree: template.includes(
        '**If a signal comes back refused as dirty, run `git status` in the quest worktree. Not in the\nrepo root you are standing in.**',
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
      'Give a `blockedReason` NAMING THE SPECIFIC FILES. Name the exact paths you could not\nreconcile, or the uncommitted repo-root paths that checking out base would destroy.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // Warpgate is a work-item role that CHANGES FILES and runs its own ward, so it takes the role
  // side of all three axes. The actual side of this assertion is built from the statics, so a piece
  // added there arrives here as an unexpected key rather than going unnoticed. Taking both sides of
  // one axis would put "run ward scoped" and "run no ward" in one block, and the agent follows
  // whichever it reads first.
  it('VALID: template => composes the work-item operating rules, and no piece meant for another reader', () => {
    const { template } = warpgatePromptStatics.prompt;

    expect(
      Object.fromEntries(
        Object.entries(agentOperatingRulesStatics).map(([key, piece]) => [
          key,
          template.includes(piece),
        ]),
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
      treeCleanRole: true,
      treeCleanOperator: false,
    });
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(warpgatePromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
