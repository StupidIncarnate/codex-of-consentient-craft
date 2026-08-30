import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { slotManagerStatics } from './slot-manager-statics';

// Every role a pt continuation can be appended for: the shared role tuple minus the chat intake
// roles (no ledger continuation), minus the COMMAND roles (`ward` and `riftcarver`, each bounded by
// its own `maxRetries` chain counted off the ledger rather than off one item's continuations), and
// minus the parent-summoned minions (no operation item of their own).
const BUDGETED_ROLES = workItemRoleStatics.names
  .filter((role) => !workItemRoleStatics.chat.some((chatRole) => chatRole === role))
  .filter((role) => !workItemRoleStatics.command.some((commandRole) => commandRole === role))
  .filter((role) => !role.endsWith('-minion'));

describe('slotManagerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(slotManagerStatics).toStrictEqual({
      codeweaver: {
        maxAttempts: 3,
      },
      flowrider: {
        maxAttempts: 3,
      },
      siegemaster: {
        maxAttempts: 3,
      },
      spiritmender: {
        maxAttempts: 3,
      },
      warpgate: {
        maxAttempts: 3,
      },
      operator: {
        maxRoundsPerSession: 3,
      },
      ward: {
        maxRetries: 3,
      },
      riftcarver: {
        maxRetries: 3,
      },
      orphanRecovery: {
        maxResets: 3,
      },
    });
  });

  // The pt-budget ladder's final `else` hands any role it does not name spiritmender's budget, so a
  // dispatched role with no key here is silently mis-budgeted rather than erroring. Deriving the
  // required set from the shared role tuple is what turns that into a failing test.
  it.each(BUDGETED_ROLES)(
    'VALID: {role: %s} => carries its own pt-chain budget rather than falling through to spiritmender’s',
    (role) => {
      const budgets = new Map(Object.entries(slotManagerStatics));

      expect(budgets.get(role)).toStrictEqual({ maxAttempts: 3 });
    },
  );
});
