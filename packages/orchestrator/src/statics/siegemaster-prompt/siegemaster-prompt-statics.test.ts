import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

describe('siegemasterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => Phase 3 body line covers git diff + folder mapping + over-auditing guidance', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^Run `git diff main\.\.\.HEAD --name-only` to get the full changed file list for this branch\. Using the flow's semantic content \(entryPoint, node labels, observable descriptions and types\), judge which changed files are in your slice\. Observable type tags help: `ui-state` → widgets; `api-call` → responders; `file-exists` → brokers\/transformers touching those files; `log-output` → process entry points\. For files that land in a `flows\/` or `startup\/` folder type, locate the colocated `\.integration\.test\.ts` and audit it — is it real or faked\? When in doubt about whether a changed file belongs to your slice, include it and audit — over-auditing is cheap, missing is expensive\.$/mu,
    );
  });

  it('VALID: template => Phase 3 skip-detection line contains exact skip literal', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^\*\*Phase 3 skip detection:\*\* If no changed files in your slice land in a `flows\/` or `startup\/` folder type, state "Phase 3 skipped: no flow\/startup files changed in this slice" and proceed to Phase 4\.$/mu,
    );
  });

  it('VALID: template => Signaling section warns against FAILED OBSERVABLES in complete summary', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^\*\*Warning:\*\* Do NOT include the literal string `FAILED OBSERVABLES:` in any complete-signal summary\.$/mu,
    );
  });

  it('VALID: template => failure-summary guidance references Nodes block for observable-id placeholder', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^Use observable IDs from the Nodes block when populating `\{observable-id\}` placeholders\.$/mu,
    );
  });
});
