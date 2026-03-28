import { exitCodeStatics } from './exit-code-statics';

describe('exitCodeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(exitCodeStatics).toStrictEqual({
      limits: {
        max: 255,
      },
    });
  });
});
