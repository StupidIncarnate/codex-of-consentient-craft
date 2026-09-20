import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { isNetworkLineNon2xxGuard } from './is-network-line-non2xx-guard';

describe('isNetworkLineNon2xxGuard', () => {
  describe('a successful exchange', () => {
    it('VALID: {status: 200} => returns false', () => {
      const line = ContentTextStub({ value: '{"status":200}' });

      const result = isNetworkLineNon2xxGuard({ line });

      expect(result).toBe(false);
    });

    it('EDGE: {status: 299} => returns false, the floor of non2xx is exclusive below 300', () => {
      const line = ContentTextStub({ value: '{"status":299}' });

      const result = isNetworkLineNon2xxGuard({ line });

      expect(result).toBe(false);
    });
  });

  describe('a non-2xx exchange', () => {
    it('VALID: {status: 500} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":500}' });

      const result = isNetworkLineNon2xxGuard({ line });

      expect(result).toBe(true);
    });

    it('VALID: {status: 404} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":404}' });

      const result = isNetworkLineNon2xxGuard({ line });

      expect(result).toBe(true);
    });

    it('EDGE: {status: 300} => returns true, the ceiling of 2xx is exclusive', () => {
      const line = ContentTextStub({ value: '{"status":300}' });

      const result = isNetworkLineNon2xxGuard({ line });

      expect(result).toBe(true);
    });

    it('VALID: {status: null, a request that never got a response} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":null}' });

      const result = isNetworkLineNon2xxGuard({ line });

      expect(result).toBe(true);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {line: undefined} => returns false', () => {
      const result = isNetworkLineNon2xxGuard({});

      expect(result).toBe(false);
    });
  });
});
