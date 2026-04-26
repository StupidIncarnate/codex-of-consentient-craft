/**
 * PURPOSE: Resolves the absolute path to .mcp.json by walking up from startPath to the project config root
 *
 * USAGE:
 * await locationsMcpJsonPathFindBroker({ startPath: FilePathStub({ value: '/project/packages/web/src/file.ts' }) });
 * // Returns AbsoluteFilePath '/project/.mcp.json'
 */

import { configRootFindBroker } from '../../config-root/find/config-root-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsMcpJsonPathFindBroker = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<AbsoluteFilePath> => {
  const configRoot = await configRootFindBroker({ startPath });

  const joined = pathJoinAdapter({
    paths: [configRoot, locationsStatics.repoRoot.mcpJson],
  });

  return absoluteFilePathContract.parse(joined);
};
