/**
 * PURPOSE: Reads `.dungeonmaster.json`'s `gateway` key ONCE, at eslint.config.js load time — never
 * inside a rule itself — so configDungeonmasterBroker can hand the parsed value to ban-gateway-export,
 * enforce-gateway-restricted-to, and enforce-gateway-config-names-exist as a single shared rule
 * OPTION. The caller is the repo's own eslint.config.js, which passes its own directory as
 * `startDir`, so the walk reads the `.dungeonmaster.json` of the repo being linted. A walk from this
 * plugin's own location would read dungeonmaster's file when a consumer links the plugin through
 * `file:`. A missing, unreadable,
 * or invalid file returns an empty config rather than throwing — no `gateway` key yet is the common
 * case (this repo's own `.dungeonmaster.json` carries none until a later item adds its first entry),
 * and a broken config file must not crash every ESLint invocation across the whole team.
 *
 * USAGE:
 * configGatewayLintConfigBroker({ startDir: '/repo' }); // from /repo/eslint.config.js
 * // Returns {} when no `.dungeonmaster.json` exists yet, or the parsed `gateway` key otherwise
 */
import {
  gatewayLintConfigFileContract,
  type GatewayLintConfig,
  gatewayLintConfigContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { existsSync, readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';

export const configGatewayLintConfigBroker = ({
  startDir,
}: {
  startDir: string;
}): GatewayLintConfig => {
  const configPath = join(startDir, locationsStatics.repoRoot.config);

  if (existsSync(configPath)) {
    try {
      const contents = readFileSync(configPath);
      const validated = gatewayLintConfigFileContract.safeParse(JSON.parse(contents));
      return validated.success
        ? (validated.data.gateway ?? gatewayLintConfigContract.parse({}))
        : gatewayLintConfigContract.parse({});
    } catch {
      return gatewayLintConfigContract.parse({});
    }
  }

  const parentDir = dirname(startDir);
  if (parentDir === startDir) {
    return gatewayLintConfigContract.parse({});
  }

  return configGatewayLintConfigBroker({ startDir: parentDir });
};
