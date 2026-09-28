import { xhrPostWithProgress } from './xhr-post-with-progress';
import { xhrPostWithProgressProxy } from './xhr-post-with-progress.proxy';

describe('xhrPostWithProgress', () => {
  it('VALID: {200 JSON response} => resolves status, ok and the raw body text', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/quests/q1/chat', status: 200, bodyText: '{"key":"value"}' });

    const result = await xhrPostWithProgress({
      url: '/api/quests/q1/chat',
      body: { payload: 'data' },
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({ status: 200, ok: true, body: '{"key":"value"}' });
  });

  it('VALID: {body object} => POSTs it JSON-encoded and the proxy reads it back', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/quests/q1/chat', status: 200, bodyText: '{}' });

    await xhrPostWithProgress({
      url: '/api/quests/q1/chat',
      body: { payload: 'data', count: 3 },
      onProgress: (): void => undefined,
    });

    await expect(proxy.getRequestBodies({ url: '/api/quests/q1/chat' })).resolves.toStrictEqual([
      { payload: 'data', count: 3 },
    ]);
  });

  it('VALID: {a 7-byte body} => onProgress observes the upload complete at 7 of 7 bytes before the promise resolves', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/quests/q1/chat', status: 200, bodyText: '{}' });
    const readings: { bytesSent: number; bytesTotal: number }[] = [];

    await xhrPostWithProgress({
      url: '/api/quests/q1/chat',
      body: { a: 1 },
      onProgress: (reading): void => {
        readings.push(reading);
      },
    });

    expect(readings).toStrictEqual([{ bytesSent: 7, bytesTotal: 7 }]);
  });

  it('VALID: {409 response} => resolves status 409, ok false, without throwing', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({
      url: '/api/quests/q1/chat',
      status: 409,
      bodyText: '{"reason":"loop owns the queue"}',
    });

    const result = await xhrPostWithProgress({
      url: '/api/quests/q1/chat',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 409,
      ok: false,
      body: '{"reason":"loop owns the queue"}',
    });
  });

  it('EMPTY: {204 with no body} => resolves ok true with an empty body text', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/quests/q1/chat', status: 204, bodyText: '' });

    const result = await xhrPostWithProgress({
      url: '/api/quests/q1/chat',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({ status: 204, ok: true, body: '' });
  });

  it('EDGE: {status 300} => resolves ok false', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/quests/q1/chat', status: 300, bodyText: '' });

    const result = await xhrPostWithProgress({
      url: '/api/quests/q1/chat',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({ status: 300, ok: false, body: '' });
  });

  it('ERROR: {network failure} => rejects naming the url', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupRefused({ url: '/api/quests/q1/chat' });

    await expect(
      xhrPostWithProgress({
        url: '/api/quests/q1/chat',
        body: {},
        onProgress: (): void => undefined,
      }),
    ).rejects.toThrow(/^POST \/api\/quests\/q1\/chat failed: network error$/u);
  });

  it('EMPTY: {no call made} => getRequestCount reads 0', () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/quests/q1/chat', status: 200, bodyText: '{}' });

    expect(proxy.getRequestCount({ url: '/api/quests/q1/chat' })).toBe(0);
  });

  it('VALID: {two urls staged differently} => a POST is answered by its own url staging', async () => {
    const proxy = xhrPostWithProgressProxy();
    proxy.setupResponse({ url: '/api/route-a', status: 201, bodyText: '{"from":"a"}' });
    proxy.setupResponse({ url: '/api/route-b', status: 404, bodyText: '{"from":"b"}' });

    const result = await xhrPostWithProgress({
      url: '/api/route-a',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({ status: 201, ok: true, body: '{"from":"a"}' });
  });
});
