/**
 * PURPOSE: The three gateway folder names `gatewayPackageNamesReadLayerBroker` reads a
 * `package.json` `name` field from, one per platform side of the platform-crossing check
 *
 * USAGE:
 * gatewayFolderNamesStatics;
 * // Returns ['node', 'bin', 'browser']
 */

export const gatewayFolderNamesStatics = ['node', 'bin', 'browser'] as const;
