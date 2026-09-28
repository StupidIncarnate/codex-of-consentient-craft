/**
 * PURPOSE: Reads `.dungeonmaster.json`'s `gateway` key ONCE, at eslint.config.js load time — never
 * inside a rule itself — so configDungeonmasterBroker can hand the parsed value to ban-gateway-export,
 * enforce-gateway-restricted-to, and enforce-gateway-config-names-exist as a single shared rule
 * OPTION. The caller passes `startDir: filePathContract.parse(__dirname)` from its OWN module, the
 * same shape repoScopeResolveBroker's callers use: inside this repo that walk resolves the repo
 * root, and once this package is installed under a consumer's `node_modules/@dungeonmaster/eslint-plugin`,
 * the SAME walk climbs out through `node_modules` to that consumer's own root. A missing, unreadable,
 * or invalid file returns an empty config rather than throwing — no `gateway` key yet is the common
 * case (this repo's own `.dungeonmaster.json` carries none until a later item adds its first entry),
 * and a broken config file must not crash every ESLint invocation across the whole team.
 *
 * USAGE:
 * configGatewayLintConfigBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns {} when no `.dungeonmaster.json` exists yet, or the parsed `gateway` key otherwise
 */
import {
  filePathContract,
  gatewayLintConfigContract,
  type FilePath,
  type GatewayLintConfig,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { existsSync, readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';

export const configGatewayLintConfigBroker = ({
  startDir,
}: {
  startDir: FilePath;
}): GatewayLintConfig => {
  const configPath = join(startDir, locationsStatics.repoRoot.config);

  if (existsSync(configPath)) {
    try {
      const contents = readFileSync(configPath);
      const parsed = JSON.parse(contents) as Record<PropertyKey, unknown>;
      const validated = gatewayLintConfigContract.safeParse(parsed.gateway ?? {});
      return validated.success ? validated.data : {};
    } catch {
      return {};
    }
  }

  const parentDir = dirname(startDir);
  if (parentDir === startDir) {
    return {};
  }

  return configGatewayLintConfigBroker({ startDir: filePathContract.parse(parentDir) });
};
