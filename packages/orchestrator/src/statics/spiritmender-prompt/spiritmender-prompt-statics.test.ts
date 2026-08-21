import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { slotManagerStatics } from '../slot-manager/slot-manager-statics';

import { spiritmenderPromptStatics } from './spiritmender-prompt-statics';

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
    const { template } = spiritmenderPromptStatics.prompt;
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
    const { template } = spiritmenderPromptStatics.prompt;
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
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // Both ward runs in this prompt use the named-file form, and no third form appears anywhere.
  // Operating Rule 3 is embedded in this same prompt. It promises "There are exactly TWO scoped
  // forms, and your own prompt tells you which one is yours — do not choose between them". This
  // prompt used to hand over a bare `npm run ward -- -- <files>`. That form is neither of the two.
  // It left the agent choosing against an instruction not to choose.
  it('VALID: template => runs the named-file ward form Rule 3 names, and no third form', () => {
    const { template } = spiritmenderPromptStatics.prompt;

    expect({
      reproduceForm: template.includes('npm run ward -- --only <checks> -- <the failing files>'),
      verifyForm: template.includes(
        'npm run ward -- --only <checks> -- <file1> <file2> <file1.test.ts>',
      ),
      namesWhichOfTheTwoFormsIsThisRoles: template.includes(
        "**Use the NAMED-FILE form of Operating Rule 3's two. Never `--staged`.**",
      ),
      namesTheValidCheckTypes: template.includes(
        'Only these five names are valid:\n\n1. `lint`\n2. `typecheck`\n3. `unit`\n4. `integration`\n5. `e2e`',
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

  // The "no failure" claim is true of work the session could have done, and of nothing else. It
  // used to be stated as an absolute, TWICE, bracketing the embedded Operating Rule 5 that MANDATES
  // `blocked` on an environment wall. Read as written, a spiritmender whose ward red is
  // environmental signals `partial`. The ward broker's spliced item is `locked`. The chain then
  // burns to its budget. The quest blocks anyway, three sessions after Operating Rule 5 would have
  // halted it in one.
  it('VALID: template => scopes "no failure" to work it could have done, and defers the wall to Rule 5', () => {
    const { template } = spiritmenderPromptStatics.prompt;

    expect({
      noFailedSignalForWorkItCouldHaveDone: template.includes(
        '**You have no `failed` signal for work you could have done.** Every error in the blob is yours to\nfix or to hand forward.',
      ),
      namesRule5AsTheException: template.includes(
        'Operating Rule 5 is the one exception. It covers an ENVIRONMENT wall only — a denied command, a\nmissing binary, an unreachable service.',
      ),
      namesTheCostOfGettingItWrong: template.includes(
        'Signal `blocked` for one of those, once. Three `partial`s\ninstead put three sessions in front of a wall none of them can pass.',
      ),
      theSecondStatementIsScopedToo: template.includes(
        "The one exception is\nOperating Rule 5's environment wall. That one is `blocked`.",
      ),
    }).toStrictEqual({
      noFailedSignalForWorkItCouldHaveDone: true,
      namesRule5AsTheException: true,
      namesTheCostOfGettingItWrong: true,
      theSecondStatementIsScopedToo: true,
    });
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = spiritmenderPromptStatics.prompt;
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
      'The ledger has exactly one writer, the orchestrator. A\nwrite to `operations` is rejected no matter who sends it, because `operations` is off the\nmodify-quest allowlist at every status.';
    const { template } = spiritmenderPromptStatics.prompt;
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
    const needle = `**Spend a \`partial\` only on scope you genuinely could not reach.** A \`partial\` is not free. The\norchestrator added your item to the ledger as a locked item. A locked item bounds its pt chain at\n${String(slotManagerStatics.spiritmender.maxAttempts)} attempts. Once that chain is spent, the quest BLOCKS for the user rather than getting a\nfresh session.`;
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => leaves the repo-wide re-verification to the fresh ward operation item', () => {
    const needle =
      '**You do NOT re-run the whole-repo ward to prove the build green.** A fresh ward operation item runs\nafter you. Re-verifying the repo is ITS job, not yours.';
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => trusts git over the ledger', () => {
    const needle = '**Trust git over the ledger.**';
    const { template } = spiritmenderPromptStatics.prompt;
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
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = spiritmenderPromptStatics.prompt;
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
    const { template } = spiritmenderPromptStatics.prompt;

    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf("signal: 'failed'")).toBe(-1);
    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('BLOCKs the quest')).toBe(-1);
    expect(template.indexOf('replan')).toBe(-1);
  });

  // Spiritmender is a work-item role that CHANGES FILES and runs its own scoped ward, so it takes
  // the role side of all three axes. The actual side of this assertion is built from the statics,
  // so a piece added there arrives here as an unexpected key rather than going unnoticed. Taking
  // both sides of one axis would put "run ward scoped" and "run no ward" in one block, and the
  // agent follows whichever it reads first.
  it('VALID: template => composes the work-item operating rules, and no piece meant for another reader', () => {
    const { template } = spiritmenderPromptStatics.prompt;

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
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
