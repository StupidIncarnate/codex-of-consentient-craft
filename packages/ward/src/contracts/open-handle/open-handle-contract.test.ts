import { openHandleContract } from './open-handle-contract';
import { OpenHandleStub } from './open-handle.stub';

describe('openHandleContract', () => {
  describe('valid inputs', () => {
    it('VALID: {name, message, stack} => parses and round-trips', () => {
      const stub = OpenHandleStub();

      const result = openHandleContract.parse(stub);

      expect(result).toStrictEqual({
        name: 'Error',
        message: 'TCPSERVERWRAP',
        stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
      });
      expect(openHandleContract.parse(result)).toStrictEqual(result);
    });

    it('VALID: {stack omitted} => defaults to empty string', () => {
      const result = openHandleContract.parse({
        name: 'Error',
        message: 'Timeout',
      });

      expect(result).toStrictEqual({
        name: 'Error',
        message: 'Timeout',
        stack: '',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing name} => throws validation error', () => {
      expect(() =>
        openHandleContract.parse({
          message: 'TCPSERVERWRAP',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing message} => throws validation error', () => {
      expect(() =>
        openHandleContract.parse({
          name: 'Error',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing name and message} => throws validation error', () => {
      expect(() => openHandleContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid open handle', () => {
      const result = OpenHandleStub();

      expect(result).toStrictEqual({
        name: 'Error',
        message: 'TCPSERVERWRAP',
        stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
      });
    });

    it('VALID: {message override} => creates open handle with override', () => {
      const result = OpenHandleStub({ message: 'Timeout' });

      expect(result).toStrictEqual({
        name: 'Error',
        message: 'Timeout',
        stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
      });
    });
  });
});
