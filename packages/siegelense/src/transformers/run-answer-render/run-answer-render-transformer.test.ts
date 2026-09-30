import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { RunResultStub } from '../../contracts/run-result/run-result.stub';
import { ShotListingStub } from '../../contracts/shot-listing/shot-listing.stub';
import { StopOnStub } from '../../contracts/stop-on/stop-on.stub';
import { StoppedAtStub } from '../../contracts/stopped-at/stopped-at.stub';
import { runAnswerRenderTransformer } from './run-answer-render-transformer';
import { RunStatusStub } from '../../contracts/run-status/run-status.stub';

describe('runAnswerRenderTransformer', () => {
  describe('a clean done run', () => {
    it('VALID: {status: done, shots: []} => renders single line with 0ms duration default', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_1' }),
        status: 'done',
        stepsRun: 5,
        stoppedAt: null,
        shots: [],
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe('RUN: run_1 (status: done, steps: 5, duration: 0ms)\n');
    });

    it('VALID: {status: done, durationMs: 250} => renders line with measured duration', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_2' }),
        status: 'done',
        stepsRun: 3,
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
        step: 4,
        verb: 'click',
        error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
        candidates: [],
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_3' }),
        status: 'failed',
        stepsRun: 3,
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

    it('VALID: {stoppedAt, stopOn error, failedSteps 1} => renders STOPPED AT with no continuation note', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_7' }),
        status: RunStatusStub({ value: 'timeout' }),
        stepsRun: 1,
        stoppedAt: StoppedAtStub({
          step: 1,
          verb: 'waitFor',
          error: 'visible [data-testid="NOPE"] never resolved in 2000ms',
          candidates: [],
        }),
        shots: [],
        durationMs: 2004,
        stopOn: StopOnStub({ value: 'error' }),
        failedSteps: 1,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_7 (status: timeout, steps: 1, duration: 2004ms)\n' +
          'STOPPED AT: step 1 (waitFor) — visible [data-testid="NOPE"] never resolved in 2000ms\n',
      );
    });

    it('VALID: {stoppedAt, stopOn never, failedSteps 1} => renders FIRST FAILURE with the continuation note, never STOPPED AT', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_26' }),
        status: RunStatusStub({ value: 'failed' }),
        stepsRun: 3,
        stoppedAt: StoppedAtStub({
          step: 2,
          verb: 'click',
          error: 'NO MATCH: 0 elements match target [data-testid="NOPE"]',
          candidates: [],
        }),
        shots: [],
        durationMs: 310,
        stopOn: StopOnStub({ value: 'never' }),
        failedSteps: 1,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_26 (status: failed, steps: 3, duration: 310ms)\n' +
          'FIRST FAILURE: step 2 (click) — NO MATCH: 0 elements match target [data-testid="NOPE"] (continued: --stop-on never)\n',
      );
    });

    it('VALID: {stoppedAt, stopOn never, failedSteps 3} => renders FIRST FAILURE with the continuation note and the failed-step count', () => {
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_27' }),
        status: RunStatusStub({ value: 'failed' }),
        stepsRun: 5,
        stoppedAt: StoppedAtStub({
          step: 2,
          verb: 'click',
          error: 'boom',
          candidates: [],
        }),
        shots: [],
        durationMs: 500,
        stopOn: StopOnStub({ value: 'never' }),
        failedSteps: 3,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_27 (status: failed, steps: 5, duration: 500ms)\n' +
          'FIRST FAILURE: step 2 (click) — boom (continued: --stop-on never; 3 steps failed)\n',
      );
    });
  });

  describe('a run with screenshots', () => {
    it('VALID: {shots with one screenshot} => renders SCREENSHOTS line with filename and path', () => {
      const shot = ShotListingStub({
        step: 1,
        path: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1.png',
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_1' }),
        status: 'done',
        stepsRun: 1,
        stoppedAt: null,
        shots: [shot],
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_1 (status: done, steps: 1, duration: 0ms)\n' +
          'SCREENSHOTS: step1.png (/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1.png)\n',
      );
    });

    it('VALID: {one blank shot, one not} => flags only the blank shot BLANK with its colour', () => {
      const blankShot = ShotListingStub({
        step: 1,
        path: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_25/step1.png',
        blank: true,
        blankColour: '#ffffff',
      });
      const paintedShot = ShotListingStub({
        step: 2,
        path: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_25/step2.png',
        blank: false,
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_25' }),
        status: RunStatusStub({ value: 'done' }),
        stepsRun: 2,
        stoppedAt: null,
        shots: [blankShot, paintedShot],
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_25 (status: done, steps: 2, duration: 0ms)\n' +
          'SCREENSHOTS: step1.png (/repo/.dungeonmaster-assets/siegelense-assets/runs/run_25/step1.png) BLANK (#ffffff), step2.png (/repo/.dungeonmaster-assets/siegelense-assets/runs/run_25/step2.png)\n',
      );
    });

    it('VALID: {blank shot with no colour} => flags BLANK alone', () => {
      const shot = ShotListingStub({
        step: 1,
        path: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_25/step1.png',
        blank: true,
        blankColour: null,
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_25' }),
        status: RunStatusStub({ value: 'done' }),
        stepsRun: 1,
        stoppedAt: null,
        shots: [shot],
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_25 (status: done, steps: 1, duration: 0ms)\n' +
          'SCREENSHOTS: step1.png (/repo/.dungeonmaster-assets/siegelense-assets/runs/run_25/step1.png) BLANK\n',
      );
    });

    it('VALID: {stoppedAt and shots} => renders header, stopped line, and screenshots line', () => {
      const shot1 = ShotListingStub({
        step: 1,
        path: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_4/step1.png',
      });
      const shot2 = ShotListingStub({
        step: 2,
        path: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_4/step2_error.png',
      });
      const stoppedAt = StoppedAtStub({
        step: 2,
        verb: 'waitFor',
        error: 'timeout waiting for element',
        candidates: [],
      });
      const result = RunResultStub({
        runId: RunIdStub({ value: 'run_4' }),
        status: 'timeout',
        stepsRun: 2,
        stoppedAt,
        shots: [shot1, shot2],
        durationMs: 5000,
      });

      const output = runAnswerRenderTransformer({ result });

      expect(output).toBe(
        'RUN: run_4 (status: timeout, steps: 2, duration: 5000ms)\n' +
          'STOPPED AT: step 2 (waitFor) — timeout waiting for element\n' +
          'SCREENSHOTS: step1.png (/repo/.dungeonmaster-assets/siegelense-assets/runs/run_4/step1.png), step2_error.png (/repo/.dungeonmaster-assets/siegelense-assets/runs/run_4/step2_error.png)\n',
      );
    });
  });
});
