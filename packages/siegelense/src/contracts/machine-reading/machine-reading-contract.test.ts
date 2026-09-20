import { machineReadingContract } from './machine-reading-contract';
import { MachineReadingStub } from './machine-reading.stub';

describe('machineReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {the spec line 1171 block} => parses the complete populated reading', () => {
      const reading = MachineReadingStub({
        freeMemMB: 980,
        totalMemMB: 16_000,
        freeDiskMB: 2100,
        cores: 8,
        loadAvg: [7.9, 6.2, 4.1],
        oomKillsSinceBoot: 2,
        lastOomAt: '20:11:04',
      });

      const result = machineReadingContract.parse(reading);

      expect(result).toStrictEqual({
        freeMemMB: 980,
        totalMemMB: 16_000,
        freeDiskMB: 2100,
        cores: 8,
        loadAvg: [7.9, 6.2, 4.1],
        oomKillsSinceBoot: 2,
        lastOomAt: '20:11:04',
      });
    });

    it('VALID: {freeDiskMB: null, oomKillsSinceBoot: null, lastOomAt: null} => the unavailable case is a real reading', () => {
      const reading = MachineReadingStub({
        freeMemMB: 980,
        totalMemMB: 16_000,
        freeDiskMB: null,
        cores: 8,
        loadAvg: [7.9, 6.2, 4.1],
        oomKillsSinceBoot: null,
        lastOomAt: null,
      });

      const result = machineReadingContract.parse(reading);

      expect(result).toStrictEqual({
        freeMemMB: 980,
        totalMemMB: 16_000,
        freeDiskMB: null,
        cores: 8,
        loadAvg: [7.9, 6.2, 4.1],
        oomKillsSinceBoot: null,
        lastOomAt: null,
      });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing freeMemMB} => throws Required', () => {
      expect(() =>
        machineReadingContract.parse({
          totalMemMB: 16_000,
          freeDiskMB: null,
          cores: 8,
          loadAvg: [7.9, 6.2, 4.1],
          oomKillsSinceBoot: null,
          lastOomAt: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing freeDiskMB} => throws Required, because .nullable() is not .optional()', () => {
      expect(() =>
        machineReadingContract.parse({
          freeMemMB: 980,
          totalMemMB: 16_000,
          cores: 8,
          loadAvg: [7.9, 6.2, 4.1],
          oomKillsSinceBoot: null,
          lastOomAt: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {freeMemMB: -1} => throws for a negative megabyte reading', () => {
      expect(() =>
        machineReadingContract.parse({
          freeMemMB: -1,
          totalMemMB: 16_000,
          freeDiskMB: null,
          cores: 8,
          loadAvg: [7.9, 6.2, 4.1],
          oomKillsSinceBoot: null,
          lastOomAt: null,
        }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
