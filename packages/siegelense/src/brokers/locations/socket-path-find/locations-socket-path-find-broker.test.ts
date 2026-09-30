import { locationsSocketPathFindBroker } from './locations-socket-path-find-broker';
import { locationsSocketPathFindBrokerProxy } from './locations-socket-path-find-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { Buffer } from '#gateway/node/buffer';

describe('locationsSocketPathFindBroker', () => {
  describe('socket path resolution', () => {
    it('VALID: {tmpDir: "/tmp", instanceId: inst_7f3a9c21} => returns /tmp/dm-siege-sockets/inst_7f3a9c21.sock', () => {
      const proxy = locationsSocketPathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });

      proxy.setupSocketPath({
        tmpDir: '/tmp',
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });

      const result = locationsSocketPathFindBroker({ instanceId });

      expect(result).toBe(
        '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      );
    });

    it('VALID: {tmpDir: a per-user macOS scratch dir} => returns that base joined with the socket dir and instance id', () => {
      const proxy = locationsSocketPathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });

      proxy.setupSocketPath({
        tmpDir: '/var/folders/zz/zyxvpxvq6csfxvn_n0000gn/T',
        socketPath: '/var/folders/zz/zyxvpxvq6csfxvn_n0000gn/T/dm-siege-sockets/inst_7f3a9c21.sock',
      });

      const result = locationsSocketPathFindBroker({ instanceId });

      expect(result).toBe(
        '/var/folders/zz/zyxvpxvq6csfxvn_n0000gn/T/dm-siege-sockets/inst_7f3a9c21.sock',
      );
    });
  });

  describe('the AF_UNIX 108-byte sun_path ceiling', () => {
    it('EDGE: {tmpDir: a realistic macOS scratch dir, instanceId: 32 hex chars} => stays under 108 bytes', () => {
      const proxy = locationsSocketPathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: `inst_${'a'.repeat(32)}` });
      const socketPathValue =
        '/var/folders/zz/zyxvpxvq6csfxvn_n0000gn/T/dm-siege-sockets/' +
        `inst_${'a'.repeat(32)}.sock`;

      proxy.setupSocketPath({
        tmpDir: '/var/folders/zz/zyxvpxvq6csfxvn_n0000gn/T',
        socketPath: socketPathValue,
      });

      const result = locationsSocketPathFindBroker({ instanceId });

      // 108 is Linux's sizeof(sockaddr_un.sun_path) — a path at or past it fails connect()/bind()
      // with a raw ENAMETOOLONG this whole resolver exists to avoid.
      expect(Buffer.byteLength(result, 'utf8')).toBeLessThan(108);
    });
  });
});
