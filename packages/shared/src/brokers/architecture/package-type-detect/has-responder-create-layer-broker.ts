/**
 * PURPOSE: Checks whether any domain folder under responders/ contains a create/ subdirectory
 *
 * USAGE:
 * const hasCreate = hasResponderCreateLayerBroker({ respondersDirPath: '/project/src/responders' });
 * // Returns true if any responders-domain/create/ folder exists
 *
 * WHEN-TO-USE: During package-type detection for the eslint-plugin signal (responders-domain/create/ must exist)
 */

import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const hasResponderCreateLayerBroker = ({
  respondersDirPath,
}: {
  respondersDirPath: string;
}): boolean => {
  const domainEntries = safeReaddirLayerBroker({ dirPath: respondersDirPath });

  return domainEntries.some((domain) => {
    if (domain.kind !== 'directory') return false;
    const domainPath = `${respondersDirPath}/${domain.name}`;
    const domainEntries2 = safeReaddirLayerBroker({ dirPath: domainPath });
    return domainEntries2.some((entry) => entry.kind === 'directory' && entry.name === 'create');
  });
};
