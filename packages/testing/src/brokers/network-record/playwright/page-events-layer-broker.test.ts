import { pageEventsLayerBroker } from './page-events-layer-broker';
import { pageEventsLayerBrokerProxy } from './page-events-layer-broker.proxy';

describe('pageEventsLayerBroker', () => {
  describe('request events', () => {
    it('VALID: {request event} => onRequest gets url, method, postData and the request itself', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const seen: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: (args) => seen.push(args),
        onResponse: () => undefined,
        onRequestFailed: () => undefined,
        onWebSocketFrame: () => undefined,
      });

      const request = proxy.emitRequest({
        url: 'http://localhost/api/x',
        method: 'POST',
        postData: '{"a":1}',
      });

      expect(seen).toStrictEqual([
        {
          url: 'http://localhost/api/x',
          method: 'POST',
          postData: '{"a":1}',
          requestIdentity: request,
        },
      ]);
    });
  });

  describe('response events', () => {
    it('VALID: {json content-type} => hasCapturableBody true and text() reads the body', async () => {
      const proxy = pageEventsLayerBrokerProxy();
      const seen: {
        url: unknown;
        method: unknown;
        status: unknown;
        hasCapturableBody: unknown;
        body: unknown;
      }[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: ({ url, method, status, hasCapturableBody, text }) => {
          seen.push({ url, method, status, hasCapturableBody, body: text() });
        },
        onRequestFailed: () => undefined,
        onWebSocketFrame: () => undefined,
      });

      proxy.emitResponse({
        url: 'http://localhost/api/x',
        method: 'GET',
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: '{"ok":true}',
      });

      await expect(Promise.resolve(seen[0]?.body)).resolves.toBe('{"ok":true}');
      expect(seen.map(({ body: _body, ...rest }) => rest)).toStrictEqual([
        {
          url: 'http://localhost/api/x',
          method: 'GET',
          status: 200,
          hasCapturableBody: true,
        },
      ]);
    });

    it('VALID: {text/plain content-type} => hasCapturableBody true', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const flags: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: ({ hasCapturableBody }) => flags.push(hasCapturableBody),
        onRequestFailed: () => undefined,
        onWebSocketFrame: () => undefined,
      });

      proxy.emitResponse({
        url: 'http://localhost/a',
        method: 'GET',
        status: 200,
        contentType: 'text/plain',
        body: 'hi',
      });

      expect(flags).toStrictEqual([true]);
    });

    it('VALID: {image content-type} => hasCapturableBody false', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const flags: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: ({ hasCapturableBody }) => flags.push(hasCapturableBody),
        onRequestFailed: () => undefined,
        onWebSocketFrame: () => undefined,
      });

      proxy.emitResponse({
        url: 'http://localhost/a.png',
        method: 'GET',
        status: 200,
        contentType: 'image/png',
        body: '',
      });

      expect(flags).toStrictEqual([false]);
    });

    it('EMPTY: {no content-type header} => hasCapturableBody false', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const flags: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: ({ hasCapturableBody }) => flags.push(hasCapturableBody),
        onRequestFailed: () => undefined,
        onWebSocketFrame: () => undefined,
      });

      proxy.emitResponse({ url: 'http://localhost/a', method: 'GET', status: 204, body: '' });

      expect(flags).toStrictEqual([false]);
    });
  });

  describe('request failures', () => {
    it('VALID: {requestfailed with errorText} => onRequestFailed gets the error text', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const seen: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: () => undefined,
        onRequestFailed: ({ url, method, errorText }) => seen.push({ url, method, errorText }),
        onWebSocketFrame: () => undefined,
      });

      proxy.emitRequestFailed({
        url: 'http://localhost/api/x',
        method: 'GET',
        errorText: 'net::ERR_CONNECTION_REFUSED',
      });

      expect(seen).toStrictEqual([
        {
          url: 'http://localhost/api/x',
          method: 'GET',
          errorText: 'net::ERR_CONNECTION_REFUSED',
        },
      ]);
    });

    it('EMPTY: {requestfailed with no failure} => errorText is undefined', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const seen: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: () => undefined,
        onRequestFailed: ({ errorText }) => seen.push(errorText),
        onWebSocketFrame: () => undefined,
      });

      proxy.emitRequestFailed({ url: 'http://localhost/a', method: 'GET', errorText: null });

      expect(seen).toStrictEqual([undefined]);
    });
  });

  describe('websocket frames', () => {
    it('VALID: {sent and received frames} => onWebSocketFrame gets each direction and payload', () => {
      const proxy = pageEventsLayerBrokerProxy();
      const seen: unknown[] = [];
      pageEventsLayerBroker({
        page: proxy.getPage(),
        onRequest: () => undefined,
        onResponse: () => undefined,
        onRequestFailed: () => undefined,
        onWebSocketFrame: (frame) => seen.push(frame),
      });

      proxy.emitWebSocketFrame({ direction: 'received', payload: 'from-server' });
      proxy.emitWebSocketFrame({ direction: 'sent', payload: 'from-page' });

      expect(seen).toStrictEqual([
        { direction: 'received', payload: 'from-server' },
        { direction: 'sent', payload: 'from-page' },
      ]);
    });
  });
});
