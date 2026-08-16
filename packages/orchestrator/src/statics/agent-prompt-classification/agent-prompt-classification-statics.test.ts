import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => lists every served prompt, the work-item roles, and the parent-summoned minions', () => {
      expect(agentPromptClassificationStatics).toStrictEqual({
        promptNames: [
          'chaoswhisperer-gap-minion',
          'planner-minion',
          'worker-minion',
          'reviewer-minion',
          'codeweaver',
          'spiritmender',
          'flowrider',
          'groundstomper',
          'siegemaster',
          'pesteater',
          'warpgate',
        ],
        roleNames: [
          'codeweaver',
          'flowrider',
          'groundstomper',
          'siegemaster',
          'pesteater',
          'spiritmender',
          'warpgate',
        ],
        minionNames: [
          'chaoswhisperer-gap-minion',
          'planner-minion',
          'worker-minion',
          'reviewer-minion',
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
      'VALID: {promptName: %s} => is classified as exactly one of role or minion',
      (promptName) => {
        expect({
          isRole: agentPromptClassificationStatics.roleNames.some((name) => name === promptName),
          isMinion: agentPromptClassificationStatics.minionNames.some(
            (name) => name === promptName,
          ),
        }).toStrictEqual({
          isRole: agentPromptClassificationStatics.minionNames.every((name) => name !== promptName),
          isMinion: agentPromptClassificationStatics.roleNames.every((name) => name !== promptName),
        });
      },
    );
  });
});
