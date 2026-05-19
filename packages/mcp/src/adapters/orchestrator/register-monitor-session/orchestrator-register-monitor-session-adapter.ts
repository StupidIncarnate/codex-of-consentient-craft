/**
 * PURPOSE: Adapter for StartOrchestrator.registerMonitorSession that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorRegisterMonitorSessionAdapter({ sessionFilePath });
 * // Returns: RegisterMonitorSessionResult — { status: 'registered', orphansReset }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { RegisterMonitorSessionResult } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const orchestratorRegisterMonitorSessionAdapter = async ({
  sessionFilePath,
}: {
  sessionFilePath: FilePath;
}): Promise<RegisterMonitorSessionResult> =>
  StartOrchestrator.registerMonitorSession({ sessionFilePath });
