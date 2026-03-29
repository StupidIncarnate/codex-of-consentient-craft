import { spiritmenderContextStatics } from './spiritmender-context-statics';

describe('spiritmenderContextStatics', () => {
  it('VALID: exported value => has expected context keys', () => {
    expect(Object.keys(spiritmenderContextStatics)).toStrictEqual([
      'wardFailure',
      'buildFailure',
      'devServerStartFailure',
      'lawbringerFailure',
    ]);
  });

  it('VALID: each context => has non-empty instructions string', () => {
    const entries = Object.values(spiritmenderContextStatics);

    expect(entries.every((entry) => typeof entry.instructions === 'string')).toBe(true);
    expect(entries.every((entry) => entry.instructions.length > 0)).toBe(true);
  });

  it('VALID: wardFailure => references ward failures and dependency order', () => {
    expect(spiritmenderContextStatics.wardFailure.instructions).toMatch(/ward failures/u);
    expect(spiritmenderContextStatics.wardFailure.instructions).toMatch(/dependency order/u);
  });

  it('VALID: buildFailure => references build command and investigation', () => {
    expect(spiritmenderContextStatics.buildFailure.instructions).toMatch(/build command failed/u);
    expect(spiritmenderContextStatics.buildFailure.instructions).toMatch(/you must investigate/u);
  });

  it('VALID: devServerStartFailure => references dev server and common causes', () => {
    expect(spiritmenderContextStatics.devServerStartFailure.instructions).toMatch(
      /dev server failed to start/u,
    );
    expect(spiritmenderContextStatics.devServerStartFailure.instructions).toMatch(/port conflict/u);
  });

  it('VALID: lawbringerFailure => references lawbringer and failure summary', () => {
    expect(spiritmenderContextStatics.lawbringerFailure.instructions).toMatch(/lawbringer/u);
    expect(spiritmenderContextStatics.lawbringerFailure.instructions).toMatch(/failure summary/u);
  });
});
