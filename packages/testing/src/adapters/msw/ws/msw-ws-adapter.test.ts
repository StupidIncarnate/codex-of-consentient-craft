import { ws } from 'msw';
import { mswWsAdapter } from './msw-ws-adapter';
import { mswWsAdapterProxy } from './msw-ws-adapter.proxy';

describe('mswWsAdapter', () => {
  describe('exports', () => {
    it('VALID: {} => returns ws from msw', () => {
      mswWsAdapterProxy();

      const result = mswWsAdapter();

      expect(result).toStrictEqual({ ws });
    });
  });
});
