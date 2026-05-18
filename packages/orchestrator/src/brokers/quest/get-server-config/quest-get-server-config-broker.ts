/**
 * PURPOSE: Resolves the dungeonmaster server's currently-bound `{baseUrl, port}` for the get-server-config MCP tool — slash commands use the result to point the browser at the running server
 *
 * USAGE:
 * const { baseUrl, port } = questGetServerConfigBroker();
 * // baseUrl: 'http://dungeonmaster.localhost:3737', port: 3737 (branded NetworkPort)
 *
 * WHEN-TO-USE: Called by the `get-server-config` MCP tool (wired in step 9). The /dumpster-create
 *   slash command reads `{baseUrl}` to build the spec-view URL it opens in the browser.
 * WHEN-NOT-TO-USE: Anywhere needing the raw port number alone — call `portResolveBroker` from
 *   `@dungeonmaster/shared/brokers` directly. This broker is the URL-shape entry point only.
 */

import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import {
  questGetServerConfigResultContract,
  type QuestGetServerConfigResult,
} from '../../../contracts/quest-get-server-config-result/quest-get-server-config-result-contract';

export const questGetServerConfigBroker = (): QuestGetServerConfigResult => {
  const port = portResolveBroker();
  const baseUrl = `http://${environmentStatics.hostname}:${String(port)}`;

  return questGetServerConfigResultContract.parse({ baseUrl, port });
};
