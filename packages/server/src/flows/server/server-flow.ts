/**
 * PURPOSE: Creates main Hono app, mounts domain sub-apps, and initializes server via ServerInitResponder
 *
 * USAGE:
 * ServerFlow({ subApps: [GuildFlow(), QuestFlow(), ...] });
 * // Creates HTTP server with all routes mounted, WebSocket, event relay, and lifecycle management
 */

import { Hono } from 'hono';

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { ServerInitResponder } from '../../responders/server/init/server-init-responder';
import { RequestLogFlow } from '../request-log/request-log-flow';

export const ServerFlow = ({
  subApps,
  serveWebBundle = false,
}: {
  subApps: Hono[];
  serveWebBundle?: boolean;
}): AdapterResult => {
  const app = new Hono();

  app.route('', RequestLogFlow());

  for (const sub of subApps) {
    app.route('', sub);
  }

  ServerInitResponder({ app, serveWebBundle });
  return adapterResultContract.parse({ success: true });
};
