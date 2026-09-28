/**
 * PURPOSE: A real, listening `ServerType`, built by actually calling this subpath's own `serve()`
 * against a real Hono app bound to an OS-assigned port (port 0) — never a hand-typed object
 * standing in for what a listening server looks like. The caller closes it (`server.close()`) when
 * done, same as any other real handle this gateway hands back.
 *
 * USAGE:
 * const server = ServerStub();
 * // Returns a real, already-starting-to-listen server; close it when done
 */
import { Hono } from 'hono';
import { serve } from './server';

export const ServerStub = (): ReturnType<typeof serve> =>
  serve({ fetch: new Hono().fetch, port: 0 });
