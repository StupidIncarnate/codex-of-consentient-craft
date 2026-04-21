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

export const ServerFlow = ({ subApps }: { subApps: Hono[] }): AdapterResult => {
  const app = new Hono();

  for (const sub of subApps) {
    app.route('', sub);
  }

  ServerInitResponder({ app });
  return adapterResultContract.parse({ success: true });
};
