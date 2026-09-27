/**
 * PURPOSE: A real `AbortController` instance, built through the real constructor — for a caller
 * staging `#gateway/browser/AbortController`'s own value without hand-typing a fake one.
 *
 * USAGE:
 * const controller = AbortControllerStub();
 * controller.abort();
 * // controller.signal.aborted === true
 */

export const AbortControllerStub = (): AbortController => new AbortController();
