import { blightwardenDeadCodeMinionStatics } from './blightwarden-dead-code-minion-statics';

describe('blightwardenDeadCodeMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenDeadCodeMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 1500 characters', () => {
    expect(blightwardenDeadCodeMinionStatics.prompt.template.length).toBeGreaterThan(1500);
  });

  it('VALID: template => runs git diff main...HEAD', () => {
    expect(blightwardenDeadCodeMinionStatics.prompt.template).toMatch(
      /^Then run `git diff main\.\.\.HEAD --name-only` and `git diff main\.\.\.HEAD` to see the actual added\/modified code\.$/mu,
    );
  });

  it('VALID: template => findings require file:line evidence', () => {
    expect(blightwardenDeadCodeMinionStatics.prompt.template).toMatch(
      /^- \*\*file:line\*\* — the file and line where the orphan or unreachable code lives$/mu,
    );
  });

  it('VALID: template => commit instructions use minion: dead-code', () => {
    expect(blightwardenDeadCodeMinionStatics.prompt.template).toMatch(
      /^ {8}minion: "dead-code",$/mu,
    );
  });

  it('VALID: template => searches for importers with discover grep', () => {
    expect(blightwardenDeadCodeMinionStatics.prompt.template).toMatch(
      /^For each new export, use `discover` with `grep` on the export name across the whole monorepo\. Be precise — match on word boundary or a clear import-shape regex so you do not get fuzzy matches\.$/mu,
    );
  });

  it('VALID: template => signal-back section uses complete signal', () => {
    expect(blightwardenDeadCodeMinionStatics.prompt.template).toMatch(
      /^ {2}signal: 'complete',$/mu,
    );
  });
});
