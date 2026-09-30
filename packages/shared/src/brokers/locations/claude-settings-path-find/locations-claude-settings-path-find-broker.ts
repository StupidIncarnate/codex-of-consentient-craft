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

export type ClaudeSettingsKind = 'shared' | 'local';

export const locationsClaudeSettingsPathFindBroker = async ({
  startPath,
  kind,
}: {
  startPath: string;
  kind: ClaudeSettingsKind;
}): Promise<string> => {
  const configRoot = await configRootFindBroker({ startPath });

  const settingsFile =
    kind === 'shared'
      ? locationsStatics.repoRoot.claude.settings
      : locationsStatics.repoRoot.claude.settingsLocal;

  const joined = join(configRoot, locationsStatics.repoRoot.claude.dir, settingsFile);

  return joined;
};
