// Polyfills for browser APIs missing in jsdom that Mantine components require

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Fetch API polyfills for MSW compatibility in jsdom
// These globals must exist before MSW loads (it references them at module scope)
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

// Node timer functions needed by undici internals
const { setImmediate, clearImmediate } = require('node:timers');
if (typeof global.setImmediate === 'undefined') global.setImmediate = setImmediate;
if (typeof global.clearImmediate === 'undefined') global.clearImmediate = clearImmediate;

// Stub for performance resource timing that undici expects
if (typeof global.performance !== 'undefined' && typeof global.performance.markResourceTiming === 'undefined') {
  global.performance.markResourceTiming = () => {};
}

// Provide Response/Request/Headers/fetch from undici (needed for MSW module-level imports)
// IMPORTANT: globalThis.fetch MUST be set here (before server.listen()) so that MSW's
// FetchInterceptor.checkEnvironment() finds it and wraps it during server.listen().
// If fetch is undefined when server.listen() runs, MSW skips the FetchInterceptor entirely.
const undici = require('undici');
if (typeof global.Response === 'undefined') global.Response = undici.Response;
if (typeof global.Request === 'undefined') global.Request = undici.Request;
if (typeof global.Headers === 'undefined') global.Headers = undici.Headers;
if (typeof global.fetch === 'undefined') global.fetch = undici.fetch;
