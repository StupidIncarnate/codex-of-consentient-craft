/**
 * PURPOSE: Sets up Antigravity configuration files (.agents/hooks.json, skills.json,
 * plugins/dungeonmaster/rules/AGENTS.md, and AGENTS.md) in the target project
 *
 * USAGE:
 * await installAgentsSetupBroker({ targetProjectRoot });
 * // Writes .agents files and AGENTS.md if CLAUDE.md exists
 */

import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { join } from '#gateway/node/path';
import { writeFileCreatingParent } from '#gateway/node/fs__promises';
import { existsSync } from '#gateway/node/fs';
import { agentsHooksCreatorTransformer } from '../../../transformers/agents-hooks-creator/agents-hooks-creator-transformer';
import { agentsSkillsCreatorTransformer } from '../../../transformers/agents-skills-creator/agents-skills-creator-transformer';
import { agentsRulesCreatorTransformer } from '../../../transformers/agents-rules-creator/agents-rules-creator-transformer';
import { agentsMdCreatorTransformer } from '../../../transformers/agents-md-creator/agents-md-creator-transformer';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const installAgentsSetupBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: FilePath;
}): Promise<void> => {
  // 1. .agents/hooks.json
  const hooksPath = join(
    targetProjectRoot,
    locationsStatics.repoRoot.agents.dir,
    locationsStatics.repoRoot.agents.hooksJson,
  );
  const hooksConfig = agentsHooksCreatorTransformer();
  await writeFileCreatingParent(hooksPath, jsonFileContentsTransformer({ value: hooksConfig }));

  // 2. .agents/skills.json
  const skillsPath = join(
    targetProjectRoot,
    locationsStatics.repoRoot.agents.dir,
    locationsStatics.repoRoot.agents.skillsJson,
  );
  const skillsConfig = agentsSkillsCreatorTransformer();
  await writeFileCreatingParent(skillsPath, jsonFileContentsTransformer({ value: skillsConfig }));

  // 3. .agents/plugins/dungeonmaster/rules/AGENTS.md
  const rulesPath = join(
    targetProjectRoot,
    locationsStatics.repoRoot.agents.dir,
    locationsStatics.repoRoot.agents.pluginsDir,
    mcpToolsStatics.server.name,
    locationsStatics.repoRoot.agents.rulesDir,
    locationsStatics.repoRoot.agentsMd,
  );
  const rulesContent = agentsRulesCreatorTransformer();
  await writeFileCreatingParent(rulesPath, rulesContent);

  // 4. AGENTS.md
  const claudeMdPath = join(targetProjectRoot, locationsStatics.repoRoot.claudeMd);
  const agentsMdPath = join(targetProjectRoot, locationsStatics.repoRoot.agentsMd);

  const claudeMdExists = existsSync(claudeMdPath);
  const agentsMdExists = existsSync(agentsMdPath);

  if (claudeMdExists && !agentsMdExists) {
    const agentsMdContent = agentsMdCreatorTransformer();
    await writeFileCreatingParent(agentsMdPath, agentsMdContent);
  }
};
