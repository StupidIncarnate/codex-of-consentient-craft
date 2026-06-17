import { blightwardenIntegrityMinionStatics } from './blightwarden-integrity-minion-statics';

describe('blightwardenIntegrityMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenIntegrityMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 1500 characters', () => {
    expect(blightwardenIntegrityMinionStatics.prompt.template.length).toBeGreaterThan(1500);
  });

  it('VALID: template => runs git diff main...HEAD', () => {
    expect(blightwardenIntegrityMinionStatics.prompt.template).toMatch(
      /^Then run `git diff <main-or-master>\.\.\.HEAD --name-only` \(diff against your repo's default branch — `main` or `master`, whichever exists\) to get the real list of changed files\. Also run `git diff <main-or-master>\.\.\.HEAD` \(without `--name-only`\) to see the actual changes — you need to know WHAT changed, not just which files\.$/mu,
    );
  });

  it('VALID: template => findings require file:line evidence', () => {
    expect(blightwardenIntegrityMinionStatics.prompt.template).toMatch(
      /^- \*\*file:line\*\* — the consumer file and line that breaks$/mu,
    );
  });

  it('VALID: template => commit instructions use minion: integrity', () => {
    expect(blightwardenIntegrityMinionStatics.prompt.template).toMatch(
      /^ {8}minion: "integrity",$/mu,
    );
  });

  it('VALID: template => enumerates consumers via discover grep', () => {
    expect(blightwardenIntegrityMinionStatics.prompt.template).toMatch(
      /^For each changed export, use `discover` with `grep` on the export name across the monorepo\. Record every file that imports the export\. Then for each consumer:$/mu,
    );
  });

  it('VALID: template => return summary section instructs no signal-back', () => {
    expect(blightwardenIntegrityMinionStatics.prompt.template).toMatch(
      /^You have no work item, so do NOT call `signal-back`\. Return a one-line summary as your final message for the synthesizer to read:$/mu,
    );
  });
});
