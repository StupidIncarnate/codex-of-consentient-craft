/**
 * PURPOSE: Every workspace package's own `package.json` carries an `imports` field mapping the four
 * `#gateway/<folder>/*` specifiers onto this repo's own gateway packages, gateway packages included
 * (they import each other the same way). `gatewayLocationsStatics.folders` is the one list those four
 * folder names come from; this proves every package's `imports` field still agrees with it, byte for
 * byte, which ESLint's file-glob rules cannot check — `imports` is a `package.json` field, not a
 * source file a selector can parse. A stale entry here is exactly what breaks resolution for every
 * caller in that one package, silently, since Node reads `imports` at run time, not at lint time.
 *
 * Every helper below returns `unknown` rather than `string`/`Record<string, …>`: `@dungeonmaster/
 * ban-primitives` bans a written `string` type (return position or generic type argument alike), and
 * this file has no natural branded contract for "an absolute directory path used only to read a test
 * fixture" — `unknown`, narrowed with `String(...)` at each real use, is the same pattern
 * `Record<PropertyKey, never>` already uses elsewhere in this repo's own proxy convention, to keep a
 * generic dictionary type off a banned primitive key.
 *
 * `.integration.test.ts`, not `.test.ts`: this file has no single implementation companion —
 * `@dungeonmaster/enforce-test-colocation` requires one for a plain `.test.ts`, and is turned off (in
 * `config-dungeonmaster-broker.ts`) only for `**\/src/*.integration.test.ts`, a package-root-level file
 * with no colocated wrapper folder — the same carve-out `dungeonmaster-rule-enforce-on.integration.test.ts`
 * (in `eslint-plugin`) already relies on for the identical reason.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/shared/src/gateway-workspace-imports-field.integration.test.ts
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { gatewayLocationsStatics } from './statics/gateway-locations/gateway-locations-statics';

const PACKAGES_DIR = join(__dirname, '..', '..');
const GATEWAY_SCOPE_DIR_NAME = '@gateway';

const readOwnPackageJson = ({
  packageDir,
}: {
  packageDir: unknown;
}): Record<PropertyKey, unknown> =>
  JSON.parse(readFileSync(join(String(packageDir), 'package.json'), 'utf8')) as Record<
    PropertyKey,
    unknown
  >;

const listWorkspacePackageDirs = (): unknown[] => {
  const topLevelEntries = readdirSync(PACKAGES_DIR, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );

  return topLevelEntries.flatMap((entry): unknown[] => {
    if (entry.name !== GATEWAY_SCOPE_DIR_NAME) {
      return [join(PACKAGES_DIR, entry.name)];
    }

    const gatewayScopeDir = join(PACKAGES_DIR, entry.name);
    return readdirSync(gatewayScopeDir, { withFileTypes: true })
      .filter((gatewayEntry) => gatewayEntry.isDirectory())
      .map((gatewayEntry): unknown => join(gatewayScopeDir, gatewayEntry.name));
  });
};

const workspacePackageDirs = listWorkspacePackageDirs();
const sharedPackageName = readOwnPackageJson({ packageDir: join(PACKAGES_DIR, 'shared') }).name;
const [scope] = String(sharedPackageName).split('/');

const expectedGatewayImportsField = Object.fromEntries(
  Object.values(gatewayLocationsStatics.folders).map((folder) => [
    `${gatewayLocationsStatics.importPrefix}/${folder}/*`,
    `${scope}/${folder}/*`,
  ]),
);

describe('every workspace package imports field', () => {
  it.each(workspacePackageDirs)(
    'VALID: {package: %s} => imports field matches the gateway one list exactly',
    (packageDir) => {
      const importsField = readOwnPackageJson({ packageDir }).imports;

      expect(importsField).toStrictEqual(expectedGatewayImportsField);
    },
  );
});
