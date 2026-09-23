import { spiritmenderPromptStatics } from './spiritmender-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `template` is bound with every whitespace run — spaces,
// newlines, indent — collapsed to a single space, so a needle written on ONE line finds its
// sentence however the prompt happens to wrap. Re-flowing a paragraph in the statics file then
// reds nothing that is still true, which is why no needle below carries an escaped newline. The
// line-anchored `toMatch` assertions read `spiritmenderPromptStatics.prompt.template` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const template = spiritmenderPromptStatics.prompt.template.replace(WHITESPACE_RUN, ' ');

describe('spiritmenderPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(spiritmenderPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(spiritmenderPromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: title => frames Spiritmender as a ward recovery relay worker', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(
      /^# Spiritmender - Ward Recovery Relay Worker$/mu,
    );
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => reads the ward failure from the Operation Context blob rows', () => {
    const resultRow = '| **Failed ward result** | The id of the ward run that went red. |';
    const blobRow =
      '| **Ward detail blob** | A `<questFolder>/ward-results/<id>.json` path. `Read` it for the full error output: files, error messages, jest diffs. |';
    const foundResult = template.slice(
      template.indexOf(resultRow),
      template.indexOf(resultRow) + resultRow.length,
    );
    const foundBlob = template.slice(
      template.indexOf(blobRow),
      template.indexOf(blobRow) + blobRow.length,
    );

    expect({ foundResult, foundBlob }).toStrictEqual({
      foundResult: resultRow,
      foundBlob: blobRow,
    });
  });

  it('VALID: template => reproduces the failures itself with a scoped ward run', () => {
    const needle =
      'Re-run ward SCOPED to the failing files the blob names, so you see the errors live.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // Both ward runs in this prompt use the named-file form, and no third form appears anywhere.
  // [WARD] is embedded in this same prompt and now names exactly ONE form — the named-file one —
  // because this session runs no other. It used to describe two and leave the reader to pick,
  // while this prompt separately handed over a bare `npm run ward -- -- <files>`, which is neither.
  // The ban on the two git scope flags stays: either sweeps a whole half of the branch instead of
  // the failures sent here.
  it('VALID: template => runs the named-file ward form [WARD] names, and no third form', () => {
    expect({
      reproduceForm: template.includes('npm run ward -- --only <checks> -- <the failing files>'),
      verifyForm: template.includes(
        'npm run ward -- --only <checks> -- <file1> <file2> <file1.test.ts>',
      ),
      namesWhichOfTheTwoFormsIsThisRoles: template.includes(
        '**Name the failing files, as [WARD] directs. Never `--committed` or `--uncommitted`.**',
      ),
      namesTheValidCheckTypes: template.includes(
        'Only these five names are valid: 1. `lint` 2. `typecheck` 3. `unit` 4. `integration` 5. `e2e`',
      ),
      carriesNoUnscopedForm: template.includes('npm run ward -- -- '),
    }).toStrictEqual({
      reproduceForm: true,
      verifyForm: true,
      namesWhichOfTheTwoFormsIsThisRoles: true,
      namesTheValidCheckTypes: true,
      carriesNoUnscopedForm: false,
    });
  });

  // The "no failure, no partial" claim is true of work the session could have done, and of nothing
  // else. Stated as an absolute it brackets the embedded [WALL] rule that MANDATES `blocked` on an
  // environment wall, so both statements are pinned WITH their exception clause.
  it('VALID: template => scopes "no failure, no partial" to work it could have done, and defers the wall to [WALL]', () => {
    expect({
      noFailedOrPartialSignalForWorkItCouldHaveDone: template.includes(
        '**You have no `failed` signal for work you could have done, and no `partial` signal either — that outcome no longer exists.**',
      ),
      namesWallAsTheException: template.includes(
        '[WALL] below is the one exception. It covers an ENVIRONMENT wall only — a denied command, a missing binary, an unreachable service. Signal `blocked` for one of those.',
      ),
      theSecondStatementIsScopedToo: template.includes(
        "The one exception is [WALL]'s environment wall. That one is `blocked`.",
      ),
    }).toStrictEqual({
      noFailedOrPartialSignalForWorkItCouldHaveDone: true,
      namesWallAsTheException: true,
      theSecondStatementIsScopedToo: true,
    });
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // The orchestrator is the ledger's only writer. This prompt used to name ChaosWhisperer as a
  // second one. ChaosWhisperer never was one: `operations` sits on NO status's `allowedFields` in
  // questStatusInputAllowlistStatics, so every modify-quest{operations} write is rejected whatever
  // the status and whoever the caller. The codeweaver ledger is DERIVED at Start Quest by
  // questBuildRelayGraphBroker. Naming a second writer tells this session that a write it will
  // never see happen is somebody's normal business.
  it('VALID: template => names the orchestrator as the only writer of the ledger', () => {
    const needle =
      'The ledger has exactly one writer, the orchestrator. A write to `operations` is rejected no matter who sends it, because `operations` is off the modify-quest allowlist at every status.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // `partial` no longer exists as a signal outcome — the contract that validates `signal-back`
  // input is `.strict()` and declares no operation-outcome field at all, so a prompt telling the
  // session to send one, or claiming a bounded "pt N" chain off it, describes a call the tool
  // refuses outright. The template still SAYS the outcome is retired (see the "no `partial` signal
  // either" sentence near the top), so this checks for the stale IMPERATIVE forms, not the word.
  it('VALID: template => carries no operationStatus field and no pt-chain budget claim', () => {
    expect({
      operationStatus: template.includes('operationStatus'),
      ptChainBudget: template.includes('pt chain'),
      spendAPartial: template.includes('Spend a `partial`'),
      signalPartialImperative: template.includes('Signal `partial`'),
    }).toStrictEqual({
      operationStatus: false,
      ptChainBudget: false,
      spendAPartial: false,
      signalPartialImperative: false,
    });
  });

  // The legacy pt-splice path minted spiritmender as a numbered chain continuation ("pt N:"); the
  // step graph mints it fresh off a red `ward` step instead, and the regression pass that runs
  // after this session is that same family's `ward` step, not an MCP `run-ward` item.
  it('VALID: template => names the family ward step as the regression pass, never a dispatcher run-ward item', () => {
    const needle =
      "an orchestrator-dispatched role never runs the full sweep, and the family's own `ward` step is the regression pass that runs after you";
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('run-ward')).toBe(-1);
  });

  it('VALID: template => carries no pt-chain prefix claim, and says a red ward step mints a fresh item', () => {
    const needle =
      'a red `ward` step mints a fresh spiritmender item every time, never a numbered continuation';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('pt N')).toBe(-1);
  });

  it('VALID: template => leaves the repo-wide re-verification to the fresh ward operation item', () => {
    const needle =
      '**You do NOT re-run the whole-repo ward to prove the repo green.** A fresh ward operation item runs after you. Re-verifying the repo is ITS job, not yours.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => sends the session to git for what prior sessions built', () => {
    const needle = '**Git is your only record of what prior sessions built.**';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => keeps the anti-cheating guardrails (Do NOT section)', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^\*\*Do NOT:\*\*$/mu);
  });

  it('VALID: template => has the commit-before-signal section with the handoff doctrine', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);

    const needle =
      '**The commit message is the ONLY handoff channel.** Git carries the context, not the ledger.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals the same bare complete call whether the fix is whole or partial', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID' \}\)$/mu,
    );
  });

  it('VALID: template => carries no legacy signal or planning-model references', () => {
    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf("signal: 'failed'")).toBe(-1);
    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('BLOCKs the quest')).toBe(-1);
    expect(template.indexOf('replan')).toBe(-1);
  });

  // Spiritmender is a work-item role that CHANGES FILES and runs its own scoped ward, so it takes
  // the role side of every axis. Taking BOTH sides of one axis is the failure this pins: "run ward
  // scoped" and "run no ward" in one block leaves the agent following whichever it reads first.
  //
  // The needles are LITERAL rather than read off a shared statics object. The operating rules used
  // to be interpolated from one, and this assertion compared the prompt against it — which stopped
  // being possible once each rule was inlined per prompt and then trimmed to the one ward form that
  // prompt actually runs. A literal needle survives that; an identity compare did not.
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
        'The `Agent`/Task tool is ASYNCHRONOUS. A return only says the work STARTED.',
      ),
      delegationSpike: template.includes('You delegate LOOKING and CHECKING.'),
      delegationLeafBan: template.includes('You are the last agent in this chain.'),
      wallRole: template.includes(
        '[WALL] When the ENVIRONMENT blocks you rather than the work, signal `blocked`.',
      ),
      wallMinion: template.includes('report it. Do not work around it.'),
      gitFormsRule: template.includes(
        '[GIT FORMS] Two git forms are refused whatever the verb, and both have a working substitute.',
      ),
      wallNamesGitFormsAsNotAWall: template.includes(
        'A `git -C` or a chained/piped git command refused the same way is [GIT FORMS], not a wall',
      ),
      treeCleanRole: template.includes('Commit whatever you finished before you signal'),
      treeCleanOperator: template.includes('Your worktree must be clean before you signal.'),
    }).toStrictEqual({
      heading: true,
      turnEndRole: true,
      turnEndMinion: false,
      turnEndWhileHelperOut: true,
      wardScoped: true,
      wardNone: false,
      delegationSynchronous: true,
      delegationSpike: false,
      delegationLeafBan: false,
      wallRole: true,
      wallMinion: false,
      gitFormsRule: true,
      wallNamesGitFormsAsNotAWall: true,
      treeCleanRole: true,
      treeCleanOperator: false,
    });
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
