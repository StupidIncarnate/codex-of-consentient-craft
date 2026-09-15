import { instanceHeartbeatContract } from './instance-heartbeat-contract';
import { InstanceHeartbeatStub } from './instance-heartbeat.stub';

describe('instanceHeartbeatContract', () => {
  describe('valid heartbeats', () => {
    it('VALID: {pgids: [4821]} => parses a heartbeat with one live child', () => {
      const heartbeat = InstanceHeartbeatStub({
        instanceId: 'inst_7f3a9c21',
        pid: 'proc-12345',
        pgids: [4821],
        beatAtMs: 1_700_000_000_000,
      });

      const result = instanceHeartbeatContract.parse(heartbeat);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        pid: 'proc-12345',
        pgids: [4821],
        beatAtMs: 1_700_000_000_000,
      });
    });

    it('VALID: {pgids: [4821, 4830]} => parses a heartbeat with more than one live child', () => {
      const heartbeat = InstanceHeartbeatStub({
        instanceId: 'inst_7f3a9c21',
        pid: 'proc-12345',
        pgids: [4821, 4830],
        beatAtMs: 1_700_000_000_000,
      });

      const result = instanceHeartbeatContract.parse(heartbeat);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        pid: 'proc-12345',
        pgids: [4821, 4830],
        beatAtMs: 1_700_000_000_000,
      });
    });
  });

  describe('edge heartbeats', () => {
    it('EDGE: {pgids: []} => parses a heartbeat written before any child has spawned', () => {
      const heartbeat = InstanceHeartbeatStub({
        instanceId: 'inst_7f3a9c21',
        pid: 'proc-12345',
        pgids: [],
        beatAtMs: 1_700_000_000_000,
      });

      const result = instanceHeartbeatContract.parse(heartbeat);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        pid: 'proc-12345',
        pgids: [],
        beatAtMs: 1_700_000_000_000,
      });
    });
  });

  describe('invalid heartbeats', () => {
    it('INVALID: {missing instanceId} => throws Required', () => {
      expect(() =>
        instanceHeartbeatContract.parse({
          pid: 'proc-12345',
          pgids: [4821],
          beatAtMs: 1_700_000_000_000,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {pgids: [-1]} => throws for a non-positive process-group id', () => {
      expect(() =>
        instanceHeartbeatContract.parse({
          instanceId: 'inst_7f3a9c21',
          pid: 'proc-12345',
          pgids: [-1 as never],
          beatAtMs: 1_700_000_000_000,
        }),
      ).toThrow(/too_small/u);
    });
  });
});
