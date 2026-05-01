/**
 * PURPOSE: Extracts the short flow name from a flow file display path by stripping the -flow suffix
 *
 * USAGE:
 * flowNameFromFilePathTransformer({ displayName: contentTextContract.parse('flows/quest/quest-flow') });
 * // Returns ContentText 'quest'
 *
 * WHEN-TO-USE: Boot-tree renderer building the ↳ flows/{f1, f2, ...} line for a startup file,
 * where the canonical flow identifier is the domain segment without the -flow suffix
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

export const flowNameFromFilePathTransformer = ({
  displayName,
}: {
  displayName: ContentText;
}): ContentText => {
  const displayStr = String(displayName);
  const lastSlash = displayStr.lastIndexOf('/');
  const stem = lastSlash === -1 ? displayStr : displayStr.slice(lastSlash + 1);
  const withoutFlowSuffix = stem.endsWith('-flow')
    ? stem.slice(0, stem.length - '-flow'.length)
    : stem;
  return contentTextContract.parse(withoutFlowSuffix);
};
