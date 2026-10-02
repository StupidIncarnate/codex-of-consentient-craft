import { memoryPeakSampleBroker } from './memory-peak-sample-broker';
import { memoryPeakSampleBrokerProxy } from './memory-peak-sample-broker.proxy';

describe('memoryPeakSampleBroker', () => {
  it('VALID: {multiple samples over time} => tracks and returns the highest peak observed', async () => {
    jest.useFakeTimers();
    const proxy = memoryPeakSampleBrokerProxy();
    proxy.setupSamples({ rootPid: 100, samples: [10, 25, 18] });

    const sampler = await memoryPeakSampleBroker({ rootPid: 100, intervalMs: 50 });

    // First sample (10) was taken immediately
    expect(sampler.getCurrentPeak()).toBe(10);

    // Second sample (25)
    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(25);

    // Third sample (18)
    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(25);

    const peak = await sampler.stop();
    jest.useRealTimers();

    expect(peak).toBe(25);
  });

  it('VALID: {stop is called} => stops future sampling timeouts', async () => {
    jest.useFakeTimers();
    const proxy = memoryPeakSampleBrokerProxy();
    proxy.setupSamples({ rootPid: 100, samples: [10, 20] });

    const sampler = await memoryPeakSampleBroker({ rootPid: 100, intervalMs: 50 });
    await jest.advanceTimersByTimeAsync(50);
    const peak = await sampler.stop();

    expect(peak).toBe(20);

    const callCountBefore = proxy.getCalls({ rootPid: 100 }).length;
    await jest.advanceTimersByTimeAsync(200);
    const callCountAfter = proxy.getCalls({ rootPid: 100 }).length;
    jest.useRealTimers();

    expect(callCountAfter).toBe(callCountBefore);
  });

  it('VALID: {getCurrentPeak is called during sampling} => returns current peak observed so far', async () => {
    jest.useFakeTimers();
    const proxy = memoryPeakSampleBrokerProxy();
    proxy.setupSamples({ rootPid: 100, samples: [12, 30] });

    const sampler = await memoryPeakSampleBroker({ rootPid: 100, intervalMs: 50 });

    expect(sampler.getCurrentPeak()).toBe(12);

    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(30);

    await sampler.stop();
    jest.useRealTimers();

    expect(sampler.getCurrentPeak()).toBe(30);
  });

  it('EMPTY: {no non-null samples recorded} => returns null', async () => {
    jest.useFakeTimers();
    const proxy = memoryPeakSampleBrokerProxy();
    proxy.setupSamples({ rootPid: 100, samples: [null] });

    const sampler = await memoryPeakSampleBroker({ rootPid: 100, intervalMs: 50 });
    await jest.advanceTimersByTimeAsync(50);
    const peak = await sampler.stop();
    jest.useRealTimers();

    expect(peak).toBe(null);
  });

  it('EDGE: {sampling encounters null samples} => skips null samples and retains highest numeric peak', async () => {
    jest.useFakeTimers();
    const proxy = memoryPeakSampleBrokerProxy();
    proxy.setupSamples({ rootPid: 100, samples: [null, 15, null, 8] });

    const sampler = await memoryPeakSampleBroker({ rootPid: 100, intervalMs: 50 });

    // First sample was null
    expect(sampler.getCurrentPeak()).toBe(null);

    // Second sample is 15
    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(15);

    // Third sample is null — peak stays 15
    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(15);

    // Fourth sample is 8 — peak stays 15
    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(15);

    const peak = await sampler.stop();
    jest.useRealTimers();

    expect(peak).toBe(15);
  });

  it('ERROR: {machineRssByTreeBroker throws error} => skips error without crashing', async () => {
    jest.useFakeTimers();
    const proxy = memoryPeakSampleBrokerProxy();
    proxy.setupFails({ rootPid: 100 });

    const sampler = await memoryPeakSampleBroker({ rootPid: 100, intervalMs: 50 });

    expect(sampler.getCurrentPeak()).toBe(null);

    await jest.advanceTimersByTimeAsync(50);

    expect(sampler.getCurrentPeak()).toBe(null);

    const peak = await sampler.stop();
    jest.useRealTimers();

    expect(peak).toBe(null);
  });
});
