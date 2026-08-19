import { healthSnapshotContract } from './health-snapshot-contract';
import { HealthSnapshotStub } from './health-snapshot.stub';

describe('healthSnapshotContract', () => {
  describe('valid snapshots', () => {
    it('VALID: full stub => parses to the exact 7-key object', () => {
      const result = healthSnapshotContract.parse(HealthSnapshotStub());

      expect(result).toStrictEqual({
        status: 'ok',
        timestamp: '2026-05-05T13:00:00.000Z',
        uptimeSeconds: 745,
        version: '0.1.0',
        port: 3737,
        home: '/home/user/.dungeonmaster',
        orchestrationMode: 'claude',
      });
    });

    it('EDGE: {uptimeSeconds: 0} => parses successfully', () => {
      const result = healthSnapshotContract.parse(HealthSnapshotStub({ uptimeSeconds: 0 }));

      expect(result).toStrictEqual({
        status: 'ok',
        timestamp: '2026-05-05T13:00:00.000Z',
        uptimeSeconds: 0,
        version: '0.1.0',
        port: 3737,
        home: '/home/user/.dungeonmaster',
        orchestrationMode: 'claude',
      });
    });

    it('EDGE: {extra unknown key} => strips the key and parses to the 7-key object', () => {
      const result = healthSnapshotContract.parse({
        ...HealthSnapshotStub(),
        unexpectedField: 'surprise',
      });

      expect(result).toStrictEqual({
        status: 'ok',
        timestamp: '2026-05-05T13:00:00.000Z',
        uptimeSeconds: 745,
        version: '0.1.0',
        port: 3737,
        home: '/home/user/.dungeonmaster',
        orchestrationMode: 'claude',
      });
    });
  });

  describe('invalid snapshots', () => {
    it('INVALID: {status: "degraded"} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), status: 'degraded' });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {uptimeSeconds: -1} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), uptimeSeconds: -1 });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {uptimeSeconds: 3.5} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), uptimeSeconds: 3.5 });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID: {timestamp: "not-a-timestamp"} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), timestamp: 'not-a-timestamp' });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {version: ""} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), version: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {port: 0} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), port: 0 });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {home: "relative/path"} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), home: 'relative/path' });
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {orchestrationMode: "hybrid"} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({ ...HealthSnapshotStub(), orchestrationMode: 'hybrid' });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {body omitting uptimeSeconds} => throws validation error', () => {
      expect(() => {
        const { uptimeSeconds: _uptimeSeconds, ...rest } = HealthSnapshotStub();
        healthSnapshotContract.parse(rest);
      }).toThrow(/Required/u);
    });

    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        healthSnapshotContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
