import { isHttpStatusSuccessGuard } from './is-http-status-success-guard';
import { DmHttpResponseStub } from '../../contracts/dm-http-response/dm-http-response.stub';

describe('isHttpStatusSuccessGuard', () => {
  describe('a status in the success range', () => {
    it('VALID: {status: 200} => returns true', () => {
      const { status } = DmHttpResponseStub({ status: 200 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(true);
    });

    it('VALID: {status: 201} => returns true', () => {
      const { status } = DmHttpResponseStub({ status: 201 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(true);
    });

    it('EDGE: {status: 299} => returns true', () => {
      const { status } = DmHttpResponseStub({ status: 299 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(true);
    });
  });

  describe('a status outside the success range', () => {
    it('EDGE: {status: 300} => returns false', () => {
      const { status } = DmHttpResponseStub({ status: 300 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(false);
    });

    it('EDGE: {status: 199} => returns false', () => {
      const { status } = DmHttpResponseStub({ status: 199 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(false);
    });

    it('INVALID: {status: 404} => returns false', () => {
      const { status } = DmHttpResponseStub({ status: 404 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(false);
    });

    it('INVALID: {status: 500} => returns false', () => {
      const { status } = DmHttpResponseStub({ status: 500 });

      expect(isHttpStatusSuccessGuard({ status })).toBe(false);
    });
  });

  describe('no status at all', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      expect(isHttpStatusSuccessGuard({})).toBe(false);
    });
  });
});
