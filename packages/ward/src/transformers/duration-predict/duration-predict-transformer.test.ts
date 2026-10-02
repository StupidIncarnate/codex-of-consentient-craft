import { DurationSampleStub } from '../../contracts/duration-sample/duration-sample.stub';
import { durationPredictTransformer } from './duration-predict-transformer';

describe('durationPredictTransformer', () => {
  describe('duration median calculations', () => {
    it('VALID: {1 sample} => median is the single duration', () => {
      const samples = [
        DurationSampleStub({
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 1500,
        }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('unit');

      expect(wardPrediction?.durationMs).toBe(1500);
      expect(wardPrediction?.peakRssMB).toBe(null);
    });

    it('VALID: {2 samples} => median is mean of both durations', () => {
      const samples = [
        DurationSampleStub({
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 1000,
        }),
        DurationSampleStub({
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 2000,
        }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('unit');

      expect(wardPrediction?.durationMs).toBe(1500);
    });

    it('VALID: {5 samples} => median is middle value when sorted', () => {
      const samples = [
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 500 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 100 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 300 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 200 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 400 }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('unit');

      expect(wardPrediction?.durationMs).toBe(300);
    });

    it('VALID: {5 samples with 1 outlier} => outlier does not move median', () => {
      const samples = [
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 100 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 200 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 300 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 400 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 50000 }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('unit');

      expect(wardPrediction?.durationMs).toBe(300);
    });
  });

  describe('peak RSS median calculations', () => {
    it('VALID: {all peakRssMB null} => returns null for peakRssMB', () => {
      const samples = [
        DurationSampleStub({
          packageName: 'ward',
          checkType: 'lint',
          peakRssMB: null,
        }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('lint');

      expect(wardPrediction?.peakRssMB).toBe(null);
    });

    it('VALID: {mix of null and non-null peakRssMB} => median computed only from non-null values', () => {
      const samples = [
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 100 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: null }),
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 200 }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('lint');

      expect(wardPrediction?.peakRssMB).toBe(150);
    });

    it('VALID: {5 peakRssMB values} => returns median peakRssMB', () => {
      const samples = [
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 50 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 10 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 30 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 20 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', peakRssMB: 40 }),
      ];

      const result = durationPredictTransformer({ samples });
      const wardPrediction = result.get('ward')?.get('lint');

      expect(wardPrediction?.peakRssMB).toBe(30);
    });
  });

  describe('grouping and edge cases', () => {
    it('EMPTY: {empty samples} => returns empty map', () => {
      const result = durationPredictTransformer({ samples: [] });

      expect(result.size).toBe(0);
    });

    it('VALID: {multiple packages and check types} => partitions predictions separately', () => {
      const samples = [
        DurationSampleStub({ packageName: 'ward', checkType: 'lint', durationMs: 100 }),
        DurationSampleStub({ packageName: 'ward', checkType: 'unit', durationMs: 500 }),
        DurationSampleStub({ packageName: 'shared', checkType: 'lint', durationMs: 200 }),
      ];

      const result = durationPredictTransformer({ samples });

      expect(result.get('ward')?.get('lint')?.durationMs).toBe(100);
      expect(result.get('ward')?.get('unit')?.durationMs).toBe(500);
      expect(result.get('shared')?.get('lint')?.durationMs).toBe(200);
      expect(result.get('shared')?.get('unit')).toBe(undefined);
    });
  });
});
