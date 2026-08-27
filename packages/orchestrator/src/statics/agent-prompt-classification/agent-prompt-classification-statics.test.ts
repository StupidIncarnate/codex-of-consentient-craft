import { agentPromptClassificationStatics } from './agent-prompt-classification-statics';

describe('agentPromptClassificationStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => lists every served prompt, the work-item roles, the parent-summoned minions, and the five that run a round', () => {
      expect(agentPromptClassificationStatics).toStrictEqual({
        promptNames: [
          'chaoswhisperer-gap-minion',
          'codeweaver',
          'codeweaver-planner-minion',
          'codeweaver-worker-minion',
          'codeweaver-reviewer-minion',
          'pesteater',
          'pesteater-planner-minion',
          'pesteater-worker-minion',
          'pesteater-reviewer-minion',
          'flowrider',
          'flowrider-planner-minion',
          'flowrider-worker-minion',
          'flowrider-reviewer-minion',
          'groundstomper',
          'groundstomper-planner-minion',
          'groundstomper-worker-minion',
          'groundstomper-reviewer-minion',
          'siegemaster',
          'siegemaster-planner-minion',
          'siegemaster-worker-minion',
          'siegemaster-reviewer-minion',
          'spiritmender',
          'warpgate',
        ],
        roleNames: [
          'codeweaver',
          'pesteater',
          'flowrider',
          'groundstomper',
          'siegemaster',
          'spiritmender',
          'warpgate',
        ],
        minionNames: [
          'chaoswhisperer-gap-minion',
          'codeweaver-planner-minion',
          'codeweaver-worker-minion',
          'codeweaver-reviewer-minion',
          'pesteater-planner-minion',
          'pesteater-worker-minion',
          'pesteater-reviewer-minion',
          'flowrider-planner-minion',
          'flowrider-worker-minion',
          'flowrider-reviewer-minion',
          'groundstomper-planner-minion',
          'groundstomper-worker-minion',
          'groundstomper-reviewer-minion',
          'siegemaster-planner-minion',
          'siegemaster-worker-minion',
          'siegemaster-reviewer-minion',
        ],
        operatorRoleNames: ['codeweaver', 'pesteater', 'flowrider', 'groundstomper', 'siegemaster'],
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

    // The stakes, unchanged by the per-role split: a minion in `roleNames` widens
    // `agentRoleContract` with a role no operation item can hold, and a role in `minionNames`
    // lets it fetch without a workItemId and escape `subagentStopNeedsBlockGuard`.
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
  // this role run a round". It replaced `roleToDisciplineStatics`, whose keys were the only thing
  // either call site ever wanted. A name here that is not a role would send a gate looking for an
  // operation item that cannot exist.
  describe('operatorRoleNames is the five roles that run a round', () => {
    it.each(agentPromptClassificationStatics.operatorRoleNames)(
      'VALID: {operatorRole: %s} => is a dispatchable role',
      (operatorRole) => {
        expect(
          agentPromptClassificationStatics.roleNames.some((name) => name === operatorRole),
        ).toBe(true);
      },
    );

    // `spiritmender` repairs a ward red and `warpgate` merges a finished branch. Neither runs a
    // planner/worker/reviewer round, so neither may appear here — a gate that treated one as an
    // operator would demand review coverage of a session that summons nobody.
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

  // Every operator role summons exactly three minions, and each is named for it. The naming is the
  // whole reason a bare `planner-minion` no longer exists: a minion's prompt carries its parent's
  // subject matter, so there is nothing generic left for an unprefixed name to mean.
  describe('every operator role has its own three minions', () => {
    it.each(agentPromptClassificationStatics.operatorRoleNames)(
      'VALID: {operatorRole: %s} => has a planner, a worker and a reviewer minion named for it',
      (operatorRole) => {
        expect(
          agentPromptClassificationStatics.minionNames.filter((name) =>
            name.startsWith(`${operatorRole}-`),
          ),
        ).toStrictEqual([
          `${operatorRole}-planner-minion`,
          `${operatorRole}-worker-minion`,
          `${operatorRole}-reviewer-minion`,
        ]);
      },
    );

    it('VALID: {minionNames} => holds exactly the fifteen round minions plus the spec-phase one', () => {
      expect(
        agentPromptClassificationStatics.minionNames.filter(
          (name) =>
            !agentPromptClassificationStatics.operatorRoleNames.some((role) =>
              name.startsWith(`${role}-`),
            ),
        ),
      ).toStrictEqual(['chaoswhisperer-gap-minion']);
    });
  });
});
