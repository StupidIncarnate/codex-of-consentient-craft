import { blightwardenDedupMinionStatics } from './blightwarden-dedup-minion-statics';

describe('blightwardenDedupMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenDedupMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 1500 characters', () => {
    expect(blightwardenDedupMinionStatics.prompt.template.length).toBeGreaterThan(1500);
  });

  it('VALID: template => references duplicate-detection broker', () => {
    expect(blightwardenDedupMinionStatics.prompt.template).toMatch(
      /^This codebase ships a literal\/AST duplication detector at `packages\/tooling\/src\/brokers\/duplicate-detection\/`\. Use it as a first pass to find exact and near-exact matches\. Check its README or folder detail:$/mu,
    );
  });

  it('VALID: template => runs git diff main...HEAD', () => {
    expect(blightwardenDedupMinionStatics.prompt.template).toMatch(
      /^Then run `git diff main\.\.\.HEAD --name-only` to get the real list of changed files\.$/mu,
    );
  });

  it('VALID: template => findings require file:line evidence', () => {
    expect(blightwardenDedupMinionStatics.prompt.template).toMatch(
      /^- \*\*file:line\*\* — the duplicate file and line \(for within-diff, flag the duplicate-added file; for missed-existing, flag the new file\)$/mu,
    );
  });

  it('VALID: template => commit instructions use minion: dedup', () => {
    expect(blightwardenDedupMinionStatics.prompt.template).toMatch(/^ {8}minion: "dedup",$/mu);
  });

  it('VALID: template => signal-back section uses complete signal', () => {
    expect(blightwardenDedupMinionStatics.prompt.template).toMatch(/^ {2}signal: 'complete',$/mu);
  });
});
