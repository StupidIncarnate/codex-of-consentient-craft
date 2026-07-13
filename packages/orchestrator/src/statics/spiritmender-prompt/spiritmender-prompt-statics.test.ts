import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

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

  it('VALID: template => reads the ward failure from the Operation Context blob lines', () => {
    const resultLine = '- **Failed ward result** — the id of the ward run that went red';
    const blobLine =
      '- **Ward detail blob** — a `<questFolder>/ward-results/<id>.json` path; `Read` it for the full error output (files, error messages, jest diffs)';
    const { template } = spiritmenderPromptStatics.prompt;
    const foundResult = template.slice(
      template.indexOf(resultLine),
      template.indexOf(resultLine) + resultLine.length,
    );
    const foundBlob = template.slice(
      template.indexOf(blobLine),
      template.indexOf(blobLine) + blobLine.length,
    );

    expect({ foundResult, foundBlob }).toStrictEqual({
      foundResult: resultLine,
      foundBlob: blobLine,
    });
  });

  it('VALID: template => reproduces the failures itself with a scoped ward run', () => {
    const needle =
      '**Also reproduce the failures yourself**: re-run ward SCOPED to the failing files from the blob';
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.** You have no failure signal.';
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
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

  it('VALID: template => leaves the repo-wide re-verification to the fresh ward operation item', () => {
    const needle =
      '**You do NOT re-run the whole-repo ward to prove the build green.** A fresh ward operation item\nruns after you and re-verifies the repo — that is ITS job.';
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
      '**The commit message is the ONLY handoff channel — git carries the context, not the ledger.**';
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

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = spiritmenderPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
