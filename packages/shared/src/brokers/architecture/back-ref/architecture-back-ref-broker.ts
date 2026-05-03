/**
 * PURPOSE: Resolves an absolute file path to a back-reference token of the form
 * `packages/<pkg> (<ExportName>)` for project-map cross-package edge annotations.
 * The package segment is parsed from the path; the export name is extracted from
 * the file's first `export const|function <Name>` statement.
 *
 * USAGE:
 * const ref = architectureBackRefBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts'),
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns ContentText 'packages/orchestrator (ChatReplayResponder)' or null when
 * // the file is outside packages/, missing, or has no exported const/function
 *
 * WHEN-TO-USE: Project-map renderers attaching cross-package back-references to
 * HTTP, WS, and file-bus edges
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { exportNameExtractTransformer } from '../../../transformers/export-name-extract/export-name-extract-transformer';
import { architectureSourceReadBroker } from '../source-read/architecture-source-read-broker';

const PACKAGES_SEGMENT = '/packages/';

export const architectureBackRefBroker = ({
  filePath,
  projectRoot,
}: {
  filePath: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
}): ContentText | null => {
  const raw = String(filePath);
  const packagesPrefix = `${String(projectRoot)}${PACKAGES_SEGMENT}`;
  if (!raw.startsWith(packagesPrefix)) {
    return null;
  }
  const withoutPackages = raw.slice(packagesPrefix.length);
  const slashIdx = withoutPackages.indexOf('/');
  if (slashIdx === -1) {
    return null;
  }
  const packageName = withoutPackages.slice(0, slashIdx);

  const source = architectureSourceReadBroker({ filePath });
  if (source === undefined) {
    return null;
  }
  const exportName = exportNameExtractTransformer({ source });
  if (exportName === null) {
    return null;
  }

  return contentTextContract.parse(`packages/${packageName} (${String(exportName)})`);
};
