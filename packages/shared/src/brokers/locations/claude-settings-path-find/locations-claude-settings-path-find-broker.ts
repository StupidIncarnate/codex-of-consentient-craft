/**
 * PURPOSE: Resolves the absolute path to .claude/settings.json or .claude/settings.local.json by walking up to the project config root
 *
 * USAGE:
 * await locationsClaudeSettingsPathFindBroker({
 *   startPath: FilePathStub({ value: '/project/src/file.ts' }),
 *   kind: 'shared',
 * });
 * // Returns AbsoluteFilePath '/project/.claude/settings.json'
 */

import { configRootFindBroker } from '../../config-root/find/config-root-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export type ClaudeSettingsKind = 'shared' | 'local';

export const locationsClaudeSettingsPathFindBroker = async ({
  startPath,
  kind,
}: {
  startPath: string;
  kind: ClaudeSettingsKind;
}): Promise<AbsoluteFilePath> => {
  const configRoot = await configRootFindBroker({ startPath });

  const settingsFile =
    kind === 'shared'
      ? locationsStatics.repoRoot.claude.settings
      : locationsStatics.repoRoot.claude.settingsLocal;

  const joined = join(configRoot, locationsStatics.repoRoot.claude.dir, settingsFile);

  return absoluteFilePathContract.parse(joined);
};
