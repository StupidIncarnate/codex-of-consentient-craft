import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { isNetworkLineFailedGuard } from './is-network-line-failed-guard';

describe('isNetworkLineFailedGuard', () => {
  describe('an exchange that did not fail', () => {
    it('VALID: {status: 200} => returns false', () => {
      const line = ContentTextStub({ value: '{"status":200}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(false);
    });

    it('VALID: {status: 304, a cache revalidation} => returns false', () => {
      const line = ContentTextStub({
        value:
          '{"at":1,"method":"GET","url":"http://localhost:5173/assets/index-B46evcyl.css","resourceType":"stylesheet","status":304}',
      });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(false);
    });

    it('VALID: {status: 302, a redirect} => returns false', () => {
      const line = ContentTextStub({ value: '{"status":302}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(false);
    });

    it('EDGE: {status: 399} => returns false, the failure floor is 400', () => {
      const line = ContentTextStub({ value: '{"status":399}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(false);
    });
  });

  describe('a failed exchange', () => {
    it('EDGE: {status: 400} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":400}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(true);
    });

    it('VALID: {status: 404} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":404}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(true);
    });

    it('VALID: {status: 500} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":500}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(true);
    });

    it('VALID: {status: null, a request that never got a response} => returns true', () => {
      const line = ContentTextStub({ value: '{"status":null}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(true);
    });

    it('EDGE: {no status field} => returns true', () => {
      const line = ContentTextStub({ value: '{"method":"GET"}' });

      const result = isNetworkLineFailedGuard({ line });

      expect(result).toBe(true);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {line: undefined} => returns false', () => {
      const result = isNetworkLineFailedGuard({});

      expect(result).toBe(false);
    });
  });
});
