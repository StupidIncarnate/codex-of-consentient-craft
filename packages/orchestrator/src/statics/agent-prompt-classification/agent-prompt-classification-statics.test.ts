import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => lists every served prompt, the work-item roles, the parent-summoned minions, and the three that own an operation item', () => {
      expect(agentPromptClassificationStatics).toStrictEqual({
        promptNames: [
          'chaoswhisperer-gap-minion',
          'codeweaver',
          'codeweaver-planner',
          'codeweaver-reviewer',
          'codeweaver-worker',
          'flowrider',
          'flowrider-planner',
          'flowrider-reviewer',
          'flowrider-worker',
          'recipe-maker',
          'siege-adversarial-fixer',
          'siege-adversarial-walker',
          'siege-happy-fixer',
          'siege-happy-walker',
          'siege-planner',
          'siegemaster',
          'siegemaster-reader',
          'spiritmender',
          'warpgate',
        ],
        roleNames: ['codeweaver', 'flowrider', 'siegemaster', 'spiritmender', 'warpgate'],
        minionNames: ['chaoswhisperer-gap-minion'],
        operatorRoleNames: ['codeweaver', 'flowrider', 'siegemaster'],
      });
    });
  });

  describe('roleNames and minionNames are disjoint subsets of promptNames', () => {
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

    it.each(agentPromptClassificationStatics.roleNames)(
      'VALID: {roleName: %s} => is not in minionNames',
      (roleName) => {
        expect(
          agentPromptClassificationStatics.minionNames.some(
            (name) => (name as unknown) === roleName,
          ),
        ).toBe(false);
      },
    );

    it.each(agentPromptClassificationStatics.minionNames)(
      'VALID: {minionName: %s} => is not in roleNames',
      (minionName) => {
        expect(
          agentPromptClassificationStatics.roleNames.some(
            (name) => (name as unknown) === minionName,
          ),
        ).toBe(false);
      },
    );
  });

  describe('step prompts are in promptNames but neither role nor minion', () => {
    it('VALID: {promptNames} => remaining prompts outside roleNames and minionNames are the 13 step prompts', () => {
      const nonStepNames = new Set<unknown>([
        ...agentPromptClassificationStatics.roleNames,
        ...agentPromptClassificationStatics.minionNames,
      ]);
      const stepPrompts = agentPromptClassificationStatics.promptNames.filter(
        (name) => !nonStepNames.has(name),
      );

      expect(stepPrompts).toStrictEqual([
        'codeweaver-planner',
        'codeweaver-reviewer',
        'codeweaver-worker',
        'flowrider-planner',
        'flowrider-reviewer',
        'flowrider-worker',
        'recipe-maker',
        'siege-adversarial-fixer',
        'siege-adversarial-walker',
        'siege-happy-fixer',
        'siege-happy-walker',
        'siege-planner',
        'siegemaster-reader',
      ]);
    });
  });

  // `operatorRoleNames` is what the signal-back gates and the prompt renderer read to answer "does
  // this role own an operation item and run its own plan/work/review step graph". A name here that
  // is not a role would send a gate looking for an operation item that cannot exist.
  describe('operatorRoleNames is the three roles that run an operation item end to end', () => {
    it.each(agentPromptClassificationStatics.operatorRoleNames)(
      'VALID: {operatorRole: %s} => is a dispatchable role',
      (operatorRole) => {
        expect(
          agentPromptClassificationStatics.roleNames.some((name) => name === operatorRole),
        ).toBe(true);
      },
    );

    // `spiritmender` repairs a ward red and `warpgate` merges a finished branch — single relay
    // steps, neither owning a scope with its own plan/work/review step graph — so neither may
    // appear here.
    it.each(['spiritmender', 'warpgate'])(
      'VALID: {role: %s} => is a role but NOT an operator role',
      (role) => {
        expect({
          isRole: agentPromptClassificationStatics.roleNames.some((name) => name === role),
          isOperator: agentPromptClassificationStatics.operatorRoleNames.some(
            (name) => name === role,
          ),
        }).toStrictEqual({ isRole: true, isOperator: false });
      },
    );
  });

  describe('minionNames holds only chaoswhisperer-gap-minion', () => {
    it('VALID: {minionNames} => chaoswhisperer-gap-minion is the only true minion left', () => {
      expect(agentPromptClassificationStatics.minionNames).toStrictEqual([
        'chaoswhisperer-gap-minion',
      ]);
    });
  });
});
