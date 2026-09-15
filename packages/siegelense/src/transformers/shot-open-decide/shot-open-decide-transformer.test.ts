import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ShotListingStub } from '../../contracts/shot-listing/shot-listing.stub';
import { ShotOpenReasonStub } from '../../contracts/shot-open-reason/shot-open-reason.stub';
import { StepIndexStub } from '../../contracts/step-index/step-index.stub';

import { shotOpenDecideTransformer } from './shot-open-decide-transformer';

const rawShot = ({
  step,
  open,
  why,
}: {
  step: number;
  open: boolean;
  why: 'start' | 'end' | 'failed' | null;
}): ReturnType<typeof ShotListingStub> =>
  ShotListingStub({
    step: StepIndexStub({ value: step }),
    path: AbsoluteFilePathStub({
      value: `/repo/.siegelense/.../runs/run_1/step${String(step)}.png`,
    }),
    open,
    why: why === null ? null : ShotOpenReasonStub({ value: why }),
  });

describe('shotOpenDecideTransformer', () => {
  describe('a clean run, no failure', () => {
    it('VALID: {three shots, failedStep null} => first and last open with their why, middle closed', () => {
      const shots = [
        rawShot({ step: 1, open: false, why: null }),
        rawShot({ step: 2, open: false, why: null }),
        rawShot({ step: 3, open: false, why: null }),
      ];

      const result = shotOpenDecideTransformer({ shots, failedStep: null });

      expect(result).toStrictEqual([
        rawShot({ step: 1, open: true, why: 'start' }),
        rawShot({ step: 2, open: false, why: null }),
        rawShot({ step: 3, open: true, why: 'end' }),
      ]);
    });
  });

  describe('a single shot', () => {
    it('EDGE: {one shot, failedStep null} => it is both first and last, and opens as start', () => {
      const shots = [rawShot({ step: 1, open: false, why: null })];

      const result = shotOpenDecideTransformer({ shots, failedStep: null });

      expect(result).toStrictEqual([rawShot({ step: 1, open: true, why: 'start' })]);
    });
  });

  describe('a failing run', () => {
    it('VALID: {five shots, failedStep 3} => the failing step opens with why failed', () => {
      const shots = [
        rawShot({ step: 1, open: false, why: null }),
        rawShot({ step: 2, open: false, why: null }),
        rawShot({ step: 3, open: false, why: null }),
        rawShot({ step: 4, open: false, why: null }),
        rawShot({ step: 5, open: false, why: null }),
      ];

      const result = shotOpenDecideTransformer({ shots, failedStep: StepIndexStub({ value: 3 }) });

      expect(result).toStrictEqual([
        rawShot({ step: 1, open: true, why: 'start' }),
        rawShot({ step: 2, open: false, why: null }),
        rawShot({ step: 3, open: true, why: 'failed' }),
        rawShot({ step: 4, open: false, why: null }),
        rawShot({ step: 5, open: true, why: 'end' }),
      ]);
    });

    it('VALID: {failedStep is also the first shot} => reports failed, not start', () => {
      const shots = [
        rawShot({ step: 1, open: false, why: null }),
        rawShot({ step: 2, open: false, why: null }),
      ];

      const result = shotOpenDecideTransformer({ shots, failedStep: StepIndexStub({ value: 1 }) });

      expect(result).toStrictEqual([
        rawShot({ step: 1, open: true, why: 'failed' }),
        rawShot({ step: 2, open: true, why: 'end' }),
      ]);
    });
  });

  describe('no shots at all', () => {
    it('EMPTY: {shots: []} => returns an empty list', () => {
      const result = shotOpenDecideTransformer({ shots: [], failedStep: null });

      expect(result).toStrictEqual([]);
    });
  });
});
