/**
 * PURPOSE: Creates the default .agents/skills.json configuration mounting the shared .claude/skills directory
 *
 * USAGE:
 * const skillsConfig = agentsSkillsCreatorTransformer();
 * // Returns: { entries: [{ path: '.claude/skills' }] }
 */

import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  agentsSkillsConfigContract,
  type AgentsSkillsConfig,
} from '../../contracts/agents-skills-config/agents-skills-config-contract';

export const agentsSkillsCreatorTransformer = (): AgentsSkillsConfig =>
  agentsSkillsConfigContract.parse({
    entries: [
      {
        path: `${locationsStatics.repoRoot.claude.dir}/skills`,
      },
    ],
  });
