/**
 * PURPOSE: Reads this package's OWN `package.json` and its own `src/` folder listing to prove the
 * two stay in lockstep — a check ESLint's file-glob rules cannot make, since neither `dependencies`
 * nor the folder list is itself a source file glob can select. Every folder directly under `src/`
 * must name a package this package.json actually declares (in `dependencies` or `peerDependencies`),
 * and every declared package must have a folder wrapping it. `bareFolderNameForDependency` inlines
 * the SAME `__` join / leading-`@`-drop rule `gatewayPathFromImportSourceTransformer` (in
 * `@dungeonmaster/shared`) uses, rather than importing it: `gateway-import-boundary` (active, in the
 * gateway ESLint config block) refuses ANY import of `@dungeonmaster/shared` from inside a gateway
 * file, this test included — the gateway is the bottom layer and may not depend on a package built on
 * top of it. A `dependencies`/`peerDependencies` KEY is always a bare package name, never a subpath or
 * a `.js`-suffixed segment, so the fuller transformer's node-builtin branch and `.js`-stripping do not
 * apply here and are safely left out. A folder matches a dependency either by exact name (`glob` wraps
 * `glob`) or by prefix (`hono__utils__http-status` wraps a subpath of the `hono` dependency).
 *
 * `.integration.test.ts`, not `.test.ts`: this file has no single implementation companion —
 * `@dungeonmaster/enforce-test-colocation` requires one for a plain `.test.ts`, and is turned off (in
 * `config-dungeonmaster-broker.ts`) only for `**\/src/*.integration.test.ts`, a package-root-level file
 * with no colocated wrapper folder — the same carve-out `dungeonmaster-rule-enforce-on.integration.test.ts`
 * (in `eslint-plugin`) already relies on for the identical reason.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/@gateway/npm/src/gateway-npm-package-dependencies.integration.test.ts
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PACKAGE_ROOT = join(__dirname, '..');
const SRC_DIR = __dirname;
const SUBPATH_JOIN = '__';

const readOwnDependencyNames = (): string[] => {
  const rawPackageJson = JSON.parse(
    readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'),
  ) as Record<string, unknown>;
  const dependencies = rawPackageJson.dependencies as Record<string, string> | undefined;
  const peerDependencies = rawPackageJson.peerDependencies as Record<string, string> | undefined;

  return [...Object.keys(dependencies ?? {}), ...Object.keys(peerDependencies ?? {})];
};

const readOwnSrcFolders = (): string[] =>
  readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const bareFolderNameForDependency = ({ dependencyName }: { dependencyName: string }): string =>
  dependencyName.split('/').join(SUBPATH_JOIN).replace(/^@/u, '');

const folderMatchesBareName = ({
  folderName,
  bareName,
}: {
  folderName: string;
  bareName: string;
}): boolean => folderName === bareName || folderName.startsWith(`${bareName}${SUBPATH_JOIN}`);

describe('gateway npm package dependencies', () => {
  it('VALID: {every src/ folder} => names a package declared in dependencies or peerDependencies', () => {
    const bareNames = readOwnDependencyNames().map((dependencyName) =>
      bareFolderNameForDependency({ dependencyName }),
    );

    const foldersWithNoDeclaredDependency = readOwnSrcFolders().filter(
      (folderName) =>
        !bareNames.some((bareName) => folderMatchesBareName({ folderName, bareName })),
    );

    expect(foldersWithNoDeclaredDependency).toStrictEqual([]);
  });

  it('VALID: {every declared dependency} => has a matching src/ folder wrapping it', () => {
    const folderNames = readOwnSrcFolders();

    const dependenciesWithNoFolder = readOwnDependencyNames().filter((dependencyName) => {
      const bareName = bareFolderNameForDependency({ dependencyName });
      return !folderNames.some((folderName) => folderMatchesBareName({ folderName, bareName }));
    });

    expect(dependenciesWithNoFolder).toStrictEqual([]);
  });
});
