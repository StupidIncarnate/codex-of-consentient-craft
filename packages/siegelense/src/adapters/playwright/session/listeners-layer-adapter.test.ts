import { listenersLayerAdapter } from './listeners-layer-adapter';
import { listenersLayerAdapterProxy } from './listeners-layer-adapter.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

describe('listenersLayerAdapter', () => {
  describe('isBodySkippedResourceType()', () => {
    it('VALID: {resourceType: "script"} => returns true', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.isBodySkippedResourceType({ resourceType: 'script' });

      expect(result).toBe(true);
    });

    it('VALID: {resourceType: "xhr"} => returns false', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.isBodySkippedResourceType({ resourceType: 'xhr' });

      expect(result).toBe(false);
    });
  });

  describe('skippedBodyPlaceholder()', () => {
    it('VALID: {} => says the body was not captured for this resource type', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.skippedBodyPlaceholder();

      expect(result).toBe('<body not captured for this resource type>');
    });
  });

  describe('unavailableBodyPlaceholder()', () => {
    it('VALID: {error: Error("boom")} => embeds the error string', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.unavailableBodyPlaceholder({ error: new Error('boom') });

      expect(result).toBe('<body unavailable: Error: boom>');
    });
  });

  describe('truncatedBody()', () => {
    it('VALID: {text: "hello"} => returns it unchanged', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.truncatedBody({ text: 'hello' });

      expect(result).toBe('hello');
    });

    it('EDGE: {text: 200,001 chars} => caps at 200,000 chars', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.truncatedBody({ text: 'x'.repeat(200_001) });

      expect(result).toBe('x'.repeat(200_000));
    });
  });

  describe('truncatePayload()', () => {
    it('VALID: {text: "hello"} => returns it unchanged', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.truncatePayload({ text: 'hello' });

      expect(result).toBe('hello');
    });

    it('EDGE: {text: 200,001 chars} => caps at 200,000 chars', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.truncatePayload({ text: 'x'.repeat(200_001) });

      expect(result).toBe('x'.repeat(200_000));
    });
  });

  describe('consoleLine()', () => {
    it('VALID: {console fields} => returns the exact JSON line', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.consoleLine({
        at: EpochMsStub({ value: 1_700_000_000_000 }),
        type: 'log',
        text: 'hi',
        url: 'http://x/app.js',
        line: 12,
      });

      expect(result).toBe(
        '{"at":1700000000000,"kind":"console","type":"log","text":"hi","url":"http://x/app.js","line":12}',
      );
    });
  });

  describe('pageErrorLine()', () => {
    it('VALID: {pageerror fields} => returns the exact JSON line', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.pageErrorLine({
        at: EpochMsStub({ value: 1_700_000_000_000 }),
        type: 'TypeError',
        text: 'x is not a function',
        stack: 'TypeError: x is not a function\n at app.js:1:1',
      });

      expect(result).toBe(
        '{"at":1700000000000,"kind":"pageerror","type":"TypeError","text":"x is not a function","stack":"TypeError: x is not a function\\n at app.js:1:1"}',
      );
    });
  });

  describe('networkLine()', () => {
    it('VALID: {network fields} => returns the exact JSON line', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.networkLine({
        at: EpochMsStub({ value: 1_700_000_000_000 }),
        method: 'GET',
        url: 'http://x/api/quests',
        resourceType: 'fetch',
        status: 200,
        requestBody: null,
        responseBody: linesBuild.truncatedBody({ text: '{"quests":[]}' }),
      });

      expect(result).toBe(
        '{"at":1700000000000,"method":"GET","url":"http://x/api/quests","resourceType":"fetch","status":200,"requestBody":null,"responseBody":"{\\"quests\\":[]}"}',
      );
    });
  });

  describe('requestFailedLine()', () => {
    it('VALID: {requestfailed fields} => returns the exact JSON line naming the failure', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.requestFailedLine({
        at: EpochMsStub({ value: 1_700_000_000_000 }),
        method: 'GET',
        url: 'http://x/api/quests',
        resourceType: 'fetch',
        requestBody: null,
        errorText: 'net::ERR_CONNECTION_REFUSED',
      });

      expect(result).toBe(
        '{"at":1700000000000,"method":"GET","url":"http://x/api/quests","resourceType":"fetch","status":null,"requestBody":null,"responseBody":"<request failed: net::ERR_CONNECTION_REFUSED>"}',
      );
    });
  });

  describe('websocketFrameLine()', () => {
    it('VALID: {sent frame} => returns the exact JSON line', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.websocketFrameLine({
        at: EpochMsStub({ value: 1_700_000_000_000 }),
        url: 'ws://x/socket',
        direction: 'sent',
        payload: linesBuild.truncatePayload({ text: '{"type":"ping"}' }),
      });

      expect(result).toBe(
        '{"at":1700000000000,"url":"ws://x/socket","direction":"sent","payload":"{\\"type\\":\\"ping\\"}"}',
      );
    });
  });

  describe('websocketCloseLine()', () => {
    it('VALID: {url} => returns the exact JSON close line', () => {
      listenersLayerAdapterProxy();
      const linesBuild = listenersLayerAdapter();

      const result = linesBuild.websocketCloseLine({
        at: EpochMsStub({ value: 1_700_000_000_000 }),
        url: 'ws://x/socket',
      });

      expect(result).toBe(
        '{"at":1700000000000,"url":"ws://x/socket","direction":"closed","payload":""}',
      );
    });
  });
});
