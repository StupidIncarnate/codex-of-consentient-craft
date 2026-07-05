/**
 * PURPOSE: Returns the declared orchestrationMode (claude | node) from `.dungeonmaster.json` for the
 * web UI to decide whether the create-quest surface is web-driven (node) or terminal-driven (claude).
 *
 * USAGE:
 * const mode = await OrchestrationModeGetResponder();
 * // Returns OrchestrationMode ('claude' | 'node')
 */

import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';

import { orchestrationModeGetBroker } from '../../../brokers/orchestration-mode/get/orchestration-mode-get-broker';

export const OrchestrationModeGetResponder = async (): Promise<OrchestrationMode> =>
  orchestrationModeGetBroker();
