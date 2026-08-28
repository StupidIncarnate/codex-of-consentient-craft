// Minimal ambient surface for the `ws` npm package. `ws` is a transitive dependency (pulled in
// by @hono/node-ws) with no `@types/ws` installed anywhere in this monorepo's node_modules — see
// packages/server/test/harnesses/server-ws/server-ws.harness.ts for why a real client from this
// package, rather than the global undici-based WebSocket, is what the harness needs. Only the
// surface that harness actually calls is declared.
declare module 'ws' {
  import { EventEmitter } from 'events';

  export default class WebSocket extends EventEmitter {
    constructor(address: string);
    send(data: string): void;
    close(): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'message', listener: (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void): this;
    once(event: 'open', listener: () => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
  }
}
