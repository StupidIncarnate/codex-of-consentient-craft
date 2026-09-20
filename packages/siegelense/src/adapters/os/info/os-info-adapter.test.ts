import { osInfoAdapter } from './os-info-adapter';
import { osInfoAdapterProxy } from './os-info-adapter.proxy';
import { LoadAverageStub } from '../../../contracts/load-average/load-average.stub';
import { MegabytesStub } from '../../../contracts/megabytes/megabytes.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';

describe('osInfoAdapter', () => {
  describe('a healthy machine', () => {
    it('VALID: {freemem, totalmem, cpus, loadavg staged} => returns the complete converted reading', () => {
      const proxy = osInfoAdapterProxy();
      proxy.stages({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
      });

      const result = osInfoAdapter();

      expect(result).toStrictEqual({
        freeMemMB: MegabytesStub({ value: 980 }),
        totalMemMB: MegabytesStub({ value: 16_000 }),
        cores: ReadingCountStub({ value: 8 }),
        loadAvg: LoadAverageStub({ value: [7.9, 6.2, 4.1] }),
      });
    });
  });

  describe('a second, differently loaded machine', () => {
    it("VALID: {smaller memory, four cores, low load} => returns that machine's own converted reading", () => {
      const proxy = osInfoAdapterProxy();
      proxy.stages({
        freeMemBytes: 512 * 1_048_576,
        totalMemBytes: 8192 * 1_048_576,
        coreCount: 4,
        loadAvg: [0.5, 0.3, 0.1],
      });

      const result = osInfoAdapter();

      expect(result).toStrictEqual({
        freeMemMB: MegabytesStub({ value: 512 }),
        totalMemMB: MegabytesStub({ value: 8192 }),
        cores: ReadingCountStub({ value: 4 }),
        loadAvg: LoadAverageStub({ value: [0.5, 0.3, 0.1] }),
      });
    });
  });

  describe('a byte count that does not divide evenly', () => {
    it('EDGE: {freeMemBytes: 1_048_576 + 512} => floors to whole megabytes rather than rounding up', () => {
      const proxy = osInfoAdapterProxy();
      proxy.stages({
        freeMemBytes: 1_048_576 + 512,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
      });

      const result = osInfoAdapter();

      expect(result.freeMemMB).toBe(MegabytesStub({ value: 1 }));
    });
  });
});
