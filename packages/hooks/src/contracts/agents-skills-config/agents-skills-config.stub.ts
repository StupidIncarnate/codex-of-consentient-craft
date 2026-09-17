import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgentsSkillsConfig } from './agents-skills-config-contract';
import { agentsSkillsConfigContract } from './agents-skills-config-contract';

export const AgentsSkillsConfigStub = ({
  ...props
}: StubArgument<AgentsSkillsConfig> = {}): AgentsSkillsConfig =>
  agentsSkillsConfigContract.parse({
    entries: [{ path: '.claude/skills' }],
    ...props,
  });
