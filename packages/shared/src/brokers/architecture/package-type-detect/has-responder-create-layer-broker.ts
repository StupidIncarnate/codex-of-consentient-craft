/**
 * PURPOSE: Checks whether any domain folder under responders/ contains a create/ subdirectory
 *
 * USAGE:
 * const hasCreate = hasResponderCreateLayerBroker({ respondersDirPath: absoluteFilePathContract.parse('/project/src/responders') });
 * // Returns true if any responders-domain/create/ folder exists
 *
 * WHEN-TO-USE: During package-type detection for the eslint-plugin signal (responders-domain/create/ must exist)
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const hasResponderCreateLayerBroker = ({
  respondersDirPath,
}: {
  respondersDirPath: AbsoluteFilePath;
}): boolean => {
  const domainEntries = safeReaddirLayerBroker({ dirPath: respondersDirPath });

  return domainEntries.some((domain) => {
    if (!domain.isDirectory()) return false;
    const domainPath = absoluteFilePathContract.parse(`${respondersDirPath}/${domain.name}`);
    const domainEntries2 = safeReaddirLayerBroker({ dirPath: domainPath });
    return domainEntries2.some((entry) => entry.isDirectory() && entry.name === 'create');
  });
};
