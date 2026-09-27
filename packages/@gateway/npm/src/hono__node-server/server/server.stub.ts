/**
 * PURPOSE: A real, listening `ServerType`, built by actually calling `@hono/node-server`'s own
 * `serve()` against a real Hono app bound to an OS-assigned port (port 0) — never a hand-typed
 * object standing in for what a listening server looks like. The caller closes it
 * (`server.close()`) when done, same as any other real handle this gateway hands back.
 *
 * USAGE:
 * const server = ServerStub();
 * // Returns a real, already-starting-to-listen server; close it when done
 */
import { serve } from '@hono/node-server';
import type { ServerType } from '@hono/node-server';
import { Hono } from 'hono';

export const ServerStub = (): ServerType => serve({ fetch: new Hono().fetch, port: 0 });
