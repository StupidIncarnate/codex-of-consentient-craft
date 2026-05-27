import { tsconfigSerializeStatics } from './tsconfig-serialize-statics';

describe('tsconfigSerializeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(tsconfigSerializeStatics).toStrictEqual({
      jsonIndent: 2,
    });
  });
});
