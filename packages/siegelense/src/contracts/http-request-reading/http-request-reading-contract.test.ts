import { httpRequestReadingContract } from './http-request-reading-contract';
import { HttpRequestReadingStub } from './http-request-reading.stub';

describe('httpRequestReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {default stub} => parses default 200 OK reading', () => {
      const fixture = HttpRequestReadingStub();

      const result = httpRequestReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });

    it('VALID: {custom status, headers, and object body} => parses full response', () => {
      const fixture = HttpRequestReadingStub({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        body: { id: 'guild-123' },
      });

      const result = httpRequestReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });

    it('VALID: {string body and 404 status} => parses error response reading', () => {
      const fixture = HttpRequestReadingStub({
        status: 404,
        statusText: 'Not Found',
        headers: { 'content-type': 'text/plain' },
        body: 'Not found',
      });

      const result = httpRequestReadingContract.parse(fixture);

      expect(result).toStrictEqual(fixture);
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing status} => throws validation error', () => {
      expect(() => {
        httpRequestReadingContract.parse({
          statusText: 'OK',
          headers: {},
          body: null,
        } as never);
      }).toThrow(/Required/u);
    });

    it('INVALID: {non-integer status} => throws validation error', () => {
      expect(() => {
        httpRequestReadingContract.parse({
          status: 200.5,
          statusText: 'OK',
          headers: {},
          body: null,
        } as never);
      }).toThrow(/Expected integer/u);
    });

    it('INVALID: {extra unknown field} => throws strict validation error', () => {
      expect(() => {
        httpRequestReadingContract.parse({
          status: 200,
          statusText: 'OK',
          headers: {},
          body: null,
          extra: true,
        } as never);
      }).toThrow(/Unrecognized key/u);
    });
  });
});
