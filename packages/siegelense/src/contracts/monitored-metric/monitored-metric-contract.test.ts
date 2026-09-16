import { machineStatics } from '../../statics/machine/machine-statics';
import { monitoredMetricContract } from './monitored-metric-contract';
import { MonitoredMetricStub } from './monitored-metric.stub';

describe('monitoredMetricContract', () => {
  describe('valid members', () => {
    it.each(machineStatics.monitored)('VALID: {value: %s} => parses to itself', (value) => {
      const metric = MonitoredMetricStub({ value });

      const result = monitoredMetricContract.parse(metric);

      expect(result).toBe(value);
    });
  });

  describe('derivation', () => {
    it('VALID: {machineStatics.monitored} => the contract accepts exactly those five names, in order', () => {
      expect(monitoredMetricContract.unwrap().options).toStrictEqual(machineStatics.monitored);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "cpu usage"} => an unlisted metric name throws validation error', () => {
      expect(() => {
        MonitoredMetricStub({ value: 'cpu usage' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
