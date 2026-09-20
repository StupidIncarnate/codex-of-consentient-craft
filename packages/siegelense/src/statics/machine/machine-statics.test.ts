import { machineStatics } from './machine-statics';

describe('machineStatics', () => {
  it('VALID: {monitored} => is exactly the five metric names, per siegelense-tooling.md line 1170', () => {
    expect(machineStatics.monitored).toStrictEqual([
      'rss per process group',
      'free memory',
      'free disk',
      'load average',
      'kernel OOM events',
    ]);
  });
});
