// jsdom does not implement ResizeObserver — the pass-through module still needs a real function
// to export, so the same shape web's own jsdom-polyfills.cjs uses is reproduced here rather than
// shared across packages (the gateway takes no dependency on @dungeonmaster/web).
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// jest-environment-jsdom does not put Node's setImmediate/clearImmediate on globalThis.
// @dungeonmaster/testing's open-handle leak tracker (jest.setup.js) reads
// `globalThis.setImmediate.__promisify__` while wiring its own watcher, and an undefined
// setImmediate throws before a single test in this package runs.
const { setImmediate, clearImmediate } = require('node:timers');
if (typeof global.setImmediate === 'undefined') global.setImmediate = setImmediate;
if (typeof global.clearImmediate === 'undefined') global.clearImmediate = clearImmediate;

// undici references TextEncoder/TextDecoder/ReadableStream at module load, none of which
// jest-environment-jsdom provides.
const { TextEncoder, TextDecoder } = require('node:util');
const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
const { MessageChannel, MessagePort, BroadcastChannel } = require('node:worker_threads');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
if (typeof global.ReadableStream === 'undefined') global.ReadableStream = ReadableStream;
if (typeof global.WritableStream === 'undefined') global.WritableStream = WritableStream;
if (typeof global.TransformStream === 'undefined') global.TransformStream = TransformStream;
if (typeof global.MessageChannel === 'undefined') global.MessageChannel = MessageChannel;
if (typeof global.MessagePort === 'undefined') global.MessagePort = MessagePort;
if (typeof global.BroadcastChannel === 'undefined') global.BroadcastChannel = BroadcastChannel;

// jest-environment-jsdom defines no `fetch` at all (not even as an undefined property), and
// registerSpyOn needs the property to already exist on the object it spies on — fetch-json.proxy.ts
// spies on `globalThis.fetch` directly, so the real thing has to be there first.
const undici = require('undici');
if (typeof global.Response === 'undefined') global.Response = undici.Response;
if (typeof global.Request === 'undefined') global.Request = undici.Request;
if (typeof global.Headers === 'undefined') global.Headers = undici.Headers;
if (typeof global.fetch === 'undefined') global.fetch = undici.fetch;
