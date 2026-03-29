import { spiritmenderContextStatics } from './spiritmender-context-statics';

describe('spiritmenderContextStatics', () => {
  it('VALID: exported value => has expected structure with all context keys', () => {
    expect(Object.keys(spiritmenderContextStatics)).toStrictEqual([
      'wardFailure',
      'buildFailure',
      'devServerStartFailure',
      'lawbringerFailure',
    ]);

    expect(Object.keys(spiritmenderContextStatics.wardFailure)).toStrictEqual(['instructions']);
    expect(Object.keys(spiritmenderContextStatics.buildFailure)).toStrictEqual(['instructions']);
    expect(Object.keys(spiritmenderContextStatics.devServerStartFailure)).toStrictEqual([
      'instructions',
    ]);
    expect(Object.keys(spiritmenderContextStatics.lawbringerFailure)).toStrictEqual([
      'instructions',
    ]);
  });

  it('VALID: each context => instructions is a non-empty string', () => {
    const entries = Object.values(spiritmenderContextStatics);

    expect(entries.every((entry) => typeof entry.instructions === 'string')).toBe(true);
    expect(entries.every((entry) => entry.instructions.length > 0)).toBe(true);
  });
});
