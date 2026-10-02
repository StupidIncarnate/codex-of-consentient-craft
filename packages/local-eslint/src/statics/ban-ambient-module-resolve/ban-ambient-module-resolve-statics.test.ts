import { banAmbientModuleResolveStatics } from './ban-ambient-module-resolve-statics';

describe('banAmbientModuleResolveStatics', () => {
  it('VALID: sanctionedPathSubstring => names the module resolve broker file', () => {
    expect(banAmbientModuleResolveStatics.sanctionedPathSubstring).toBe(
      '/packages/shared/src/brokers/module/resolve/module-resolve-broker.ts',
    );
  });

  it('VALID: exemptPathSubstrings => names the gateway packages', () => {
    expect(banAmbientModuleResolveStatics.exemptPathSubstrings).toStrictEqual([
      '/packages/@gateway/',
    ]);
  });

  it('VALID: exemptPathRegexSources => names every test-support file shape', () => {
    expect(banAmbientModuleResolveStatics.exemptPathRegexSources).toStrictEqual([
      '\\.test\\.tsx?$',
      '\\.integration\\.test\\.tsx?$',
      '\\.e2e\\.ts$',
      '\\.e2e\\.test\\.tsx?$',
      '\\.stub\\.tsx?$',
      '\\.proxy\\.tsx?$',
      '\\.harness\\.ts$',
    ]);
  });
});
