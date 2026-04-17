import { blightwardenSecurityMinionStatics } from './blightwarden-security-minion-statics';

describe('blightwardenSecurityMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenSecurityMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 1500 characters', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template.length).toBeGreaterThan(1500);
  });

  it('VALID: template => Step 1 instructs get-quest call', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^- `get-quest` with `\{ questId: "QUEST_ID", format: 'text' \}` to read the spec$/mu,
    );
  });

  it('VALID: template => Step 1 runs git diff main...HEAD', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^Then run `git diff main\.\.\.HEAD --name-only` to get the real list of changed files for this branch\. Do NOT try to re-derive the diff from the quest spec — use the actual git output\.$/mu,
    );
  });

  it('VALID: template => findings require file:line evidence', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^- \*\*file:line\*\* — the file and line where the unsafe sink is reached$/mu,
    );
  });

  it('VALID: template => commit instructions use minion: security and blightReports[]', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^ {8}minion: "security",$/mu,
    );
  });

  it('VALID: template => signal-back section uses complete signal', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^ {2}signal: 'complete',$/mu,
    );
  });
});
