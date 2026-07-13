import { slotManagerStatics } from './slot-manager-statics';

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
      lawbringer: {
        maxAttempts: 3,
      },
      blightwarden: {
        maxAttempts: 3,
      },
      pesteater: {
        maxAttempts: 3,
      },
      spiritmender: {
        maxAttempts: 3,
      },
      ward: {
        maxRetries: 3,
      },
      orphanRecovery: {
        maxResets: 3,
      },
    });
  });
});
