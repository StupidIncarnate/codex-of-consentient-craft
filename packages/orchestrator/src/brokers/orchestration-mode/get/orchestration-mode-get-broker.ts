/**
 * PURPOSE: Reads the declared `orchestrationMode` (claude | node) from the repo's `.dungeonmaster.json`.
 * A missing config file (end-user installs, temp environments) is not an error — it falls back to the
 * contract default 'claude'. The web reads this to decide whether the create-quest surface is
 * web-driven (node) or terminal-driven via /dumpster-create (claude).
 *
 * USAGE:
 * const mode = await orchestrationModeGetBroker();
 * // Returns OrchestrationMode ('claude' | 'node')
 */

import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, orchestrationModeContract } from '@dungeonmaster/shared/contracts';
import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';

export const orchestrationModeGetBroker = async (): Promise<OrchestrationMode> => {
  // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so hand it
  // the repo-root config file itself (<cwd>/.dungeonmaster.json), NOT the bare cwd directory: a bare
  // directory dirname()s to cwd's PARENT, walks above the repo root, and misses the config.
  const startPath = filePathContract.parse(
    pathJoinAdapter({
      paths: [processCwdAdapter(), dungeonmasterHomeStatics.paths.projectConfigFile],
    }),
  );

  // Absence of a config file (ConfigNotFoundError) is a legitimate "no declared mode" state — fall
  // back to the contract default, matching what a config missing the field would resolve to. Any
  // other error (malformed JSON, validation) MUST surface.
  try {
    const config = await dungeonmasterConfigResolveAdapter({ startPath });
    return config.orchestrationMode;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ConfigNotFoundError') {
      return orchestrationModeContract.parse('claude');
    }
    throw error;
  }
};
