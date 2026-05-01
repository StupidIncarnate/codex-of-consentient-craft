/**
 * PURPOSE: Extracts the adapter folder display path from an import path string.
 * Strips the trailing filename segment to produce the containing folder path.
 *
 * USAGE:
 * adapterFolderFromImportPathTransformer({
 *   importPath: contentTextContract.parse('../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter'),
 * });
 * // Returns ContentText 'adapters/orchestrator/start-quest'
 *
 * WHEN-TO-USE: http-backend headline renderer building the `→ adapters/<folder>` route lines
 * WHEN-NOT-TO-USE: When the import path does not contain an `adapters/` segment (returns empty)
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

export const adapterFolderFromImportPathTransformer = ({
  importPath,
}: {
  importPath: ContentText;
}): ContentText => {
  const ipStr = String(importPath);
  const adpIdx = ipStr.indexOf('adapters/');
  if (adpIdx === -1) {
    return contentTextContract.parse('');
  }
  const afterPrefix = ipStr.slice(adpIdx + 'adapters/'.length);
  const segments = afterPrefix.split('/');
  if (segments.length > 1) {
    const folderSegments = segments.slice(0, -1);
    return contentTextContract.parse(`adapters/${folderSegments.join('/')}`);
  }
  return contentTextContract.parse(`adapters/${afterPrefix}`);
};
