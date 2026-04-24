/**
 * PURPOSE: Adapter for StartOrchestrator.setWebPresence that wraps the orchestrator package — toggles the web-presence flag gating the cross-guild execution queue runner
 *
 * USAGE:
 * orchestratorSetWebPresenceAdapter({ isPresent: true });
 * // Returns: AdapterResult from the orchestrator indicating the flag flip succeeded.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const orchestratorSetWebPresenceAdapter = ({
  isPresent,
}: {
  isPresent: boolean;
}): AdapterResult => StartOrchestrator.setWebPresence({ isPresent });
