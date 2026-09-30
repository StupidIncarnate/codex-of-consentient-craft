/**
 * PURPOSE: Makes the root package.json `postinstall` script run `rootPostinstallStatics.script`, so
 * a bare `npm install` or `npm ci` fills `packages/@gateway/npm/src/` for every dependency. A
 * `postinstall` the consumer already has keeps its own command and gets the script appended with
 * `&&`; one that already mentions `gateway-sync` is left alone. Returns the SAME `rootPackageJson`
 * reference when nothing changes, so a caller can skip a write with `updated === rootPackageJson`.
 *
 * USAGE:
 * rootPostinstallMergeTransformer({ rootPackageJson: PackageJsonRawStub({ scripts: { postinstall: 'husky' } }) });
 * // Returns rootPackageJson with scripts.postinstall: 'husky && if command -v dungeonmaster ...; fi'
 */

import { packageJsonRawContract, type PackageJsonRaw } from '@dungeonmaster/shared/contracts';

import { rootPostinstallStatics } from '../../statics/root-postinstall/root-postinstall-statics';

export const rootPostinstallMergeTransformer = ({
  rootPackageJson,
}: {
  rootPackageJson: PackageJsonRaw;
}): PackageJsonRaw => {
  const { scriptKey, script, marker } = rootPostinstallStatics;
  const scriptsKey = packageJsonRawContract.keyType.parse('scripts');
  const scriptsValue = rootPackageJson[scriptsKey];
  const existingScripts =
    typeof scriptsValue === 'object' && scriptsValue !== null && !Array.isArray(scriptsValue)
      ? scriptsValue
      : {};
  const existingPostinstall = existingScripts[scriptKey];
  const existingCommand = typeof existingPostinstall === 'string' ? existingPostinstall.trim() : '';

  if (existingCommand.includes(marker)) {
    return rootPackageJson;
  }

  return {
    ...rootPackageJson,
    [scriptsKey]: {
      ...existingScripts,
      [scriptKey]: existingCommand === '' ? script : `${existingCommand} && ${script}`,
    },
  };
};
