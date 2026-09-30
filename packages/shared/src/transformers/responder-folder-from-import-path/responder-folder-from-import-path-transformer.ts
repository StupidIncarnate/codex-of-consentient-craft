/**
 * PURPOSE: Extracts the responder folder display path from an import path string.
 * Strips the trailing filename segment to produce the containing folder path.
 *
 * USAGE:
 * responderFolderFromImportPathTransformer({
 *   importPath: contentTextContract.parse('../../responders/quest/start/quest-start-responder'),
 * });
 * // Returns ContentText 'responders/quest/start'
 *
 * WHEN-TO-USE: http-backend headline renderer building the `→ responders/<folder>` route lines
 * WHEN-NOT-TO-USE: When the import path does not contain a `responders/` segment (returns empty)
 */


export const responderFolderFromImportPathTransformer = ({
  importPath,
}: {
  importPath: string;
}): string => {
  const ipStr = String(importPath);
  const respIdx = ipStr.indexOf('responders/');
  if (respIdx === -1) {
    return '';
  }
  const afterPrefix = ipStr.slice(respIdx + 'responders/'.length);
  const segments = afterPrefix.split('/');
  if (segments.length > 1) {
    const folderSegments = segments.slice(0, -1);
    return `responders/${folderSegments.join('/')}`;
  }
  return `responders/${afterPrefix}`;
};
