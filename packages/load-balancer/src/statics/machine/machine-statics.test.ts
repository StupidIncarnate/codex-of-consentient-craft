import { machineStatics } from './machine-statics';

describe('machineStatics', () => {
  it('VALID: {monitored} => is exactly the five metric names', () => {
    expect(machineStatics.monitored).toStrictEqual([
      'memory per process group',
      'free memory',
      'free disk',
      'load average',
      'kernel OOM events',
    ]);
  });
});
