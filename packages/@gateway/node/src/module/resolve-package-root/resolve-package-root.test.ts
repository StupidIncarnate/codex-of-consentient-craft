import { dirname } from 'path';
import { resolvePackageRoot } from './resolve-package-root';

describe('resolvePackageRoot', () => {
  it('VALID: {specifier: an installed npm package whose entry sits below its root} => returns its real package root', () => {
    const result = resolvePackageRoot({ specifier: 'typescript' });

    // A hardcoded absolute path here would only ever match ONE checkout's own clone location —
    // this file ships as source into every consumer `dungeonmaster init` copies (this item's own
    // scratch-consumer run caught exactly that: the original assertion, hardcoded to this repo's
    // own clone path, failed the moment the source landed in a real consumer). Deriving the
    // expectation from `typescript/package.json` — a SEPARATE resolution from `typescript`'s own
    // main-entry file — stays correct wherever the package is actually installed, and independent
    // of how many directories deep that entry happens to sit. `typescript`, not a
    // `@dungeonmaster/*` package: `gateway-import-boundary` bans a gateway file from resolving our
    // own workspace packages, even in a test.
    expect(result).toBe(dirname(require.resolve('typescript/package.json')));
  });

  it('EMPTY: {specifier: a package that is not installed} => returns null', () => {
    const result = resolvePackageRoot({ specifier: 'totally-not-a-real-package-xyz123' });

    expect(result).toBe(null);
  });
});
