import { dispatchStateDefaultStatics } from './dispatch-state-default-statics';

describe('dispatchStateDefaultStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(dispatchStateDefaultStatics).toStrictEqual({
      paused: {
        mode: 'paused',
        updatedAt: '1970-01-01T00:00:00.000Z',
      },
    });
  });
});
