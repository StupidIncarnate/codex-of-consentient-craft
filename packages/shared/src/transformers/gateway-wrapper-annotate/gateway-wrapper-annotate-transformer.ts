/**
 * PURPOSE: Marks one gateway subpath's own wrapper names with whatever `gateway` key
 * (`gatewayLintConfigContract`) of `.dungeonmaster.json` says about them, for the discovery tools'
 * rendered output — a banned export reads `name ✗ banned, use <replacement>`, a restricted one reads
 * `name (<packages> only)`, and an unremarkable one is unchanged. A `restrictedTo` entry with no
 * `name` restricts the WHOLE subpath, so it matches every wrapper name in it. Each package in
 * `restrictedTo.packages` is shown by its LAST path segment (`@dungeonmaster/orchestrator` reads
 * `orchestrator`) rather than the full workspace name, matching the gateway follow-up doc's own
 * worked example (`spawnStreamJson (orchestrator only)`) — this needs no repo-scope lookup, since a
 * package name's last segment is already the bare name whatever a repo's own `@scope` is.
 *
 * USAGE:
 * gatewayWrapperAnnotateTransformer({
 *   subpath: ContentTextStub({ value: '#gateway/node/fs__promises' }),
 *   wrapperNames: [ContentTextStub({ value: 'readFile' })],
 *   gatewayLintConfig: { bannedExports: [{subpath: '#gateway/node/fs__promises', name: 'readFile', use: 'readTextFile', reason: 'x'}] },
 * });
 * // Returns ['readFile ✗ banned, use readTextFile']
 */

import type { GatewayLintConfig } from '../../contracts/gateway-lint-config/gateway-lint-config-contract';

const PACKAGE_PATH_SEPARATOR = '/';
const PACKAGE_NAME_LIST_JOIN = ', ';

export const gatewayWrapperAnnotateTransformer = ({
  subpath,
  wrapperNames,
  gatewayLintConfig,
}: {
  subpath: string;
  wrapperNames: string[];
  gatewayLintConfig: GatewayLintConfig;
}): string[] =>
  wrapperNames.map((wrapperName) => {
    const bannedEntry = gatewayLintConfig.bannedExports?.find(
      (entry) =>
        String(entry.subpath) === subpath && String(entry.name) === wrapperName,
    );
    if (bannedEntry !== undefined) {
      return `${wrapperName} ✗ banned, use ${bannedEntry.use}`;
    }

    const restrictedEntry = gatewayLintConfig.restrictedTo?.find(
      (entry) =>
        String(entry.subpath) === subpath &&
        (entry.name === undefined || String(entry.name) === wrapperName),
    );
    if (restrictedEntry !== undefined) {
      const packageList = restrictedEntry.packages
        .map((packageName) => {
          const segments = String(packageName).split(PACKAGE_PATH_SEPARATOR);
          return segments.pop() ?? String(packageName);
        })
        .join(PACKAGE_NAME_LIST_JOIN);
      return `${wrapperName} (${packageList} only)`;
    }

    return wrapperName;
  });
