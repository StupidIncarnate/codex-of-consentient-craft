/**
 * PURPOSE: A real `http.Server` that is not listening, built through `#gateway/node/http`'s own
 * re-exported `createServer` — for a caller that needs a genuine server object rather than a
 * hand-typed stand-in. It binds no port until the caller calls `listen`.
 *
 * USAGE:
 * const server = HttpServerStub();
 * server.listening; // false
 */
import { createServer } from './http';
import type { Server } from 'http';

export const HttpServerStub = (): Server => createServer();
