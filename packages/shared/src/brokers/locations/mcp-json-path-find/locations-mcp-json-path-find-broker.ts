/**
 * PURPOSE: Resolves the absolute path to .mcp.json by walking up from startPath to the project config root
 *
 * USAGE:
 * await locationsMcpJsonPathFindBroker({ startPath: FilePathStub({ value: '/project/packages/web/src/file.ts' }) });
 * // Returns AbsoluteFilePath '/project/.mcp.json'
 */

import { configRootFindBroker } from '../../config-root/find/config-root-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsMcpJsonPathFindBroker = async ({
  startPath,
}: {
  startPath: string;
}): Promise<string> => {
  const configRoot = await configRootFindBroker({ startPath });

  const joined = join(configRoot, locationsStatics.repoRoot.mcpJson);

  return joined;
};
