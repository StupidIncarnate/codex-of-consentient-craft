import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  it('VALID: minionNames => contains the 6 parent-dispatched minion names', () => {
    expect(agentPromptClassificationStatics).toStrictEqual({
      minionNames: [
        'chaoswhisperer-gap-minion',
        'blightwarden-security-minion',
        'blightwarden-dedup-minion',
        'blightwarden-perf-minion',
        'blightwarden-integrity-minion',
        'blightwarden-dead-code-minion',
      ],
    });
  });
});
