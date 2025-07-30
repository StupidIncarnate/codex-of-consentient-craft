import type { Quest, PhaseType } from '../models/quest';
import type { AgentSpawner } from '../agents/agent-spawner';
import type { AgentType } from '../models/agent';

export interface PhaseRunner {
  canRun(quest: Quest): boolean;
  run(quest: Quest, agentSpawner: AgentSpawner): Promise<void>;
  getAgentType(): AgentType;
  getPhaseType(): PhaseType;
}
