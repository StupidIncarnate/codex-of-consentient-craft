import { slotManagerStatics } from './slot-manager-statics';

describe('slotManagerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(slotManagerStatics).toStrictEqual({
      codeweaver: {
        slotCount: 3,
        maxFollowupDepth: 5,
      },
      siegemaster: {
        concurrentLimit: 1,
        maxRetries: 2,
        maxDispatchDepth: 3,
        maxFollowupDepth: 3,
      },
      lawbringer: {
        concurrentLimit: 3,
        maxRetries: 2,
        maxDispatchDepth: 3,
        maxFollowupDepth: 3,
      },
      ward: {
        maxRetries: 3,
        spiritmenderMaxConcurrent: 3,
        spiritmenderBatchSize: 3,
      },
    });
  });
});
