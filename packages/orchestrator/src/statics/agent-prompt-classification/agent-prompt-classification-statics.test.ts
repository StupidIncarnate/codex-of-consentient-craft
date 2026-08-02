import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  it('VALID: minionNames => contains the parent-summoned minion names', () => {
    expect(agentPromptClassificationStatics).toStrictEqual({
      minionNames: [
        'chaoswhisperer-gap-minion',
        'codeweaver-minion',
        'lawbringer-minion',
        'flowrider-minion',
        'siegemaster-minion',
        'siegemaster-test-audit-minion',
        'blightwarden-security-minion',
        'blightwarden-dedup-minion',
        'blightwarden-perf-minion',
        'blightwarden-integrity-minion',
        'blightwarden-dead-code-minion',
      ],
    });
  });
});
