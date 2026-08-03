import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => lists every served prompt, the work-item roles, and the parent-summoned minions', () => {
      expect(agentPromptClassificationStatics).toStrictEqual({
        promptNames: [
          'chaoswhisperer-gap-minion',
          'codeweaver',
          'codeweaver-minion',
          'lawbringer',
          'lawbringer-minion',
          'spiritmender',
          'flowrider',
          'flowrider-minion',
          'siegemaster',
          'siegemaster-minion',
          'siegemaster-test-audit-minion',
          'blightwarden',
          'blightwarden-security-minion',
          'blightwarden-dedup-minion',
          'blightwarden-perf-minion',
          'blightwarden-integrity-minion',
          'blightwarden-dead-code-minion',
          'pesteater',
        ],
        roleNames: [
          'codeweaver',
          'spiritmender',
          'lawbringer',
          'flowrider',
          'siegemaster',
          'blightwarden-security-minion',
          'blightwarden-dedup-minion',
          'blightwarden-perf-minion',
          'blightwarden-integrity-minion',
          'blightwarden-dead-code-minion',
          'blightwarden',
          'pesteater',
        ],
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

  describe('promptNames is the superset the other two partition', () => {
    it.each(agentPromptClassificationStatics.roleNames)(
      'VALID: {roleName: %s} => is also a served prompt name',
      (roleName) => {
        expect(agentPromptClassificationStatics.promptNames.some((name) => name === roleName)).toBe(
          true,
        );
      },
    );

    it.each(agentPromptClassificationStatics.minionNames)(
      'VALID: {minionName: %s} => is also a served prompt name',
      (minionName) => {
        expect(
          agentPromptClassificationStatics.promptNames.some((name) => name === minionName),
        ).toBe(true);
      },
    );

    it.each(agentPromptClassificationStatics.promptNames)(
      'VALID: {promptName: %s} => is classified as a role, a minion, or both',
      (promptName) => {
        const classified = [
          ...agentPromptClassificationStatics.roleNames,
          ...agentPromptClassificationStatics.minionNames,
        ];

        expect(classified.some((name) => name === promptName)).toBe(true);
      },
    );
  });
});
