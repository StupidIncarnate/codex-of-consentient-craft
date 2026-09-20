import { DriverUnreachableError } from './driver-unreachable-error';

describe('DriverUnreachableError', () => {
  describe('constructor()', () => {
    it('VALID: {instanceId, socketPath, cause} => names the instance, the socket, and the underlying failure', () => {
      const error = new DriverUnreachableError({
        instanceId: 'inst_7f3a9c21',
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
        cause: new Error('connect ECONNREFUSED'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'DriverUnreachableError',
        message:
          'Driver for instance inst_7f3a9c21 is unreachable at socket /tmp/dm-siege-sockets/inst_7f3a9c21.sock: Error: connect ECONNREFUSED',
      });
    });

    it('EDGE: {cause: undefined} => renders the cause as the literal string "undefined"', () => {
      const error = new DriverUnreachableError({
        instanceId: 'inst_7f3a9c21',
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
        cause: undefined,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'DriverUnreachableError',
        message:
          'Driver for instance inst_7f3a9c21 is unreachable at socket /tmp/dm-siege-sockets/inst_7f3a9c21.sock: undefined',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof DriverUnreachableError => returns true', () => {
      const error = new DriverUnreachableError({
        instanceId: 'inst_7f3a9c21',
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
        cause: new Error('connect ECONNREFUSED'),
      });

      expect(error instanceof DriverUnreachableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new DriverUnreachableError({
        instanceId: 'inst_7f3a9c21',
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
        cause: new Error('connect ECONNREFUSED'),
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
