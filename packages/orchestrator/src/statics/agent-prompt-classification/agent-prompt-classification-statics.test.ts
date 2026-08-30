import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => lists every served prompt, the work-item roles, the parent-summoned minions, and the three that own an operation item', () => {
      expect(agentPromptClassificationStatics).toStrictEqual({
        promptNames: [
          'chaoswhisperer-gap-minion',
          'codeweaver',
          'codeweaver-reviewer',
          'flowrider',
          'flowrider-reviewer',
          'siegemaster',
          'siegemaster-reviewer',
          'siegemaster-walker',
          'spiritmender',
          'warpgate',
        ],
        roleNames: ['codeweaver', 'flowrider', 'siegemaster', 'spiritmender', 'warpgate'],
        minionNames: [
          'chaoswhisperer-gap-minion',
          'codeweaver-reviewer',
          'flowrider-reviewer',
          'siegemaster-reviewer',
          'siegemaster-walker',
        ],
        operatorRoleNames: ['codeweaver', 'flowrider', 'siegemaster'],
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

    // The stakes: a minion in `roleNames` widens `agentRoleContract` with a role no operation item
    // can hold, and a role in `minionNames` lets it fetch without a workItemId and escape
    // `subagentStopNeedsBlockGuard`.
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

    it('VALID: {promptNames} => holds nothing outside those two lists', () => {
      const classified = [
        ...agentPromptClassificationStatics.roleNames,
        ...agentPromptClassificationStatics.minionNames,
      ];

      expect(
        agentPromptClassificationStatics.promptNames.filter(
          (name) => !classified.some((known) => known === name),
        ),
      ).toStrictEqual([]);
    });
  });

  // `operatorRoleNames` is what the signal-back gates and the prompt renderer read to answer "does
  // this role own an operation item and brief sub-agents for it". A name here that is not a role
  // would send a gate looking for an operation item that cannot exist.
  describe('operatorRoleNames is the three roles that brief sub-agents', () => {
    it.each(agentPromptClassificationStatics.operatorRoleNames)(
      'VALID: {operatorRole: %s} => is a dispatchable role',
      (operatorRole) => {
        expect(
          agentPromptClassificationStatics.roleNames.some((name) => name === operatorRole),
        ).toBe(true);
      },
    );

    // `spiritmender` repairs a ward red and `warpgate` merges a finished branch. Neither briefs a
    // sub-agent, so neither may appear here — a gate that treated one as an operator would demand
    // review coverage of a session that summons nobody.
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

  // Every operator role has its own reviewer, and it is named for it. The naming is the whole
  // reason a bare `reviewer` no longer exists: a reviewer's prompt carries its parent's subject
  // matter, so there is nothing generic left for an unprefixed name to mean.
  describe('every operator role has its own reviewer', () => {
    it.each(agentPromptClassificationStatics.operatorRoleNames)(
      'VALID: {operatorRole: %s} => has a reviewer minion named for it',
      (operatorRole) => {
        expect(
          agentPromptClassificationStatics.minionNames.some(
            (name) => name === `${operatorRole}-reviewer`,
          ),
        ).toBe(true);
      },
    );

    it('VALID: {minionNames} => holds only the per-role reviewers, the siegemaster walker and the spec-phase minion', () => {
      expect(
        agentPromptClassificationStatics.minionNames.filter(
          (name) =>
            !agentPromptClassificationStatics.operatorRoleNames.some(
              (role) => name === `${role}-reviewer`,
            ),
        ),
      ).toStrictEqual(['chaoswhisperer-gap-minion', 'siegemaster-walker']);
    });
  });
});
