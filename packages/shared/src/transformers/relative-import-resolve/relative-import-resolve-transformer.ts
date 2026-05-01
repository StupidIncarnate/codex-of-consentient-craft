/**
 * PURPOSE: Resolves a relative TypeScript import path to an absolute file path with .ts extension
 *
 * USAGE:
 * relativeImportResolveTransformer({
 *   sourceFile: absoluteFilePathContract.parse('/repo/packages/server/src/startup/start-server.ts'),
 *   importPath: contentTextContract.parse('../flows/server/server-flow'),
 * });
 * // Returns AbsoluteFilePath '/repo/packages/server/src/flows/server/server-flow.ts' or null if not relative
 *
 * WHEN-TO-USE: Boot-tree broker resolving import paths found in source files to absolute paths
 * for further inspection. Returns null when importPath is not relative (e.g. npm packages).
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const relativeImportResolveTransformer = ({
  sourceFile,
  importPath,
}: {
  sourceFile: AbsoluteFilePath;
  importPath: ContentText;
}): AbsoluteFilePath | null => {
  const importPathStr = String(importPath);
  if (!importPathStr.startsWith('.')) {
    return null;
  }

  const lastSlash = String(sourceFile).lastIndexOf('/');
  const dir = lastSlash === -1 ? '' : String(sourceFile).slice(0, lastSlash);

  const parts = dir.split('/');
  const segments = importPathStr.split('/');
  for (const seg of segments) {
    if (seg === '..') {
      parts.pop();
    } else if (seg !== '.') {
      parts.push(seg);
    }
  }

  const resolved = parts.join('/');
  const withTs = resolved.endsWith('.ts') ? resolved : `${resolved}.ts`;

  try {
    return absoluteFilePathContract.parse(withTs);
  } catch {
    return null;
  }
};
