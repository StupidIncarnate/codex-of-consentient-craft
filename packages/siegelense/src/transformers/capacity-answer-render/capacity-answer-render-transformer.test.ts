import { CapacityAnswerStub } from '../../contracts/capacity-answer/capacity-answer.stub';
import { CapacityMeasuredStub } from '../../contracts/capacity-measured/capacity-measured.stub';
import { CapacityProfileStub } from '../../contracts/capacity-profile/capacity-profile.stub';
import { capacityAnswerRenderTransformer } from './capacity-answer-render-transformer';

describe('capacityAnswerRenderTransformer', () => {
  describe('measured profile present', () => {
    it('VALID: {answer with profile} => renders suggested, spec from profile, why, host stats, and profile sample stats', () => {
      const answer = CapacityAnswerStub({
        suggested: 2,
        ceiling: 3,
        why: 'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; free RAM 5320MB less 512MB headroom; 1 siege instance already up',
        measured: CapacityMeasuredStub({
          freeMemMB: 5320,
          cores: 8,
          loadAvg1: 4.2,
          diskFreeMB: 41_000,
        }),
        profile: CapacityProfileStub({
          spec: 'dungeonmaster-stack',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        }),
      });

      const result = capacityAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'SUGGESTED: 2 instances (ceiling: 3)\n' +
          'SPEC: dungeonmaster-stack\n' +
          'WHY: profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; free RAM 5320MB less 512MB headroom; 1 siege instance already up\n' +
          'HOST: free 5320MB mem, 8 cores, load 4.2, free disk 41000MB\n' +
          'PROFILE: pool 1, steady 1800MB, peak 2600MB (from 9 runs)\n',
      );
    });
  });

  describe('no measured profile recorded', () => {
    it('EMPTY: {profile: null, diskFreeMB: null} => renders spec extracted from why, -MB for disk, and no profile recorded message', () => {
      const answer = CapacityAnswerStub({
        suggested: 2,
        ceiling: 3,
        why: 'no measured profile for dungeonmaster-api, so the default pair of 2 profiles itself; free RAM 5320MB less 512MB headroom; nothing else up',
        measured: CapacityMeasuredStub({
          freeMemMB: 4000,
          cores: 4,
          loadAvg1: 1.5,
          diskFreeMB: null,
        }),
        profile: null,
      });

      const result = capacityAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'SUGGESTED: 2 instances (ceiling: 3)\n' +
          'SPEC: dungeonmaster-api\n' +
          'WHY: no measured profile for dungeonmaster-api, so the default pair of 2 profiles itself; free RAM 5320MB less 512MB headroom; nothing else up\n' +
          'HOST: free 4000MB mem, 4 cores, load 1.5, free disk -MB\n' +
          'PROFILE: no profile samples recorded\n',
      );
    });

    it('EDGE: {profile: null, why with no spec clause} => falls back to "-" for spec', () => {
      const answer = CapacityAnswerStub({
        suggested: 0,
        ceiling: 3,
        why: 'custom reason with no spec name',
        measured: CapacityMeasuredStub({
          freeMemMB: 100,
          cores: 2,
          loadAvg1: 0.5,
          diskFreeMB: 500,
        }),
        profile: null,
      });

      const result = capacityAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'SUGGESTED: 0 instances (ceiling: 3)\n' +
          'SPEC: -\n' +
          'WHY: custom reason with no spec name\n' +
          'HOST: free 100MB mem, 2 cores, load 0.5, free disk 500MB\n' +
          'PROFILE: no profile samples recorded\n',
      );
    });
  });
});
