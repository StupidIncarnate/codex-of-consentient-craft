import { machineResourcesStatics } from './machine-resources-statics';

describe('machineResourcesStatics', () => {
  describe('resource limits', () => {
    it('VALID: {machineResourcesStatics} => exposes memory and disk limits and defaults', () => {
      expect(machineResourcesStatics).toStrictEqual({
        maxMemoryPercent: { min: 10, max: 100, default: 80 },
        maxCpuPercent: { min: 10, max: 95, default: 75 },
        maxDiskMB: { min: 1024, default: 16384 },
      });
    });
  });
});
