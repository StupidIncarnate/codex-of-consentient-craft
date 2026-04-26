/**
 * PURPOSE: Generates a package summary snippet by extracting package headers from the project map
 *
 * USAGE:
 * const content = HookSessionSnippetPackagesResponder();
 * // Returns ContentText with markdown list of package names and descriptions
 *
 * WHEN-TO-USE: When the session-snippet hook needs dynamic packages content at runtime
 */

import { architectureProjectMapBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { extractPackageHeadersTransformer } from '../../../transformers/extract-package-headers/extract-package-headers-transformer';

export const HookSessionSnippetPackagesResponder = ({
  projectRoot = absoluteFilePathContract.parse(processCwdAdapter()),
}: {
  projectRoot?: AbsoluteFilePath;
} = {}): ContentText => {
  const fullMap = architectureProjectMapBroker({
    projectRoot: absoluteFilePathContract.parse(String(projectRoot)),
  });

  return extractPackageHeadersTransformer({ projectMap: fullMap });
};
