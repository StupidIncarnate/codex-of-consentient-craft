/**
 * PURPOSE: A real `XMLHttpRequest` instance, built through the real constructor — for a caller
 * staging `#gateway/browser/XMLHttpRequest`'s own value without hand-typing a fake one.
 *
 * USAGE:
 * const request = XmlHttpRequestStub();
 * request.open('GET', '/api/guilds');
 */

export const XmlHttpRequestStub = (): XMLHttpRequest => new XMLHttpRequest();
