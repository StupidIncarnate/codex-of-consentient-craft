import { slotManagerStatics } from '../slot-manager/slot-manager-statics';

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
  // The ban on `--staged` stays: it sweeps the whole branch instead of the failures sent here.
  it('VALID: template => runs the named-file ward form [WARD] names, and no third form', () => {
    expect({
      reproduceForm: template.includes('npm run ward -- --only <checks> -- <the failing files>'),
      verifyForm: template.includes(
        'npm run ward -- --only <checks> -- <file1> <file2> <file1.test.ts>',
      ),
      namesWhichOfTheTwoFormsIsThisRoles: template.includes(
        '**Name the failing files, as [WARD] directs. Never `--staged`.**',
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

  // The "no failure" claim is true of work the session could have done, and of nothing else. Stated
  // as an absolute it brackets the embedded [WALL] rule that MANDATES `blocked` on an environment
  // wall, and a spiritmender reading it as written signals `partial` on a ward red that is
  // environmental. The ward broker's spliced item is `locked`. The chain then burns to its budget.
  // The quest blocks anyway, three sessions after [WALL] would have halted it in one. Each of the
  // two statements is therefore pinned WITH its exception clause.
  it('VALID: template => scopes "no failure" to work it could have done, and defers the wall to [WALL]', () => {
    expect({
      noFailedSignalForWorkItCouldHaveDone: template.includes(
        '**You have no `failed` signal for work you could have done.** Every error in the blob is yours to fix or to hand forward.',
      ),
      namesWallAsTheException: template.includes(
        '[WALL] below is the one exception. It covers an ENVIRONMENT wall only — a denied command, a missing binary, an unreachable service.',
      ),
      namesTheCostOfGettingItWrong: template.includes(
        'Signal `blocked` for one of those, once. Three `partial`s instead put three sessions in front of a wall none of them can pass.',
      ),
      theSecondStatementIsScopedToo: template.includes(
        "The one exception is [WALL]'s environment wall. That one is `blocked`.",
      ),
    }).toStrictEqual({
      noFailedSignalForWorkItCouldHaveDone: true,
      namesWallAsTheException: true,
      namesTheCostOfGettingItWrong: true,
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

  // `partial` must read as a bounded chain, not an unbounded one. A `partial` creates a locked
  // "pt N" spiritmender item. slotManagerStatics.spiritmender.maxAttempts then bounds that chain.
  // A spent chain BLOCKS the quest rather than continuing it. Stated as "a fresh session picks up"
  // alone, `partial` reads as an unbounded chain.
  it('VALID: template => bounds a partial by the spiritmender pt-chain budget', () => {
    const needle = `**Spend a \`partial\` only on scope you genuinely could not reach.** A \`partial\` is not free. The orchestrator added your item to the ledger as a locked item. A locked item bounds its pt chain at ${String(slotManagerStatics.spiritmender.maxAttempts)} attempts. Once that chain is spent, the quest BLOCKS for the user rather than getting a fresh session.`;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => leaves the repo-wide re-verification to the fresh ward operation item', () => {
    const needle =
      '**You do NOT re-run the whole-repo ward to prove the build green.** A fresh ward operation item runs after you. Re-verifying the repo is ITS job, not yours.';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => trusts git over the ledger', () => {
    const needle = '**Trust git over the ledger.**';
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

  it('VALID: template => signals done when the named failures are fixed and scoped ward is green', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => signals partial with a committed handoff when scope remains', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
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
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
