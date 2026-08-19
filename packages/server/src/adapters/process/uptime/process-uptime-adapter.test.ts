import { processUptimeAdapter } from './process-uptime-adapter';
import { processUptimeAdapterProxy } from './process-uptime-adapter.proxy';

describe('processUptimeAdapter', () => {
  it('VALID: {process.uptime(): 745.9} => returns 745', () => {
    const proxy = processUptimeAdapterProxy();
    proxy.returnsSeconds({ seconds: 745.9 });

    const result = processUptimeAdapter();

    expect(result).toBe(745);
  });

  it('EDGE: {process.uptime(): 0.4} => returns 0', () => {
    const proxy = processUptimeAdapterProxy();
    proxy.returnsSeconds({ seconds: 0.4 });

    const result = processUptimeAdapter();

    expect(result).toBe(0);
  });

  it('EDGE: {process.uptime(): 60} => returns 60', () => {
    const proxy = processUptimeAdapterProxy();
    proxy.returnsSeconds({ seconds: 60 });

    const result = processUptimeAdapter();

    expect(result).toBe(60);
  });

  it('EDGE: {process.uptime(): 3600.999} => returns 3600', () => {
    const proxy = processUptimeAdapterProxy();
    proxy.returnsSeconds({ seconds: 3600.999 });

    const result = processUptimeAdapter();

    expect(result).toBe(3600);
  });
});
