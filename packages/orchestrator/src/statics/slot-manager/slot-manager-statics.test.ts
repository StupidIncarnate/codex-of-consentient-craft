import { slotManagerStatics } from './slot-manager-statics';

describe('slotManagerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(slotManagerStatics).toStrictEqual({
      orphanRecovery: {
        maxResets: 3,
      },
    });
  });
});
