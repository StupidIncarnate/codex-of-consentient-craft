import { durationSampleContract } from './duration-sample-contract';
import { DurationSampleStub } from './duration-sample.stub';

describe('durationSampleContract', () => {
  describe('valid duration samples', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const sample = DurationSampleStub();

      const result = durationSampleContract.parse(sample);

      expect(result).toStrictEqual({
        repoRoot: '/home/user/project',
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1200,
        peakRssMB: null,
        shards: null,
        recordedAtMs: 1700000000000,
      });
    });

    it('VALID: {numeric peakRssMB and shards} => parses successfully', () => {
      const sample = DurationSampleStub({
        peakRssMB: 256.5,
        shards: 3,
      });

      const result = durationSampleContract.parse(sample);

      expect(result).toStrictEqual({
        repoRoot: '/home/user/project',
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1200,
        peakRssMB: 256.5,
        shards: 3,
        recordedAtMs: 1700000000000,
      });
    });

    it('VALID: {custom checkType} => parses successfully', () => {
      const sample = DurationSampleStub({
        checkType: 'e2e',
      });

      const result = durationSampleContract.parse(sample);

      expect(result).toStrictEqual({
        repoRoot: '/home/user/project',
        packageName: 'ward',
        checkType: 'e2e',
        durationMs: 1200,
        peakRssMB: null,
        shards: null,
        recordedAtMs: 1700000000000,
      });
    });
  });

  describe('invalid duration samples', () => {
    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        durationSampleContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {durationMs: -1} => throws validation error', () => {
      const sample = DurationSampleStub();

      expect(() => {
        durationSampleContract.parse({
          ...sample,
          durationMs: -1,
        });
      }).toThrow(/expected number to be >=0/u);
    });

    it('INVALID: {checkType: "invalid"} => throws validation error', () => {
      const sample = DurationSampleStub();

      expect(() => {
        durationSampleContract.parse({
          ...sample,
          checkType: 'invalid',
        });
      }).toThrow(/Invalid option/u);
    });

    it('INVALID: {repoRoot: ""} => throws validation error', () => {
      const sample = DurationSampleStub();

      expect(() => {
        durationSampleContract.parse({
          ...sample,
          repoRoot: '',
        });
      }).toThrow(/expected string to have >=1 characters/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid duration sample', () => {
      const result = DurationSampleStub();

      expect(result).toStrictEqual({
        repoRoot: '/home/user/project',
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 1200,
        peakRssMB: null,
        shards: null,
        recordedAtMs: 1700000000000,
      });
    });

    it('VALID: {custom values} => creates duration sample with overrides', () => {
      const result = DurationSampleStub({
        durationMs: 5000,
        peakRssMB: 512,
        shards: 4,
      });

      expect(result).toStrictEqual({
        repoRoot: '/home/user/project',
        packageName: 'ward',
        checkType: 'unit',
        durationMs: 5000,
        peakRssMB: 512,
        shards: 4,
        recordedAtMs: 1700000000000,
      });
    });
  });
});
