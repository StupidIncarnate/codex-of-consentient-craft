import { moduleResolutionContract } from './module-resolution-contract';
import { ModuleResolutionStub } from './module-resolution.stub';

describe('moduleResolutionContract', () => {
  it('VALID: {default stub} => parses the run-root answer', () => {
    expect(moduleResolutionContract.parse(ModuleResolutionStub())).toStrictEqual({
      path: '/repo/node_modules/@dungeonmaster/cli/package.json',
      resolvedFrom: 'run-root',
    });
  });

  it('VALID: {resolvedFrom: own-install} => parses the fallback answer', () => {
    expect(
      moduleResolutionContract.parse(
        ModuleResolutionStub({
          path: '/usr/lib/node_modules/x/index.js',
          resolvedFrom: 'own-install',
        }),
      ),
    ).toStrictEqual({ path: '/usr/lib/node_modules/x/index.js', resolvedFrom: 'own-install' });
  });

  it('INVALID: {resolvedFrom: elsewhere} => throws', () => {
    expect(() =>
      moduleResolutionContract.parse({ path: '/a.js', resolvedFrom: 'elsewhere' }),
    ).toThrow(/Invalid option/u);
  });

  it('INVALID: {path: ""} => throws', () => {
    expect(() => moduleResolutionContract.parse({ path: '', resolvedFrom: 'run-root' })).toThrow(
      /Too small: expected string to have >=1 characters/u,
    );
  });
});
