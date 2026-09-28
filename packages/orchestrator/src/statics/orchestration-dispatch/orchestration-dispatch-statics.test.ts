import { orchestrationDispatchStatics } from './orchestration-dispatch-statics';

describe('orchestrationDispatchStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(orchestrationDispatchStatics).toStrictEqual({
      loop: {
        longPollTotalMs: 2_000,
        longPollIntervalMs: 500,
      },
      processIdPrefix: 'node-dispatch',
    });
  });
});
