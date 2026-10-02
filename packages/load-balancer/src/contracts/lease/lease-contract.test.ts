import { leaseContract } from './lease-contract';
import { LeaseStub } from './lease.stub';

describe('leaseContract', () => {
  describe('valid leases', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const lease = LeaseStub();

      const result = leaseContract.parse(lease);

      expect(result).toStrictEqual({
        leaseId: 'lease-test-1',
        tool: 'ward',
        label: '@dungeonmaster/web',
        ownerPid: 12345,
        state: 'starting',
        expectedPeakMB: 512,
        currentRssMB: null,
        startedAtMs: 1_700_000_000_000,
        lastBeatMs: 1_700_000_000_000,
      });
    });

    it('VALID: {tool: siegelense, state: running, numeric currentRssMB} => parses successfully', () => {
      const lease = LeaseStub({
        tool: 'siegelense',
        state: 'running',
        currentRssMB: 256,
      });

      const result = leaseContract.parse(lease);

      expect(result).toStrictEqual({
        leaseId: 'lease-test-1',
        tool: 'siegelense',
        label: '@dungeonmaster/web',
        ownerPid: 12345,
        state: 'running',
        expectedPeakMB: 512,
        currentRssMB: 256,
        startedAtMs: 1_700_000_000_000,
        lastBeatMs: 1_700_000_000_000,
      });
    });

    it('VALID: {expectedPeakMB: null, currentRssMB: 0} => parses successfully', () => {
      const lease = LeaseStub({
        expectedPeakMB: null,
        currentRssMB: 0,
      });

      const result = leaseContract.parse(lease);

      expect(result).toStrictEqual({
        leaseId: 'lease-test-1',
        tool: 'ward',
        label: '@dungeonmaster/web',
        ownerPid: 12345,
        state: 'starting',
        expectedPeakMB: null,
        currentRssMB: 0,
        startedAtMs: 1_700_000_000_000,
        lastBeatMs: 1_700_000_000_000,
      });
    });
  });

  describe('invalid leases', () => {
    it('INVALID: {} => throws validation error on missing required fields', () => {
      expect(() => {
        leaseContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {leaseId: ""} => throws on empty leaseId', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          leaseId: '' as never,
        });
      }).toThrow(/>=1 characters/u);
    });

    it('INVALID: {tool: "docker"} => throws on unrecognized tool', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          tool: 'docker' as never,
        });
      }).toThrow(/Invalid option/u);
    });

    it('INVALID: {state: "stopped"} => throws on unrecognized state', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          state: 'stopped' as never,
        });
      }).toThrow(/Invalid option/u);
    });

    it('INVALID: {ownerPid: 0} => throws on non-positive pid', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          ownerPid: 0 as never,
        });
      }).toThrow(/>0/u);
    });

    it('INVALID: {ownerPid: -1} => throws on negative pid', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          ownerPid: -1 as never,
        });
      }).toThrow(/>0/u);
    });

    it('INVALID: {ownerPid: 12.5} => throws on non-integer pid', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          ownerPid: 12.5 as never,
        });
      }).toThrow(/int/u);
    });

    it('INVALID: {expectedPeakMB: 0} => throws on non-positive expectedPeakMB', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          expectedPeakMB: 0 as never,
        });
      }).toThrow(/>0/u);
    });

    it('INVALID: {expectedPeakMB: -5} => throws on negative expectedPeakMB', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          expectedPeakMB: -5 as never,
        });
      }).toThrow(/>0/u);
    });

    it('INVALID: {currentRssMB: -1} => throws on negative currentRssMB', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          currentRssMB: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {startedAtMs: -1} => throws on negative startedAtMs', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          startedAtMs: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {lastBeatMs: -1} => throws on negative lastBeatMs', () => {
      const lease = LeaseStub();

      expect(() => {
        leaseContract.parse({
          ...lease,
          lastBeatMs: -1 as never,
        });
      }).toThrow(/>=0/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid default lease', () => {
      const result = LeaseStub();

      expect(result).toStrictEqual({
        leaseId: 'lease-test-1',
        tool: 'ward',
        label: '@dungeonmaster/web',
        ownerPid: 12345,
        state: 'starting',
        expectedPeakMB: 512,
        currentRssMB: null,
        startedAtMs: 1_700_000_000_000,
        lastBeatMs: 1_700_000_000_000,
      });
    });

    it('VALID: {custom overrides} => creates lease with overridden fields', () => {
      const result = LeaseStub({
        leaseId: 'custom-lease-99',
        ownerPid: 99999,
      });

      expect(result).toStrictEqual({
        leaseId: 'custom-lease-99',
        tool: 'ward',
        label: '@dungeonmaster/web',
        ownerPid: 99999,
        state: 'starting',
        expectedPeakMB: 512,
        currentRssMB: null,
        startedAtMs: 1_700_000_000_000,
        lastBeatMs: 1_700_000_000_000,
      });
    });
  });
});
