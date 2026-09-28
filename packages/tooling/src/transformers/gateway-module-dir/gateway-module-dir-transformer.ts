/**
 * PURPOSE: Names the gateway folder for an outside module, so an adapter's `fs/promises` call finds
 * `fs__promises` in the gateway. The gateway's rule is the one this repeats: drop `node:` and a
 * leading `@`, then turn every `/` into `__`. A global (`setTimeout`) is its own folder name.
 *
 * USAGE:
 * gatewayModuleDirTransformer({ specifier: '@mantine/core' });
 * // Returns 'mantine__core' as a branded GatewayModuleDir
 */
import { gatewayModuleDirContract } from '../../contracts/gateway-module-dir/gateway-module-dir-contract';
import type { GatewayModuleDir } from '../../contracts/gateway-module-dir/gateway-module-dir-contract';

export const gatewayModuleDirTransformer = ({
  specifier,
}: {
  specifier: string;
}): GatewayModuleDir =>
  gatewayModuleDirContract.parse(
    specifier
      .replace(/^node:/u, '')
      .replace(/^@/u, '')
      .replaceAll('/', '__'),
  );
