/**
 * PURPOSE: Wraps the serve function from @hono/node-server for mockability at I/O boundary
 *
 * USAGE:
 * honoServeAdapter({ fetch: app.fetch, port: 3737, hostname: 'localhost' });
 * // Starts the HTTP server
 */

import { serve } from '@hono/node-server';

export const honoServeAdapter = ({
  fetch,
  port,
  hostname,
  onListen,
}: {
  fetch: Parameters<typeof serve>[0]['fetch'];
  port: number;
  hostname: string;
  onListen: (info: { port: number }) => void;
}): ReturnType<typeof serve> => serve({ fetch, port, hostname }, onListen);
