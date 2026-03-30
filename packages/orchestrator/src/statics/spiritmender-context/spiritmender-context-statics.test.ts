import { spiritmenderContextStatics } from './spiritmender-context-statics';

describe('spiritmenderContextStatics', () => {
  it('VALID: exported value => has expected structure with all context keys', () => {
    const contextKeys = Object.keys(spiritmenderContextStatics);

    expect(contextKeys).toStrictEqual([
      'wardFailure',
      'buildFailure',
      'devServerStartFailure',
      'lawbringerFailure',
    ]);

    const wardKeys = Object.keys(spiritmenderContextStatics.wardFailure);
    const buildKeys = Object.keys(spiritmenderContextStatics.buildFailure);
    const devServerKeys = Object.keys(spiritmenderContextStatics.devServerStartFailure);
    const lawbringerKeys = Object.keys(spiritmenderContextStatics.lawbringerFailure);

    expect(wardKeys).toStrictEqual(['instructions']);
    expect(buildKeys).toStrictEqual(['instructions']);
    expect(devServerKeys).toStrictEqual(['instructions']);
    expect(lawbringerKeys).toStrictEqual(['instructions']);
  });

  it('VALID: wardFailure => instructions starts with "## Instructions"', () => {
    expect(spiritmenderContextStatics.wardFailure.instructions).toMatch(
      /^## Instructions\nYou are fixing ward failures/u,
    );
  });

  it('VALID: buildFailure => instructions starts with "## Instructions"', () => {
    expect(spiritmenderContextStatics.buildFailure.instructions).toMatch(
      /^## Instructions\nThe project build command failed/u,
    );
  });

  it('VALID: devServerStartFailure => instructions starts with "## Instructions"', () => {
    expect(spiritmenderContextStatics.devServerStartFailure.instructions).toMatch(
      /^## Instructions\nThe dev server failed to start/u,
    );
  });

  it('VALID: lawbringerFailure => instructions starts with "## Instructions"', () => {
    expect(spiritmenderContextStatics.lawbringerFailure.instructions).toMatch(
      /^## Instructions\nA code review agent/u,
    );
  });
});
