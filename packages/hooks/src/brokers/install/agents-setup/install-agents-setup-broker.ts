/**
 * PURPOSE: Sets up Antigravity configuration files (.agents/hooks.json, skills.json,
 * plugins/dungeonmaster/rules/AGENTS.md, and AGENTS.md) in the target project
 *
 * USAGE:
 * await installAgentsSetupBroker({ targetProjectRoot });
 * // Writes .agents files and AGENTS.md if CLAUDE.md exists
 */

import { type AdapterResult, fileContentsContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsEnsureWriteAdapter } from '../../../adapters/fs/ensure-write/fs-ensure-write-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { agentsHooksCreatorTransformer } from '../../../transformers/agents-hooks-creator/agents-hooks-creator-transformer';
import { agentsSkillsCreatorTransformer } from '../../../transformers/agents-skills-creator/agents-skills-creator-transformer';
import { agentsRulesCreatorTransformer } from '../../../transformers/agents-rules-creator/agents-rules-creator-transformer';
import { agentsMdCreatorTransformer } from '../../../transformers/agents-md-creator/agents-md-creator-transformer';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const JSON_INDENT_SPACES = 2;

export const installAgentsSetupBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: FilePath;
}): Promise<AdapterResult> => {
  // 1. .agents/hooks.json
  const hooksPath = pathJoinAdapter({
    paths: [
      targetProjectRoot,
      locationsStatics.repoRoot.agents.dir,
      locationsStatics.repoRoot.agents.hooksJson,
    ],
  });
  const hooksConfig = agentsHooksCreatorTransformer();
  await fsEnsureWriteAdapter({
    filepath: hooksPath,
    contents: fileContentsContract.parse(JSON.stringify(hooksConfig, null, JSON_INDENT_SPACES)),
  });

  // 2. .agents/skills.json
  const skillsPath = pathJoinAdapter({
    paths: [
      targetProjectRoot,
      locationsStatics.repoRoot.agents.dir,
      locationsStatics.repoRoot.agents.skillsJson,
    ],
  });
  const skillsConfig = agentsSkillsCreatorTransformer();
  await fsEnsureWriteAdapter({
    filepath: skillsPath,
    contents: fileContentsContract.parse(JSON.stringify(skillsConfig, null, JSON_INDENT_SPACES)),
  });

  // 3. .agents/plugins/dungeonmaster/rules/AGENTS.md
  const rulesPath = pathJoinAdapter({
    paths: [
      targetProjectRoot,
      locationsStatics.repoRoot.agents.dir,
      locationsStatics.repoRoot.agents.pluginsDir,
      mcpToolsStatics.server.name,
      locationsStatics.repoRoot.agents.rulesDir,
      locationsStatics.repoRoot.agentsMd,
    ],
  });
  const rulesContent = agentsRulesCreatorTransformer();
  await fsEnsureWriteAdapter({
    filepath: rulesPath,
    contents: rulesContent,
  });

  // 4. AGENTS.md
  const claudeMdPath = pathJoinAdapter({
    paths: [targetProjectRoot, locationsStatics.repoRoot.claudeMd],
  });
  const agentsMdPath = pathJoinAdapter({
    paths: [targetProjectRoot, locationsStatics.repoRoot.agentsMd],
  });

  const claudeMdExists = fsExistsSyncAdapter({ filePath: claudeMdPath });
  const agentsMdExists = fsExistsSyncAdapter({ filePath: agentsMdPath });

  if (claudeMdExists && !agentsMdExists) {
    const agentsMdContent = agentsMdCreatorTransformer();
    await fsEnsureWriteAdapter({
      filepath: agentsMdPath,
      contents: agentsMdContent,
    });
  }

  return { success: true };
};
