/**
 * PURPOSE: Pins this package's own `package.json` `exports` map to its standard shape — a check
 * ESLint's file-glob rules cannot make, since `package.json` is JSON, not a source file a rule's
 * selectors can parse. Two things are checked, deliberately kept separate: the exact SET of top-level
 * subpath keys — `./*.proxy`, `./*.stub`, `./*`, and NOTHING else (an accidental extra key, such as a
 * stray root `.` entry or a leftover `./_test_/*`, fails this) — and each key's `source` condition —
 * the one ward's typecheck/unit/integration checks actually resolve through — against the standard
 * glob. This does NOT pin the whole nested condition object, so this test survives a same-package
 * resolution condition (a `bin-own-source`, mirroring the fix already applied to the npm, node and
 * browser gateways for a self-referencing `dist` on a warm build) being added beside the shared ones
 * without becoming a second place to update. `'_test_'` is deliberately absent from
 * `STANDARD_SOURCE_TARGETS` below, per concession 1 in `scrolls/brands-gateways-epic/EPIC.md`: the
 * barrel and its export key are gone from every gateway package's end state, and G26 step 4 is the
 * item that removes them here.
 *
 * `.integration.test.ts`, not `.test.ts`: this file has no single implementation companion —
 * `@dungeonmaster/enforce-test-colocation` requires one for a plain `.test.ts`, and is turned off (in
 * `config-dungeonmaster-broker.ts`) only for `**\/src/*.integration.test.ts`.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/@gateway/bin/src/gateway-bin-exports-shape.integration.test.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const PACKAGE_ROOT = join(__dirname, '..');

// Every standard subpath key mapped to the `source` condition's target glob. No `./_test_/*` key —
// concession 1 (EPIC.md) says the barrel it points at is gone from the end state.
const STANDARD_SOURCE_TARGETS = {
  './*.proxy': './src/*.proxy.ts',
  './*.stub': './src/*.stub.ts',
  './*': './src/*/*.ts',
};

const readOwnExports = (): Record<string, unknown> => {
  const rawPackageJson = JSON.parse(
    readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'),
  ) as Record<string, unknown>;
  return rawPackageJson.exports as Record<string, unknown>;
};

describe('gateway bin package exports shape', () => {
  it('VALID: {this package.json exports} => holds exactly the standard subpath keys, no root "." entry', () => {
    const exportsShape = readOwnExports();

    expect(Object.keys(exportsShape).sort()).toStrictEqual(
      Object.keys(STANDARD_SOURCE_TARGETS).sort(),
    );
  });

  it('VALID: {each subpath key} => its "source" condition targets the standard glob', () => {
    const exportsShape = readOwnExports();

    const sourceTargets = Object.fromEntries(
      Object.entries(exportsShape).map(([exportKey, exportValue]) => [
        exportKey,
        (exportValue as Record<string, unknown>).source,
      ]),
    );

    expect(sourceTargets).toStrictEqual(STANDARD_SOURCE_TARGETS);
  });
});
