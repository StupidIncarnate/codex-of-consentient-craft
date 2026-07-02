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
      /^Then run `git diff <main-or-master>\.\.\.HEAD --name-only` \(diff against your repo's default branch — `main` or `master`, whichever exists\) to get the real list of changed files for this branch\. Do NOT try to re-derive the diff from the quest spec — use the actual git output\.$/mu,
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

  it('VALID: template => finding example uses a ./-prefixed relative path (valid FilePath)', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^ {12}file: "\.\/packages\/\{pkg\}\/src\/\{path\}",$/mu,
    );
  });

  it('VALID: template => return summary section instructs no signal-back', () => {
    expect(blightwardenSecurityMinionStatics.prompt.template).toMatch(
      /^You have no work item, so do NOT call `signal-back`\. Return a one-line summary as your final message for the synthesizer to read:$/mu,
    );
  });
});
