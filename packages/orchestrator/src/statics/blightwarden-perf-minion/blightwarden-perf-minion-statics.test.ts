import { blightwardenPerfMinionStatics } from './blightwarden-perf-minion-statics';

describe('blightwardenPerfMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenPerfMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 1500 characters', () => {
    expect(blightwardenPerfMinionStatics.prompt.template.length).toBeGreaterThan(1500);
  });

  it('VALID: template => runs git diff main...HEAD', () => {
    expect(blightwardenPerfMinionStatics.prompt.template).toMatch(
      /^Then run `git diff <main-or-master>\.\.\.HEAD --name-only` \(diff against your repo's default branch — `main` or `master`, whichever exists\) to get the real list of changed files\.$/mu,
    );
  });

  it('VALID: template => findings require file:line evidence', () => {
    expect(blightwardenPerfMinionStatics.prompt.template).toMatch(
      /^- \*\*file:line\*\* — the line with the offending pattern$/mu,
    );
  });

  it('VALID: template => commit instructions use minion: perf', () => {
    expect(blightwardenPerfMinionStatics.prompt.template).toMatch(/^ {8}minion: "perf",$/mu);
  });

  it('VALID: template => calls out N+1 query pattern', () => {
    expect(blightwardenPerfMinionStatics.prompt.template).toMatch(/^\*\*N\+1 queries:\*\*$/mu);
  });

  it('VALID: template => calls out sync I/O in async', () => {
    expect(blightwardenPerfMinionStatics.prompt.template).toMatch(
      /^\*\*Sync I\/O in async:\*\*$/mu,
    );
  });

  it('VALID: template => return summary section instructs no signal-back', () => {
    expect(blightwardenPerfMinionStatics.prompt.template).toMatch(
      /^You have no work item, so do NOT call `signal-back`\. Return a one-line summary as your final message for the synthesizer to read:$/mu,
    );
  });
});
