import { ByteLengthStub } from '../../../contracts/byte-length/byte-length.stub';

import { xhrPostWithProgressAdapter } from './xhr-post-with-progress-adapter';
import { xhrPostWithProgressAdapterProxy } from './xhr-post-with-progress-adapter.proxy';

describe('xhrPostWithProgressAdapter', () => {
  it('VALID: {200 JSON response} => returns status, ok, and parsed body', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 200, body: { key: 'value' } });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: { payload: 'data' },
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 200,
      ok: true,
      body: { key: 'value' },
    });
  });

  it('VALID: {body: payload+count} => POSTs the exact JSON-stringified body', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 200, body: {} });

    await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: { payload: 'data', count: 3 },
      onProgress: (): void => undefined,
    });

    expect(proxy.getSentBody()).toStrictEqual({ payload: 'data', count: 3 });
  });

  it('VALID: {progress readings 0/100 -> 50/100 -> 100/100} => onProgress observes them in order, complete before the promise resolves', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 200, body: {} });
    proxy.emitsProgress({
      readings: [
        { loaded: ByteLengthStub({ value: 0 }), total: ByteLengthStub({ value: 100 }) },
        { loaded: ByteLengthStub({ value: 50 }), total: ByteLengthStub({ value: 100 }) },
        { loaded: ByteLengthStub({ value: 100 }), total: ByteLengthStub({ value: 100 }) },
      ],
    });
    const onProgress = jest.fn();

    await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress,
    });

    expect(onProgress.mock.calls).toStrictEqual([
      [{ bytesSent: 0, bytesTotal: 100 }],
      [{ bytesSent: 50, bytesTotal: 100 }],
      [{ bytesSent: 100, bytesTotal: 100 }],
    ]);
  });

  it('EDGE: {reading with lengthComputable false} => onProgress is never called', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 200, body: {} });
    proxy.emitsProgress({
      readings: [
        {
          loaded: ByteLengthStub({ value: 50 }),
          total: ByteLengthStub({ value: 100 }),
          lengthComputable: false,
        },
      ],
    });
    const onProgress = jest.fn();

    await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress,
    });

    expect(onProgress.mock.calls).toStrictEqual([]);
  });

  it('VALID: {409 JSON response} => returns status 409 with parsed body without throwing', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({
      status: 409,
      body: { allowed: false, reason: 'loop owns the queue' },
    });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 409,
      ok: false,
      body: { allowed: false, reason: 'loop owns the queue' },
    });
  });

  it('EDGE: {non-JSON text response} => returns the raw text body', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 500, body: 'plain failure' });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 500,
      ok: false,
      body: 'plain failure',
    });
  });

  it('EMPTY: {204 empty response} => returns body null', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 204 });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 204,
      ok: true,
      body: null,
    });
  });

  it('ERROR: {network failure} => rejects naming the url', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.networkError();

    await expect(
      xhrPostWithProgressAdapter({
        url: '/xhr-test/endpoint',
        body: {},
        onProgress: (): void => undefined,
      }),
    ).rejects.toThrow(/xhr-test\/endpoint/u);
  });

  it('ERROR: {a load event carrying status 0} => the promise rejects rather than hanging', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 0 });

    await expect(
      xhrPostWithProgressAdapter({
        url: '/xhr-test/endpoint',
        body: {},
        onProgress: (): void => undefined,
      }),
    ).rejects.toThrow(/Number must be greater than or equal to 100/u);
  });

  it('EDGE: {status 204} => resolves ok: true with body null', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 204 });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 204,
      ok: true,
      body: null,
    });
  });

  it('EDGE: {status 300} => resolves ok: false', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 300 });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 300,
      ok: false,
      body: null,
    });
  });

  it('EDGE: {status 200} => resolves ok: true', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });
    proxy.respondsWith({ status: 200 });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/endpoint',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 200,
      ok: true,
      body: null,
    });
  });

  it("VALID: {two proxies constructed for different routes, each staged with its own status and body} => a POST to the first route is answered by the first proxy's staging", async () => {
    const proxyA = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/route-a' });
    const proxyB = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/route-b' });
    proxyA.respondsWith({ status: 201, body: { from: 'a' } });
    proxyB.respondsWith({ status: 404, body: { from: 'b' } });

    const result = await xhrPostWithProgressAdapter({
      url: '/xhr-test/route-a',
      body: {},
      onProgress: (): void => undefined,
    });

    expect(result).toStrictEqual({
      status: 201,
      ok: true,
      body: { from: 'a' },
    });
  });

  it('ERROR: {a POST to a url no constructed proxy registered} => throws naming the url', async () => {
    xhrPostWithProgressAdapterProxy({ route: '/xhr-test/registered-route' });

    await expect(
      xhrPostWithProgressAdapter({
        url: '/xhr-test/totally-unregistered',
        body: {},
        onProgress: (): void => undefined,
      }),
    ).rejects.toThrow(/xhr-test\/totally-unregistered/u);
  });

  it('INVALID: {url: ""} => the promise rejects rather than issuing a request', async () => {
    const proxy = xhrPostWithProgressAdapterProxy({ route: '/xhr-test/endpoint' });

    await expect(
      xhrPostWithProgressAdapter({
        url: '',
        body: {},
        onProgress: (): void => undefined,
      }),
    ).rejects.toThrow(/String must contain at least 1 character/u);

    expect(proxy.getRequestCount()).toBe(0);
  });
});
