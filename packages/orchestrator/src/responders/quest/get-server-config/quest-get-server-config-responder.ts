/**
 * PURPOSE: Responder for the MCP get-server-config tool — delegates to questGetServerConfigBroker
 *
 * USAGE:
 * const result = QuestGetServerConfigResponder();
 * // Returns: { baseUrl, port } — the running server config
 */

import { questGetServerConfigBroker } from '../../../brokers/quest/get-server-config/quest-get-server-config-broker';
import type { QuestGetServerConfigResult } from '../../../contracts/quest-get-server-config-result/quest-get-server-config-result-contract';

export const QuestGetServerConfigResponder = (): QuestGetServerConfigResult =>
  questGetServerConfigBroker();
