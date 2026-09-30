/**
 * PURPOSE: Reads `.dungeonmaster.json`'s `gateway` key at a REPO ROOT the caller already resolved
 * (the discovery tools' `ResolveCallerRepoRootLayerResponder`), so the project-map and
 * project-inventory renderers can mark a banned or restricted gateway export on its own line. Unlike
 * `eslint-plugin`'s `configGatewayLintConfigBroker`, this never walks up looking for the nearest
 * config — an MCP caller's repo root is already confirmed, so a second walk would only risk landing
 * on a DIFFERENT config than the one the rest of the response describes. A missing file, an
 * unreadable one, or one that fails `gatewayLintConfigContract` all report no bans and no
 * restrictions rather than throwing — the discovery tools must keep rendering everything else about
 * the gateway even when this one file is absent or malformed, which is the common case before G16
 * onward ever add a `gateway` key.
 *
 * USAGE:
 * gatewayLintConfigReadBroker({ repoRoot: absoluteFilePathContract.parse('/repo') });
 * // Returns {} when '/repo/.dungeonmaster.json' is absent or carries no 'gateway' key
 */

import { existsSync, readFileSync } from '#gateway/node/fs';
import { gatewayLintConfigFileContract } from '../../../contracts/gateway-lint-config-file/gateway-lint-config-file-contract';
import type { GatewayLintConfig } from '../../../contracts/gateway-lint-config/gateway-lint-config-contract';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { gatewayLintConfigContract } from '../../../contracts/gateway-lint-config/gateway-lint-config-contract';

const EMPTY_GATEWAY_LINT_CONFIG: GatewayLintConfig = gatewayLintConfigContract.parse({});

export const gatewayLintConfigReadBroker = ({
  repoRoot,
}: {
  repoRoot: string;
}): GatewayLintConfig => {
  const configPath = `${repoRoot}/${locationsStatics.repoRoot.config}`;

  if (!existsSync(configPath)) {
    return EMPTY_GATEWAY_LINT_CONFIG;
  }

  try {
    const raw = readFileSync(configPath);
    const file = gatewayLintConfigFileContract.safeParse(JSON.parse(raw));
    return file.success
      ? (file.data.gateway ?? EMPTY_GATEWAY_LINT_CONFIG)
      : EMPTY_GATEWAY_LINT_CONFIG;
  } catch {
    return EMPTY_GATEWAY_LINT_CONFIG;
  }
};
