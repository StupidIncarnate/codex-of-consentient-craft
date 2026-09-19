import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { RunResultStub } from '../../contracts/run-result/run-result.stub';
import { RunStatusStub } from '../../contracts/run-status/run-status.stub';
import { ShotListingStub } from '../../contracts/shot-listing/shot-listing.stub';
import { StepIndexStub } from '../../contracts/step-index/step-index.stub';
import { StoppedAtStub } from '../../contracts/stopped-at/stopped-at.stub';
import { runAnswerRenderTransformer } from './run-answer-render-transformer';

describe('runAnswerRenderTransformer', () => {
  describe('a clean done run', () => {
    it('VALID: {status: done, shots: []} => renders single line with 0ms duration default', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_1' }),
        status: RunStatusStub({ value: 'done' }),
        stepsRun: StepIndexStub({ value: 5 }),
        stoppedAt: null,
        shots: [],
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe('RUN: run_1 (status: done, steps: 5, duration: 0ms)\n');
    });

    it('VALID: {status: done, durationMs: 250} => renders line with measured duration', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_2' }),
        status: RunStatusStub({ value: 'done' }),
        stepsRun: StepIndexStub({ value: 3 }),
        stoppedAt: null,
        shots: [],
        durationMs: 250,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe('RUN: run_2 (status: done, steps: 3, duration: 250ms)\n');
    });
  });

  describe('a failing run with stoppedAt', () => {
    it('VALID: {stoppedAt} => renders STOPPED AT line with step, verb and error', () => {
      const stoppedAt = StoppedAtStub({
        step: StepIndexStub({ value: 4 }),
        verb: 'click',
        error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
        candidates: [],
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_3' }),
        status: RunStatusStub({ value: 'failed' }),
        stepsRun: StepIndexStub({ value: 3 }),
        stoppedAt,
        shots: [],
        durationMs: 120,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_3 (status: failed, steps: 3, duration: 120ms)\n' +
          'STOPPED AT: step 4 (click) — AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]\n',
      );
    });
  });

  describe('a run with screenshots', () => {
    it('VALID: {shots with one screenshot} => renders SCREENSHOTS line with filename and path', () => {
      const shot = ShotListingStub({
        step: StepIndexStub({ value: 1 }),
        path: AbsoluteFilePathStub({ value: '/repo/.siegelense/runs/run_1/step1.png' }),
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_1' }),
        status: RunStatusStub({ value: 'done' }),
        stepsRun: StepIndexStub({ value: 1 }),
        stoppedAt: null,
        shots: [shot],
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_1 (status: done, steps: 1, duration: 0ms)\n' +
          'SCREENSHOTS: step1.png (/repo/.siegelense/runs/run_1/step1.png)\n',
      );
    });

    it('VALID: {stoppedAt and shots} => renders header, stopped line, and screenshots line', () => {
      const shot1 = ShotListingStub({
        step: StepIndexStub({ value: 1 }),
        path: AbsoluteFilePathStub({ value: '/repo/.siegelense/runs/run_4/step1.png' }),
      });
      const shot2 = ShotListingStub({
        step: StepIndexStub({ value: 2 }),
        path: AbsoluteFilePathStub({ value: '/repo/.siegelense/runs/run_4/step2_error.png' }),
      });
      const stoppedAt = StoppedAtStub({
        step: StepIndexStub({ value: 2 }),
        verb: 'waitFor',
        error: 'timeout waiting for element',
        candidates: [],
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_4' }),
        status: RunStatusStub({ value: 'timeout' }),
        stepsRun: StepIndexStub({ value: 2 }),
        stoppedAt,
        shots: [shot1, shot2],
        durationMs: 5000,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_4 (status: timeout, steps: 2, duration: 5000ms)\n' +
          'STOPPED AT: step 2 (waitFor) — timeout waiting for element\n' +
          'SCREENSHOTS: step1.png (/repo/.siegelense/runs/run_4/step1.png), step2_error.png (/repo/.siegelense/runs/run_4/step2_error.png)\n',
      );
    });
  });
});
