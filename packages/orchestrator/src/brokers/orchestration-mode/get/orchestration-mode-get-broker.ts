/**
 * PURPOSE: Reads the declared `orchestrationMode` (claude | node) from the repo's `.dungeonmaster.json`.
 * A missing config file (end-user installs, temp environments) is not an error — it falls back to the
 * contract default 'claude'. The web reads this to decide whether the create-quest surface is
 * web-driven (node) or terminal-driven via /dumpster-create (claude).
 *
 * USAGE:
 * const mode = await orchestrationModeGetBroker({ startDir: '/path/to/repo' });
 * // Returns OrchestrationMode ('claude' | 'node')
 */

import { ConfigNotFoundError, configResolveBroker } from '@dungeonmaster/config';
import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';

export const orchestrationModeGetBroker = async ({
  startDir,
}: {
  startDir: string;
}): Promise<OrchestrationMode> => {
  // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so hand it
  // the repo-root config file itself (<startDir>/.dungeonmaster.json), NOT the bare startDir directory: a bare
  // directory dirname()s to its PARENT, walks above the repo root, and misses the config.
  const startPath = join(startDir, dungeonmasterHomeStatics.paths.projectConfigFile);

  // Absence of a config file (ConfigNotFoundError) is a legitimate "no declared mode" state — fall
  // back to the contract default, matching what a config missing the field would resolve to. Any
  // other error (malformed JSON, validation) MUST surface.
  try {
    const config = await configResolveBroker({ filePath: startPath });
    return config.orchestrationMode;
  } catch (error: unknown) {
    if (error instanceof ConfigNotFoundError) {
      return 'claude';
    }
    throw error;
  }
};
