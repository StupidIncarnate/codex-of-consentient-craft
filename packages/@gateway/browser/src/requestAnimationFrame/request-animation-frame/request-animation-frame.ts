/// <reference lib="dom" />
/**
 * PURPOSE: Schedules a callback for the next frame through the browser global
 * `requestAnimationFrame`. The global is read at CALL time, so a spy installed after this module
 * loads sees the call.
 *
 * USAGE:
 * const frameId = requestAnimationFrame((timestamp) => { ... });
 * // Returns the frame request id
 */

export const requestAnimationFrame = (callback: FrameRequestCallback): number =>
  globalThis.requestAnimationFrame(callback);
